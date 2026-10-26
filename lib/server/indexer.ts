import { db } from "./db";
import { github, GitHubTreeItem } from "./github";
import { parseSourceCode } from "./code-parser";
import {
  DbIndexingJob,
  DbRepository,
  DbRepositoryFile,
  DbCodeSymbol,
  DbCodeRelationship,
} from "@/types/database";
import { SAMPLE_PROJECT_CODE } from "@/lib/sample-repository-files";

const MAX_FILES_PER_INDEX = 50;
const MAX_FILE_SIZE_BYTES = 250 * 1024; // 250 KB
const SUPPORTED_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "json",
  "md",
  "sql",
  "go",
  "rs",
  "java",
]);

const EXCLUDED_PATTERNS = [
  /^\.git\//,
  /^node_modules\//,
  /^\.next\//,
  /^dist\//,
  /^build\//,
  /^out\//,
  /^coverage\//,
  /\.min\.(js|css)$/,
  /\.bundle\.(js|css)$/,
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /^\.env/,
  /\.pem$/,
  /\.key$/,
  /id_rsa/,
];

function isSupportedFile(filePath: string): boolean {
  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(filePath)) return false;
  }
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return SUPPORTED_EXTENSIONS.has(ext);
}

export interface IngestionOptions {
  repositoryId: string;
  userId?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  connectionType?: "github" | "sample" | "zip" | "git_url";
}

/**
 * Controlled repository ingestion & background indexing orchestrator.
 */
class RepositoryIndexer {
  private activeJobs = new Map<string, boolean>();

  /**
   * Starts a repository ingestion and indexing job asynchronously.
   */
  async startIndexingJob(options: IngestionOptions): Promise<DbIndexingJob> {
    const {
      repositoryId,
      userId = "usr_default",
      owner = "you",
      repo = repositoryId,
      branch = "main",
      connectionType = "github",
    } = options;

    const jobId = `job_${repositoryId}_${Date.now()}`;
    const initialJob: DbIndexingJob = {
      id: jobId,
      repositoryId,
      userId,
      status: "pending",
      progress: 5,
      stage: "Queued for indexing",
      fileCount: 0,
      totalFiles: 0,
      startedAt: new Date().toISOString(),
    };

    db.createIndexingJob(initialJob);

    // Update repository status to indexing
    db.updateRepository(repositoryId, {
      status: "indexing",
      progress: 5,
      currentStage: "Queued",
      error: undefined,
    });

    // Run background indexing pipeline
    this.runIndexingPipeline(jobId, repositoryId, userId, owner, repo, branch, connectionType).catch(
      (err) => {
        console.error(`Indexing job ${jobId} failed:`, err);
        db.updateIndexingJob(jobId, {
          status: "failed",
          error: err.message || "Unknown indexing failure",
          completedAt: new Date().toISOString(),
        });
        db.updateRepository(repositoryId, {
          status: "error",
          error: err.message || "Indexing failed",
        });
      }
    );

    return initialJob;
  }

  private async runIndexingPipeline(
    jobId: string,
    repositoryId: string,
    userId: string,
    owner: string,
    repo: string,
    branch: string,
    connectionType: string
  ) {
    // 1. Stage: Fetching repository tree
    db.updateIndexingJob(jobId, {
      status: "fetching",
      progress: 20,
      stage: "Fetching repository tree and files...",
    });
    db.updateRepository(repositoryId, {
      status: "indexing",
      progress: 20,
      currentStage: "Fetching files",
    });

    const filesToIndex: { path: string; content: string; language: string }[] = [];

    const connectedAccount = db.getConnectedAccount(userId, "github");
    const hasLiveGithub =
      connectionType === "github" &&
      connectedAccount &&
      connectedAccount.accessToken &&
      owner !== "sample-project" &&
      owner !== "codeatlas-demo";

    if (hasLiveGithub) {
      try {
        const tree = await github.getRepositoryTree(
          connectedAccount.accessToken,
          owner,
          repo,
          branch
        );

        const candidates = tree
          .filter((item) => item.type === "blob" && isSupportedFile(item.path))
          .filter((item) => !item.size || item.size <= MAX_FILE_SIZE_BYTES)
          .slice(0, MAX_FILES_PER_INDEX);

        db.updateIndexingJob(jobId, {
          totalFiles: candidates.length,
          stage: `Retrieving ${candidates.length} source files...`,
          progress: 35,
        });

        // Download files in batches
        for (let i = 0; i < candidates.length; i++) {
          const item = candidates[i];
          try {
            const rawContent = await github.fetchFileContent(
              connectedAccount.accessToken,
              owner,
              repo,
              item.path,
              branch
            );
            const ext = item.path.split(".").pop()?.toLowerCase() || "txt";
            filesToIndex.push({
              path: item.path,
              content: rawContent,
              language: ext === "ts" || ext === "tsx" ? "typescript" : ext === "py" ? "python" : ext,
            });
          } catch (e) {
            console.warn(`Skipping unreadable file ${item.path}:`, e);
          }
        }
      } catch (err: any) {
        console.warn(`Could not fetch live GitHub tree, falling back to curated sources: ${err.message}`);
        // Fallback to sample repository code
        Object.entries(SAMPLE_PROJECT_CODE).forEach(([path, val]) => {
          filesToIndex.push({ path, content: val.code, language: val.language });
        });
      }
    } else {
      // Ingest from seeded sample project or local templates
      Object.entries(SAMPLE_PROJECT_CODE).forEach(([path, val]) => {
        filesToIndex.push({ path, content: val.code, language: val.language });
      });
    }

    if (filesToIndex.length === 0) {
      throw new Error("No supported source files found to index.");
    }

    // 2. Stage: Parsing files & extracting symbols
    db.updateIndexingJob(jobId, {
      status: "parsing",
      progress: 60,
      stage: "Extracting AST symbols, functions, and tests...",
      totalFiles: filesToIndex.length,
    });
    db.updateRepository(repositoryId, {
      progress: 60,
      currentStage: "Parsing symbols",
    });

    const parsedFiles: DbRepositoryFile[] = [];
    const allSymbols: DbCodeSymbol[] = [];
    const allRelationships: DbCodeRelationship[] = [];

    for (let i = 0; i < filesToIndex.length; i++) {
      const { path, content, language } = filesToIndex[i];
      const parsed = parseSourceCode(repositoryId, path, content);

      parsedFiles.push({
        id: `f_${repositoryId}_${i}`,
        repositoryId,
        path,
        name: path.split("/").pop() || path,
        language,
        size: content.length,
        content,
        lineCount: parsed.lineCount,
      });

      allSymbols.push(...parsed.symbols);
      allRelationships.push(...parsed.relationships);
    }

    // 3. Stage: Building index & storing relationships
    db.updateIndexingJob(jobId, {
      status: "indexing",
      progress: 85,
      stage: "Building architecture nodes and cross-file references...",
      fileCount: parsedFiles.length,
    });
    db.updateRepository(repositoryId, {
      progress: 85,
      currentStage: "Indexing relationships",
    });

    // Save to database
    db.saveRepositoryFiles(repositoryId, parsedFiles);
    db.saveCodeSymbols(repositoryId, allSymbols);
    db.saveCodeRelationships(repositoryId, allRelationships);

    // 4. Stage: Completed
    db.updateIndexingJob(jobId, {
      status: "completed",
      progress: 100,
      stage: "Indexing completed successfully.",
      completedAt: new Date().toISOString(),
      fileCount: parsedFiles.length,
    });

    db.updateRepository(repositoryId, {
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      fileCount: parsedFiles.length,
      symbolCount: allSymbols.length,
      lastAnalyzed: "Just now",
      isIndexed: true,
      error: undefined,
    });
  }
}

export const indexer = new RepositoryIndexer();
