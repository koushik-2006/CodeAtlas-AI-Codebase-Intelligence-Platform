/**
 * File classification and taxonomy engine for repository ingestion.
 * Categorizes repository files into source code, tests, configuration, documentation,
 * build/deployment, dependency manifests, static assets, and binaries.
 * Also provides multi-application structure detection (e.g. backend/ + frontend/).
 */

export type FileCategory =
  | "source"
  | "test"
  | "config"
  | "doc"
  | "build"
  | "manifest"
  | "asset"
  | "binary";

export interface FileClassification {
  path: string;
  name: string;
  category: FileCategory;
  language: string;
  isIndexable: boolean;
  isBinary: boolean;
  isSecretOrSensitive: boolean;
}

// Noise patterns to exclude completely from ingestion
const EXCLUDED_NOISE_PATTERNS = [
  /(?:^|\/)\.git\//,
  /(?:^|\/)node_modules\//,
  /(?:^|\/)\.next\//,
  /(?:^|\/)dist\//,
  /(?:^|\/)build\//,
  /(?:^|\/)out\//,
  /(?:^|\/)coverage\//,
  /(?:^|\/)\.turbo\//,
  /(?:^|\/)\.cache\//,
  /(?:^|\/)\.parcel-cache\//,
  /(?:^|\/)\.svelte-kit\//,
  /(?:^|\/)\.nuxt\//,
  /(?:^|\/)vendor\//,
  /(?:^|\/)__pycache__\//,
  /(?:^|\/)\.pytest_cache\//,
  /(?:^|\/)\.mypy_cache\//,
  /(?:^|\/)\.venv\//,
  /(?:^|\/)venv\//,
  /\.min\.(js|css)$/,
  /\.bundle\.(js|css)$/,
  /\.map$/,
];

// Sensitive or secret-bearing patterns to flag for protection
const SENSITIVE_PATTERNS = [
  /^\.env(?:\..+)?$/,
  /(?:^|\/)\.env(?:\..+)?$/,
  /\.pem$/,
  /\.key$/,
  /id_rsa/,
  /id_ed25519/,
  /credentials\.json$/,
  /service-account.*\.json$/,
  /client_secret.*\.json$/,
];

// Binary extensions that cannot be parsed as text
const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "tiff",
  "woff", "woff2", "ttf", "eot", "otf",
  "pdf", "zip", "tar", "gz", "tgz", "7z", "rar",
  "mp3", "mp4", "wav", "avi", "mov", "webm",
  "exe", "dll", "so", "dylib", "bin", "class", "jar", "war",
  "iso", "dmg", "pkg", "deb", "rpm", "pyc", "pyo",
]);

// Language mapping based on file extension
const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  pyw: "python",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  h: "c",
  hpp: "cpp",
  cs: "csharp",
  rb: "ruby",
  php: "php",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  json: "json",
  sql: "sql",
  md: "markdown",
  markdown: "markdown",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  xml: "xml",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  vue: "vue",
  svelte: "svelte",
  dockerfile: "dockerfile",
  makefile: "makefile",
  graphql: "graphql",
  gql: "graphql",
  prisma: "prisma",
  txt: "text",
};

/**
 * Checks whether a repository path is inside an excluded noise directory.
 */
export function isExcludedNoise(filePath: string): boolean {
  for (const pattern of EXCLUDED_NOISE_PATTERNS) {
    if (pattern.test(filePath)) return true;
  }
  return false;
}

/**
 * Checks if a file path may contain secrets or sensitive keys.
 */
export function isSensitiveFile(filePath: string): boolean {
  const fileName = filePath.split("/").pop() || filePath;
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(fileName) || pattern.test(filePath)) return true;
  }
  return false;
}

/**
 * Classifies a file path into its role, language, category, and indexability.
 */
export function classifyFile(filePath: string): FileClassification {
  const fileName = filePath.split("/").pop() || filePath;
  const lowerName = fileName.toLowerCase();
  const ext = lowerName.includes(".") ? lowerName.split(".").pop() || "" : "";

  const isSecret = isSensitiveFile(filePath);
  const isBin = BINARY_EXTENSIONS.has(ext);

  let category: FileCategory = "source";
  let language = EXTENSION_LANGUAGE_MAP[ext] || "text";

  if (lowerName === "dockerfile" || lowerName.startsWith("dockerfile.")) {
    language = "dockerfile";
    category = "build";
  } else if (lowerName === "makefile") {
    language = "makefile";
    category = "build";
  }

  // 1. Tests
  if (
    lowerName.includes(".test.") ||
    lowerName.includes(".spec.") ||
    filePath.includes("/tests/") ||
    filePath.includes("/test/") ||
    filePath.includes("/__tests__/") ||
    lowerName.startsWith("test_")
  ) {
    category = "test";
  }
  // 2. Dependency Manifests
  else if (
    lowerName === "package.json" ||
    lowerName === "package-lock.json" ||
    lowerName === "pnpm-lock.yaml" ||
    lowerName === "yarn.lock" ||
    lowerName === "requirements.txt" ||
    lowerName === "pipfile" ||
    lowerName === "go.mod" ||
    lowerName === "go.sum" ||
    lowerName === "cargo.toml" ||
    lowerName === "cargo.lock" ||
    lowerName === "composer.json" ||
    lowerName === "gemfile"
  ) {
    category = "manifest";
  }
  // 3. Build & Deployment
  else if (
    filePath.startsWith(".github/workflows/") ||
    filePath.startsWith(".github/actions/") ||
    lowerName === "dockerfile" ||
    lowerName.startsWith("dockerfile.") ||
    lowerName === "docker-compose.yml" ||
    lowerName === "docker-compose.yaml" ||
    lowerName === "makefile" ||
    lowerName === "procfile" ||
    lowerName === "netlify.toml" ||
    lowerName === "vercel.json"
  ) {
    category = "build";
  }
  // 4. Configuration
  else if (
    lowerName.endsWith(".config.js") ||
    lowerName.endsWith(".config.ts") ||
    lowerName.endsWith(".config.mjs") ||
    lowerName.endsWith(".config.cjs") ||
    lowerName.startsWith("tsconfig") ||
    lowerName.startsWith(".eslintrc") ||
    lowerName.startsWith(".prettierrc") ||
    lowerName.startsWith(".env.example") ||
    lowerName.endsWith(".ini") ||
    (ext === "json" && !lowerName.includes("data") && !lowerName.includes("generated")) ||
    (ext === "yaml" || ext === "yml") ||
    ext === "toml" ||
    ext === "xml"
  ) {
    category = "config";
  }
  // 5. Documentation
  else if (
    ext === "md" ||
    ext === "markdown" ||
    ext === "txt" ||
    ext === "rst" ||
    lowerName === "license" ||
    lowerName.startsWith("license.") ||
    lowerName.startsWith("readme") ||
    lowerName.startsWith("contributing") ||
    lowerName.startsWith("changelog") ||
    filePath.includes("/docs/") ||
    filePath.includes("/documentation/")
  ) {
    category = "doc";
  }
  // 6. Static Assets & Binaries
  else if (isBin) {
    category = "binary";
  } else if (
    ext === "svg" ||
    filePath.includes("/images/") ||
    filePath.includes("/assets/") ||
    filePath.includes("/public/images/")
  ) {
    category = "asset";
  }

  // Indexable if not binary, not sensitive, and is source/test/config/doc/manifest/build
  const isIndexable = !isBin && !isSecret && category !== "binary";

  return {
    path: filePath,
    name: fileName,
    category,
    language,
    isIndexable,
    isBinary: isBin,
    isSecretOrSensitive: isSecret,
  };
}

/**
 * Discovers architectural layout characteristics:
 * - Detects multiple applications (e.g. separate backend/ and frontend/ folders).
 * - Identifies primary package manifests.
 */
export function detectRepositoryArchitecture(filePaths: string[]): {
  hasFrontend: boolean;
  hasBackend: boolean;
  frontendPath?: string;
  backendPath?: string;
  isMonorepo: boolean;
  manifests: string[];
} {
  let hasFrontend = false;
  let hasBackend = false;
  let frontendPath: string | undefined;
  let backendPath: string | undefined;
  const manifests: string[] = [];

  for (const path of filePaths) {
    const lower = path.toLowerCase();
    if (lower.startsWith("frontend/") || lower.startsWith("client/") || lower.startsWith("web/") || lower.startsWith("ui/")) {
      hasFrontend = true;
      if (!frontendPath) frontendPath = path.split("/")[0];
    }
    if (lower.startsWith("backend/") || lower.startsWith("server/") || lower.startsWith("api/") || lower.startsWith("services/")) {
      hasBackend = true;
      if (!backendPath) backendPath = path.split("/")[0];
    }
    if (lower.endsWith("package.json") || lower.endsWith("requirements.txt") || lower.endsWith("go.mod") || lower.endsWith("cargo.toml")) {
      manifests.push(path);
    }
  }

  const isMonorepo = (hasFrontend && hasBackend) || manifests.length > 1;

  return {
    hasFrontend,
    hasBackend,
    frontendPath,
    backendPath,
    isMonorepo,
    manifests,
  };
}
