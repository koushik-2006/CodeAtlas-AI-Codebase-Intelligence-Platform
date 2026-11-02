import { SAMPLE_PROJECT_TREE, SAMPLE_PROJECT_CODE } from "@/lib/sample-repository-files";
import { FileItem } from "@/components/code-viewer/RepositoryFileTree";
import { apiClient } from "./api-client";
import { getStore, saveStore } from "@/lib/demo/store";
import { repoCache } from "@/lib/indexeddb-cache";
import { githubMetadataService } from "./github-metadata-service";
import { symbolExtractor } from "./symbol-extractor";

class SourceFileService {
  /**
   * Retrieves the repository file tree structure.
   */
  async getRepositoryFileTree(repositoryId: string = "sample-project"): Promise<FileItem[]> {
    // 1. Try Central Store first (persisted in localStorage)
    if (typeof window !== "undefined") {
      try {
        const store = getStore();
        if (store.repositoryTrees && store.repositoryTrees[repositoryId]) {
          const tree = store.repositoryTrees[repositoryId];
          if (Array.isArray(tree) && tree.length > 0) {
            return tree as unknown as FileItem[];
          }
        }
      } catch (e) {
        console.warn("Failed to read tree from central store:", e);
      }
    }

    // 2. Try IndexedDB cache
    try {
      const cachedTree = await repoCache.getTree(repositoryId);
      if (cachedTree && Array.isArray(cachedTree) && cachedTree.length > 0) {
        return cachedTree as unknown as FileItem[];
      }
    } catch (e) {
      console.warn("Failed to read tree from IndexedDB:", e);
    }

    // 3. Try remote backend API
    try {
      const res = await apiClient.get<Array<{ path: string; name: string; language: string; size: number }>>(
        `/repositories/${repositoryId}/files`
      );

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return this.buildTreeFromPaths(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch repository files from API:", err);
    }

    // 4. Sample project fallback
    if (repositoryId === "sample-project") {
      return SAMPLE_PROJECT_TREE;
    }

    // 5. On-demand fetch if this is a known GitHub repository
    if (typeof window !== "undefined") {
      try {
        const store = getStore();
        const repo = store.repositories.find((r) => r.id === repositoryId);
        let owner = repo?.owner;
        let name = repo?.name;
        let branch = repo?.branch || "main";

        if (!owner) {
          if (repositoryId === "tourist-management-system") {
            owner = "koushik-2006";
            name = "Tourist-Management-System";
            branch = "main";
          } else if (repositoryId === "ai-driven-inspection-of-institutions" || repositoryId.includes("inspection")) {
            owner = "koushik-2006";
            name = "AI-Driven-Inspection-of-Institutions";
            branch = "main";
          }
        }

        if (owner && name && owner !== "you" && owner !== "codeatlas-demo") {
          const rawTree = await githubMetadataService.fetchFileTree(
            owner,
            name,
            branch
          );
          if (rawTree.length > 0) {
            const files = rawTree
              .filter((item) => item.type === "blob")
              .map((item) => ({
                path: item.path,
                name: item.path.split("/").pop() || item.path,
                language: symbolExtractor.detectLanguage(item.path),
                size: item.size || 0,
              }));
            const built = this.buildTreeFromPaths(files);
            if (built.length > 0) {
              store.repositoryTrees[repositoryId] = built as any;
              saveStore(store);
              await repoCache.setTree(repositoryId, built);
              return built;
            }
          }
        }
      } catch (err) {
        console.warn("On-demand GitHub tree fetch failed:", err);
      }
    }

    return [];
  }

  /**
   * Converts a flat list of files with paths into a sorted, nested FileItem tree.
   * Folders are sorted before files, with alphabetical ordering within each group.
   */
  private buildTreeFromPaths(
    files: Array<{ path: string; name: string; language: string; size: number }>
  ): FileItem[] {
    const rootNodes: Record<string, FileItem> = {};

    for (const f of files) {
      const parts = f.path.split("/");
      let currentPath = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const prevPath = currentPath;
        currentPath = prevPath ? `${prevPath}/${part}` : part;

        if (isFile) {
          const fileNode: FileItem = {
            id: currentPath,
            name: part,
            path: currentPath,
            type: "file",
            language: f.language,
            size: f.size > 1024 ? `${(f.size / 1024).toFixed(1)} KB` : `${f.size} B`,
          };

          if (prevPath && rootNodes[prevPath]) {
            rootNodes[prevPath].children = rootNodes[prevPath].children || [];
            if (!rootNodes[prevPath].children?.some((c) => c.path === currentPath)) {
              rootNodes[prevPath].children!.push(fileNode);
            }
          } else {
            rootNodes[currentPath] = fileNode;
          }
        } else {
          // Directory
          if (!rootNodes[currentPath]) {
            const dirNode: FileItem = {
              id: currentPath,
              name: part,
              path: currentPath,
              type: "folder",
              children: [],
            };
            rootNodes[currentPath] = dirNode;

            if (prevPath && rootNodes[prevPath]) {
              rootNodes[prevPath].children = rootNodes[prevPath].children || [];
              if (!rootNodes[prevPath].children?.some((c) => c.path === currentPath)) {
                rootNodes[prevPath].children!.push(dirNode);
              }
            }
          }
        }
      }
    }

    // Top-level nodes (those without parent directory)
    const topLevelNodes = Object.values(rootNodes).filter((n) => !n.path.includes("/"));
    return this.sortTreeNodes(topLevelNodes);
  }

  /**
   * Sorts tree nodes recursively: folders first, then files, both alphabetically.
   */
  private sortTreeNodes(nodes: FileItem[]): FileItem[] {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.sortTreeNodes(node.children);
      }
    }
    return nodes;
  }

  /**
   * Retrieves source code and metadata for a given path in the repository.
   */
  async getFileContent(
    repositoryId: string = "sample-project",
    filePath: string
  ): Promise<{ code: string; language: string; lineCount: number } | null> {
    if (!filePath) return null;

    // 1. Try Central Store first (only if non-empty real code)
    if (typeof window !== "undefined") {
      try {
        const store = getStore();
        const repoFiles = store.repositoryFiles?.[repositoryId];
        if (repoFiles && repoFiles[filePath]) {
          const entry = repoFiles[filePath];
          if (entry.code && entry.code.trim().length > 0) {
            return {
              code: entry.code,
              language: entry.language || symbolExtractor.detectLanguage(filePath),
              lineCount: entry.code.split("\n").length,
            };
          }
        }
      } catch (e) {
        console.warn("Failed to read file from central store:", e);
      }
    }

    // 2. Try IndexedDB cache (only if non-empty)
    try {
      const cached = await repoCache.getFile(`${repositoryId}:${filePath}`);
      if (cached && typeof cached === "string" && cached.trim().length > 0) {
        const lang = symbolExtractor.detectLanguage(filePath);
        return {
          code: cached,
          language: lang,
          lineCount: cached.split("\n").length,
        };
      }
    } catch (e) {
      console.warn("Failed to read file from IndexedDB cache:", e);
    }

    // 3. Try sample project static dictionary
    if (repositoryId === "sample-project") {
      const entry = SAMPLE_PROJECT_CODE[filePath];
      if (entry) {
        return {
          code: entry.code,
          language: entry.language,
          lineCount: entry.code.split("\n").length,
        };
      }
    }

    // 4. Direct Next.js relative fetch (guaranteed lowest latency <10ms and clean unwrapping)
    if (typeof window !== "undefined") {
      try {
        const directRes = await fetch(
          `/api/repositories/${encodeURIComponent(repositoryId)}/files?path=${encodeURIComponent(filePath)}`
        );
        if (directRes.ok) {
          const json = await directRes.json();
          const fileData = json.data !== undefined ? json.data : json;
          if (fileData && typeof fileData.content === "string") {
            const lang = fileData.language || symbolExtractor.detectLanguage(filePath);
            try {
              const store = getStore();
              if (!store.repositoryFiles) store.repositoryFiles = {};
              if (!store.repositoryFiles[repositoryId]) store.repositoryFiles[repositoryId] = {};
              store.repositoryFiles[repositoryId][filePath] = { code: fileData.content, language: lang };
              saveStore(store);
            } catch {}
            return {
              code: fileData.content,
              language: lang,
              lineCount: fileData.lineCount || fileData.content.split("\n").length,
            };
          }
        }
      } catch (directErr) {
        console.warn("Direct file fetch failed, trying apiClient fallback:", directErr);
      }
    }

    // 5. Fallback via apiClient
    try {
      const res = await apiClient.get<{
        path: string;
        name: string;
        language: string;
        content: string;
        lineCount: number;
      }>(`/repositories/${repositoryId}/files?path=${encodeURIComponent(filePath)}`);

      const fileData = (res.data as any)?.data !== undefined ? (res.data as any).data : res.data;
      if (res.success && fileData && typeof fileData.content === "string") {
        return {
          code: fileData.content,
          language: fileData.language || symbolExtractor.detectLanguage(filePath),
          lineCount: fileData.lineCount || fileData.content.split("\n").length,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch remote file content from API:", err);
    }

    // 6. On-demand CDN fetch if this is a known GitHub repository
    if (typeof window !== "undefined") {
      try {
        const store = getStore();
        const repo = store.repositories.find((r) => r.id === repositoryId);
        let owner = repo?.owner;
        let name = repo?.name;
        let branch = repo?.branch || "main";

        if (!owner) {
          if (repositoryId === "tourist-management-system") {
            owner = "koushik-2006";
            name = "Tourist-Management-System";
            branch = "main";
          } else if (repositoryId === "ai-driven-inspection-of-institutions" || repositoryId.includes("inspection")) {
            owner = "koushik-2006";
            name = "AI-Driven-Inspection-of-Institutions";
            branch = "main";
          }
        }

        if (owner && name && owner !== "you" && owner !== "codeatlas-demo") {
          const content = await githubMetadataService.fetchFileContent(
            owner,
            name,
            branch,
            filePath
          );
          if (content !== null) {
            const lang = symbolExtractor.detectLanguage(filePath);
            if (!store.repositoryFiles[repositoryId]) {
              store.repositoryFiles[repositoryId] = {};
            }
            store.repositoryFiles[repositoryId][filePath] = { code: content, language: lang };
            saveStore(store);
            await repoCache.setFile(`${repositoryId}:${filePath}`, content);
            return {
              code: content,
              language: lang,
              lineCount: content.split("\n").length,
            };
          }
        }
      } catch (err) {
        console.warn("On-demand GitHub file fetch failed:", err);
      }
    }

    return {
      code: `// ${filePath}\n// File content could not be loaded from ${repositoryId}.\n// Ensure this repository is indexed or verify network connection.`,
      language: "text",
      lineCount: 3,
    };
  }
}

export const sourceFileService = new SourceFileService();
