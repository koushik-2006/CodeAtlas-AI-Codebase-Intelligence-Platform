import { SAMPLE_PROJECT_TREE, SAMPLE_PROJECT_CODE } from "@/lib/sample-repository-files";
import { FileItem } from "@/components/code-viewer/RepositoryFileTree";
import { apiClient } from "./api-client";

class SourceFileService {
  /**
   * Retrieves the repository file tree structure.
   */
  async getRepositoryFileTree(repositoryId: string = "sample-project"): Promise<FileItem[]> {
    try {
      const res = await apiClient.get<Array<{ path: string; name: string; language: string; size: number }>>(
        `/repositories/${repositoryId}/files`
      );

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return this.buildTreeFromPaths(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch repository files:", err);
    }

    if (repositoryId === "sample-project") {
      return SAMPLE_PROJECT_TREE;
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
    try {
      const res = await apiClient.get<{
        path: string;
        name: string;
        language: string;
        content: string;
        lineCount: number;
      }>(`/repositories/${repositoryId}/files?path=${encodeURIComponent(filePath)}`);

      if (res.success && res.data && res.data.content) {
        return {
          code: res.data.content,
          language: res.data.language,
          lineCount: res.data.lineCount,
        };
      }
    } catch (err) {
      console.warn("Failed to fetch remote file content:", err);
    }

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

    return {
      code: `// ${filePath}\n// File content could not be loaded from ${repositoryId}.`,
      language: "text",
      lineCount: 2,
    };
  }
}

export const sourceFileService = new SourceFileService();
