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
      console.warn("Falling back to sample repository tree:", err);
    }

    return SAMPLE_PROJECT_TREE;
  }

  /**
   * Converts a flat list of files with paths into a nested FileItem tree.
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

    // Only return top-level nodes (those without parent in path)
    return Object.values(rootNodes).filter((n) => !n.path.includes("/"));
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
      console.warn("Falling back to local file code:", err);
    }

    const entry = SAMPLE_PROJECT_CODE[filePath];
    if (!entry) {
      return {
        code: `// ${filePath}\n// File content not found in ${repositoryId}.`,
        language: "text",
        lineCount: 2,
      };
    }

    return {
      code: entry.code,
      language: entry.language,
      lineCount: entry.code.split("\n").length,
    };
  }
}

export const sourceFileService = new SourceFileService();
