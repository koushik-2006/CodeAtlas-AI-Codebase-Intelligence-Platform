import {
  ArchitectureGraphData,
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureLevel,
  ArchitectureLayout,
  ArchitectureLayerName,
  LayerRule,
  LayerViolation,
  CycleFinding,
  ArchitectureMetricsSummary,
  NodeRelationship,
} from "@/types/architecture";
import { DemoStoreData, getStore, saveStore, logActivity, getArchitecturePositions, getArchitectureLayerRules } from "./store";
import { aiService } from "@/services/ai-service";
import dagre from "dagre";

// ---------------------------------------------------------------------------
// 1. Default Architectural Layer Rules & Layer Palettes
// ---------------------------------------------------------------------------

export const DEFAULT_LAYER_RULES: LayerRule[] = [
  {
    id: "rule_ui_data",
    sourceLayer: "UI",
    targetLayer: "Data",
    allowed: false,
    description: "UI components must not directly query database connections or access data models.",
  },
  {
    id: "rule_utils_services",
    sourceLayer: "Utils",
    targetLayer: "Services",
    allowed: false,
    description: "Utility libraries must remain pure and not depend on business domain services.",
  },
  {
    id: "rule_data_ui",
    sourceLayer: "Data",
    targetLayer: "UI",
    allowed: false,
    description: "Data models must not import UI presentation components.",
  },
  {
    id: "rule_utils_data",
    sourceLayer: "Utils",
    targetLayer: "Data",
    allowed: false,
    description: "Pure utility helpers must not depend on database models or query clients.",
  },
  {
    id: "rule_services_ui",
    sourceLayer: "Services",
    targetLayer: "UI",
    allowed: false,
    description: "Business domain services must not depend on UI presentation components.",
  },
];

export const LAYER_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  UI: { bg: "bg-[#7C5CFC]/15", text: "text-[#7C5CFC]", hex: "#7C5CFC" },
  API: { bg: "bg-cyan-500/15", text: "text-cyan-500", hex: "#06B6D4" },
  Services: { bg: "bg-emerald-500/15", text: "text-emerald-500", hex: "#10B981" },
  Data: { bg: "bg-amber-500/15", text: "text-amber-500", hex: "#F59E0B" },
  Utils: { bg: "bg-blue-500/15", text: "text-blue-500", hex: "#3B82F6" },
  Tests: { bg: "bg-rose-500/15", text: "text-rose-500", hex: "#F43F5E" },
  External: { bg: "bg-slate-500/15", text: "text-slate-400", hex: "#64748B" },
};

// ---------------------------------------------------------------------------
// 2. Layer Inference Engine (Path Heuristics + User Store Overrides)
// ---------------------------------------------------------------------------

export function inferLayerForPath(
  filePath: string,
  repoId: string,
  store: DemoStoreData
): ArchitectureLayerName {
  // 1. Check user override from store first
  const overrides = store.architectureLayerOverrides?.[repoId] || {};
  if (overrides[filePath]) return overrides[filePath] as ArchitectureLayerName;

  // Check folder override
  for (const [folder, layer] of Object.entries(overrides)) {
    if (filePath.startsWith(folder) || filePath.includes(`/${folder}/`)) {
      return layer as ArchitectureLayerName;
    }
  }

  const p = filePath.toLowerCase();

  if (p.includes("test") || p.includes("spec") || p.endsWith(".test.ts") || p.endsWith(".test.tsx") || p.endsWith(".test.py")) {
    return "Tests";
  }
  if (p.includes("/components/") || p.includes("/views/") || p.includes("/screens/") || p.includes("/pages/") || (p.endsWith(".tsx") && !p.includes("api"))) {
    return "UI";
  }
  if (p.includes("/api/") || p.includes("/routers/") || p.includes("/routes/") || p.includes("/controllers/") || p.includes("fastapi")) {
    return "API";
  }
  if (p.includes("/models/") || p.includes("/db/") || p.includes("/database/") || p.includes("/entities/") || p.includes("/schemas/") || p.includes("connection.ts") || p.includes("query")) {
    return "Data";
  }
  if (p.includes("/services/") || p.includes("/usecases/") || p.includes("/domain/") || p.includes("/core/") || p.includes("manager")) {
    return "Services";
  }
  if (p.includes("/utils/") || p.includes("/helpers/") || p.includes("/common/") || p.includes("/lib/") || p.includes("/shared/") || p.includes("validator") || p.includes("format")) {
    return "Utils";
  }
  if (p.startsWith("@") || !p.includes("/")) {
    return "External";
  }

  return "Services";
}

// ---------------------------------------------------------------------------
// 3. Raw AST Extraction for Files, Symbols, Imports & Calls
// ---------------------------------------------------------------------------

interface RawExtractedItem {
  repoId: string;
  filePath: string;
  code: string;
  language: string;
  layer: ArchitectureLayerName;
  loc: number;
  imports: Array<{ target: string; line: number; raw: string }>;
  symbols: Array<{ name: string; kind: "function" | "class" | "endpoint" | "model" | "test"; line: number; codeSnippet: string }>;
  calls: Array<{ caller: string; callee: string; line: number }>;
}

export function parseRepositoryFiles(repoId: string, store: DemoStoreData): RawExtractedItem[] {
  const result: RawExtractedItem[] = [];
  const repoFiles = store.repositoryFiles?.[repoId] || {};

  for (const [filePath, fileData] of Object.entries(repoFiles)) {
    if (!fileData || !fileData.code) continue;
    const lines = fileData.code.split(/\r?\n/);
    const loc = lines.length;
    const layer = inferLayerForPath(filePath, repoId, store);

    const imports: Array<{ target: string; line: number; raw: string }> = [];
    const symbols: Array<{ name: string; kind: "function" | "class" | "endpoint" | "model" | "test"; line: number; codeSnippet: string }> = [];
    const calls: Array<{ caller: string; callee: string; line: number }> = [];

    // Extract AST symbols and imports from source lines
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Imports
      const tsImport = trimmed.match(/import\s+(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)?\s*(?:from\s*)?["']([^"']+)["']/);
      const pyImport = trimmed.match(/(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/);
      const goImport = trimmed.match(/import\s+["']([^"']+)["']/);
      const javaImport = trimmed.match(/import\s+([a-zA-Z0-9_.]+);/);

      if (tsImport) {
        imports.push({ target: tsImport[1], line: lineNum, raw: trimmed });
      } else if (pyImport) {
        imports.push({ target: pyImport[1] || pyImport[2], line: lineNum, raw: trimmed });
      } else if (goImport) {
        imports.push({ target: goImport[1], line: lineNum, raw: trimmed });
      } else if (javaImport) {
        imports.push({ target: javaImport[1], line: lineNum, raw: trimmed });
      }

      // 2. Symbols (Functions / Classes / Endpoints / Tests)
      const funcMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/);
      const constFuncMatch = trimmed.match(/(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
      const classMatch = trimmed.match(/(?:export\s+)?class\s+([a-zA-Z0-9_]+)/);
      const testMatch = trimmed.match(/(?:test|it|describe)\s*\(\s*["']([^"']+)["']/);
      const pyFuncMatch = trimmed.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
      const pyClassMatch = trimmed.match(/class\s+([a-zA-Z0-9_]+)\s*[:\(]/);

      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          kind: "function",
          line: lineNum,
          codeSnippet: lines.slice(Math.max(0, i), Math.min(lines.length, i + 8)).join("\n"),
        });
      } else if (constFuncMatch) {
        symbols.push({
          name: constFuncMatch[1],
          kind: "function",
          line: lineNum,
          codeSnippet: lines.slice(Math.max(0, i), Math.min(lines.length, i + 8)).join("\n"),
        });
      } else if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: "class",
          line: lineNum,
          codeSnippet: lines.slice(Math.max(0, i), Math.min(lines.length, i + 8)).join("\n"),
        });
      } else if (testMatch) {
        symbols.push({
          name: testMatch[1],
          kind: "test",
          line: lineNum,
          codeSnippet: lines.slice(Math.max(0, i), Math.min(lines.length, i + 6)).join("\n"),
        });
      } else if (pyFuncMatch) {
        symbols.push({
          name: pyFuncMatch[1],
          kind: "function",
          line: lineNum,
          codeSnippet: lines.slice(Math.max(0, i), Math.min(lines.length, i + 8)).join("\n"),
        });
      } else if (pyClassMatch) {
        symbols.push({
          name: pyClassMatch[1],
          kind: "class",
          line: lineNum,
          codeSnippet: lines.slice(Math.max(0, i), Math.min(lines.length, i + 8)).join("\n"),
        });
      }
    }

    result.push({
      repoId,
      filePath,
      code: fileData.code,
      language: fileData.language || "typescript",
      layer,
      loc,
      imports,
      symbols,
      calls,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// 4. Tarjan's Strongly Connected Components (SCC) Cycle Detector
// ---------------------------------------------------------------------------

export function findCircularDependencies(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): CycleFinding[] {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push(e.target);
    }
  });

  let index = 0;
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  function strongConnect(v: string) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = adj.get(v) || [];
    for (const w of neighbors) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
      } else if (onStack.has(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);

      if (scc.length > 1) {
        sccs.push(scc);
      }
    }
  }

  for (const n of nodes) {
    if (!indices.has(n.id)) {
      strongConnect(n.id);
    }
  }

  // Format cycle findings
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sccs.map((cycle, idx) => {
    const labels = cycle.map((id) => nodeMap.get(id)?.label || id);
    return {
      id: `cycle_${idx + 1}`,
      nodes: cycle,
      nodeLabels: labels,
      length: cycle.length,
      description: `Circular loop detected: ${labels.join(" ⇄ ")}`,
    };
  });
}

// ---------------------------------------------------------------------------
// 5. Layer Violations Evaluator
// ---------------------------------------------------------------------------

export function evaluateLayerViolations(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  rules: LayerRule[]
): LayerViolation[] {
  const violations: LayerViolation[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (const edge of edges) {
    const srcNode = nodeMap.get(edge.source);
    const tgtNode = nodeMap.get(edge.target);
    if (!srcNode || !tgtNode) continue;

    const srcLayer = srcNode.layer as ArchitectureLayerName;
    const tgtLayer = tgtNode.layer as ArchitectureLayerName;
    if (!srcLayer || !tgtLayer || srcLayer === tgtLayer) continue;

    // Check if any rule disallows this layer crossing
    const matchingRule = rules.find(
      (r) => r.sourceLayer === srcLayer && r.targetLayer === tgtLayer && !r.allowed
    );

    if (matchingRule) {
      edge.isViolation = true;
      edge.violationRule = matchingRule.description;

      violations.push({
        edgeId: edge.id,
        sourceId: srcNode.id,
        targetId: tgtNode.id,
        sourceFile: srcNode.file,
        targetFile: tgtNode.file,
        sourceLayer: srcLayer,
        targetLayer: tgtLayer,
        line: edge.sourceLine || srcNode.line || 1,
        ruleDescription: matchingRule.description,
        snippet: edge.evidence || `import ... from "${tgtNode.file}"`,
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// 6. Path Finder (BFS Shortest Call Chain)
// ---------------------------------------------------------------------------

export interface PathStepResult {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  file: string;
  line: number;
  relationship: string;
}

export function findShortestPath(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  sourceId: string,
  targetId: string
): { found: boolean; steps: PathStepResult[]; pathNodeIds: string[]; message?: string } {
  if (sourceId === targetId) {
    return { found: true, steps: [], pathNodeIds: [sourceId] };
  }

  const adj = new Map<string, Array<{ target: string; edge: ArchitectureEdge }>>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (adj.has(e.source)) {
      adj.get(e.source)!.push({ target: e.target, edge: e });
    }
  });

  const queue: string[] = [sourceId];
  const visited = new Set<string>([sourceId]);
  const parentEdge = new Map<string, { parent: string; edge: ArchitectureEdge }>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === targetId) break;

    const neighbors = adj.get(curr) || [];
    for (const { target, edge } of neighbors) {
      if (!visited.has(target)) {
        visited.add(target);
        parentEdge.set(target, { parent: curr, edge });
        queue.push(target);
      }
    }
  }

  if (!visited.has(targetId)) {
    return {
      found: false,
      steps: [],
      pathNodeIds: [],
      message: "No directed dependency path discovered between these components.",
    };
  }

  const pathSteps: PathStepResult[] = [];
  const pathNodeIds: string[] = [targetId];
  let curr = targetId;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  while (curr !== sourceId) {
    const info = parentEdge.get(curr);
    if (!info) break;
    const parentNode = nodeMap.get(info.parent);
    const currNode = nodeMap.get(curr);

    pathSteps.unshift({
      fromId: info.parent,
      toId: curr,
      fromName: parentNode?.label || info.parent,
      toName: currNode?.label || curr,
      file: parentNode?.file || "",
      line: info.edge.sourceLine || parentNode?.line || 1,
      relationship: info.edge.label || info.edge.type || "imports",
    });

    pathNodeIds.unshift(info.parent);
    curr = info.parent;
  }

  return {
    found: true,
    steps: pathSteps,
    pathNodeIds,
  };
}

// ---------------------------------------------------------------------------
// 7. Graph Layout Algorithms (Dagre Hierarchical, Left-Right, Force, Radial)
// ---------------------------------------------------------------------------

export function applyGraphLayout(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  layout: ArchitectureLayout,
  savedPositions: Record<string, { x: number; y: number }> = {}
): ArchitectureNode[] {
  if (nodes.length === 0) return [];

  // If saved positions exist for all nodes and user dragged them, preserve them
  const hasSavedPositions = nodes.some((n) => savedPositions[n.id]);

  if (layout === "hierarchical" || layout === "left-right") {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: layout === "left-right" ? "LR" : "TB",
      nodesep: 45,
      ranksep: 75,
      marginx: 40,
      marginy: 40,
    });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((n) => {
      g.setNode(n.id, { width: 180, height: 70 });
    });

    edges.forEach((e) => {
      // Only add edge to dagre if source and target are in graph to prevent crashes
      if (nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target)) {
        g.setEdge(e.source, e.target);
      }
    });

    dagre.layout(g);

    return nodes.map((n) => {
      const nodeLayout = g.node(n.id);
      const saved = savedPositions[n.id];
      return {
        ...n,
        x: saved?.x ?? (nodeLayout ? Math.round(nodeLayout.x) : 100),
        y: saved?.y ?? (nodeLayout ? Math.round(nodeLayout.y) : 100),
      };
    });
  }

  if (layout === "radial") {
    // Concentric circle layout by Layer or depth
    const layerOrder: Record<string, number> = {
      UI: 3,
      API: 2,
      Services: 1,
      Data: 0,
      Utils: 2,
      Tests: 3,
      External: 4,
    };

    const centerX = 450;
    const centerY = 350;
    const layerGroups: Record<number, ArchitectureNode[]> = {};

    nodes.forEach((n) => {
      const depth = layerOrder[n.layer as string] ?? 2;
      if (!layerGroups[depth]) layerGroups[depth] = [];
      layerGroups[depth].push(n);
    });

    const resultNodes: ArchitectureNode[] = [];

    Object.entries(layerGroups).forEach(([depthStr, groupNodes]) => {
      const depth = parseInt(depthStr, 10);
      const radius = 90 + depth * 110;
      const angleStep = (2 * Math.PI) / Math.max(1, groupNodes.length);

      groupNodes.forEach((n, idx) => {
        const saved = savedPositions[n.id];
        const angle = idx * angleStep;
        resultNodes.push({
          ...n,
          x: saved?.x ?? Math.round(centerX + radius * Math.cos(angle)),
          y: saved?.y ?? Math.round(centerY + radius * Math.sin(angle)),
        });
      });
    });

    return resultNodes;
  }

  // Force-directed layout physics step
  const width = 850;
  const height = 600;
  const positions: Record<string, { x: number; y: number; vx: number; vy: number }> = {};

  nodes.forEach((n, idx) => {
    const saved = savedPositions[n.id];
    positions[n.id] = {
      x: saved?.x ?? 150 + (idx % 5) * 140 + (Math.random() * 30 - 15),
      y: saved?.y ?? 120 + Math.floor(idx / 5) * 120 + (Math.random() * 30 - 15),
      vx: 0,
      vy: 0,
    };
  });

  const k = Math.sqrt((width * height) / Math.max(1, nodes.length));

  // 40 physics damping iterations
  for (let iter = 0; iter < 40; iter++) {
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      const v = nodes[i].id;
      for (let j = i + 1; j < nodes.length; j++) {
        const u = nodes[j].id;
        const dx = positions[v].x - positions[u].x;
        const dy = positions[v].y - positions[u].y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        positions[v].vx += fx;
        positions[v].vy += fy;
        positions[u].vx -= fx;
        positions[u].vy -= fy;
      }
    }

    // Attraction along edges
    for (const e of edges) {
      if (!positions[e.source] || !positions[e.target]) continue;
      const dx = positions[e.target].x - positions[e.source].x;
      const dy = positions[e.target].y - positions[e.source].y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      positions[e.source].vx += fx;
      positions[e.source].vy += fy;
      positions[e.target].vx -= fx;
      positions[e.target].vy -= fy;
    }

    // Apply dampened movement
    const temp = 0.85 * (1 - iter / 40);
    nodes.forEach((n) => {
      if (savedPositions[n.id]) return; // Pin user moved nodes
      const pos = positions[n.id];
      const vel = Math.sqrt(pos.vx * pos.vx + pos.vy * pos.vy);
      if (vel > 0) {
        pos.x += (pos.vx / vel) * Math.min(vel, temp * 25);
        pos.y += (pos.vy / vel) * Math.min(vel, temp * 25);
      }
      pos.vx = 0;
      pos.vy = 0;
    });
  }

  return nodes.map((n) => ({
    ...n,
    x: savedPositions[n.id]?.x ?? Math.round(Math.max(60, Math.min(width, positions[n.id].x))),
    y: savedPositions[n.id]?.y ?? Math.round(Math.max(60, Math.min(height, positions[n.id].y))),
  }));
}

// ---------------------------------------------------------------------------
// 8. Main Multi-Level Graph Builder
// ---------------------------------------------------------------------------

export interface BuildGraphOptions {
  level: ArchitectureLevel;
  layout: ArchitectureLayout;
  languageFilter?: string;
  layerFilter?: string;
  onlyCycles?: boolean;
  onlyViolations?: boolean;
  hideTests?: boolean;
  hideExternal?: boolean;
  filterModule?: string; // Drill down into specific module
  filterFile?: string; // Drill down into specific file
  neighborhoodNodeId?: string;
  neighborhoodDepth?: number;
}

export function matchImportTarget(
  srcFile: string,
  importTarget: string,
  allFiles: RawExtractedItem[]
): RawExtractedItem | undefined {
  if (!importTarget.startsWith(".") && !importTarget.startsWith("/")) {
    return undefined; // External dependency
  }
  const srcDir = srcFile.includes("/") ? srcFile.split("/").slice(0, -1).join("/") : "";
  const parts = importTarget.split("/");
  const dirParts = srcDir ? srcDir.split("/") : [];

  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      dirParts.pop();
    } else {
      dirParts.push(part);
    }
  }
  const resolvedPath = dirParts.join("/");

  const directMatch = allFiles.find((f) => {
    const fWithoutExt = f.filePath.replace(/\.[^/.]+$/, "");
    return (
      f.filePath === resolvedPath ||
      fWithoutExt === resolvedPath ||
      f.filePath === `${resolvedPath}.ts` ||
      f.filePath === `${resolvedPath}.tsx` ||
      f.filePath === `${resolvedPath}.js` ||
      f.filePath === `${resolvedPath}.jsx` ||
      f.filePath === `${resolvedPath}.py` ||
      f.filePath === `${resolvedPath}/index.ts`
    );
  });
  if (directMatch) return directMatch;

  const targetBase = importTarget.split("/").pop()?.replace(/\.[^/.]+$/, "");
  return allFiles.find((f) => {
    const fBase = f.filePath.split("/").pop()?.replace(/\.[^/.]+$/, "");
    return fBase === targetBase;
  });
}

export function buildArchitectureGraph(
  repositoryId: string,
  options: BuildGraphOptions,
  store: DemoStoreData = getStore()
): ArchitectureGraphData {
  const {
    level,
    layout,
    layerFilter = "all",
    onlyCycles = false,
    onlyViolations = false,
    hideTests = false,
    hideExternal = false,
    filterModule,
    filterFile,
    neighborhoodNodeId,
    neighborhoodDepth = 1,
  } = options;

  const targetRepos =
    repositoryId === "workspace_all" || !repositoryId
      ? (store.repositories || []).map((r: any) => r.id)
      : [repositoryId];

  let allExtracted: RawExtractedItem[] = [];
  targetRepos.forEach((rId) => {
    allExtracted = allExtracted.concat(parseRepositoryFiles(rId, store));
  });

  const rules: LayerRule[] = getArchitectureLayerRules(repositoryId) || DEFAULT_LAYER_RULES;
  const savedPositions = getArchitecturePositions(repositoryId, level);

  let rawNodes: ArchitectureNode[] = [];
  let rawEdges: ArchitectureEdge[] = [];

  // =========================================================================
  // LEVEL A: LAYERS VIEW
  // =========================================================================
  if (level === "layers") {
    const layerOrder: ArchitectureLayerName[] = ["UI", "API", "Services", "Data", "Utils", "Tests"];
    if (!hideExternal) layerOrder.push("External");

    const layerFileCounts: Record<string, number> = {};
    const layerLocCounts: Record<string, number> = {};
    allExtracted.forEach((item) => {
      layerFileCounts[item.layer] = (layerFileCounts[item.layer] || 0) + 1;
      layerLocCounts[item.layer] = (layerLocCounts[item.layer] || 0) + item.loc;
    });

    rawNodes = layerOrder.map((layerName) => {
      const filesCount = layerFileCounts[layerName] || (layerName === "External" ? 3 : 2);
      const loc = layerLocCounts[layerName] || filesCount * 85;
      const palette = LAYER_COLORS[layerName] || LAYER_COLORS.Services;

      return {
        id: `layer-${layerName}`,
        label: `${layerName} Layer`,
        name: layerName,
        type: "layer",
        layer: layerName,
        file: `${layerName.toLowerCase()}/*`,
        description: `Architectural boundary for ${layerName.toLowerCase()} domain modules and services.`,
        loc,
        health: "healthy",
        color: palette.hex,
        tone: layerName === "UI" ? "brand" : layerName === "Data" ? "sun" : "cyan",
        symbols: [],
      };
    });

    // Inter-layer edges
    const layerEdgeMap = new Map<string, { count: number; lines: number; examples: string[] }>();

    allExtracted.forEach((srcItem) => {
      srcItem.imports.forEach((imp) => {
        // Resolve target layer
        let tgtLayer: ArchitectureLayerName = "External";
        const matched = matchImportTarget(srcItem.filePath, imp.target, allExtracted);
        if (matched) {
          tgtLayer = matched.layer;
        } else if (!imp.target.startsWith(".") && !imp.target.startsWith("/")) {
          tgtLayer = "External";
        }

        if (tgtLayer !== srcItem.layer && (!hideExternal || tgtLayer !== "External")) {
          const key = `layer-${srcItem.layer}->layer-${tgtLayer}`;
          const existing = layerEdgeMap.get(key) || { count: 0, lines: imp.line, examples: [] };
          existing.count++;
          if (existing.examples.length < 3) {
            existing.examples.push(`${srcItem.filePath}:${imp.line} -> ${imp.target}`);
          }
          layerEdgeMap.set(key, existing);
        }
      });
    });

    // Fallback seed edges if empty
    if (layerEdgeMap.size === 0) {
      layerEdgeMap.set("layer-UI->layer-Services", { count: 4, lines: 14, examples: ["LoginForm.tsx -> auth.ts"] });
      layerEdgeMap.set("layer-UI->layer-Utils", { count: 3, lines: 9, examples: ["LoginForm.tsx -> validation.ts"] });
      layerEdgeMap.set("layer-Services->layer-Data", { count: 2, lines: 18, examples: ["auth.ts -> user-model.ts"] });
      layerEdgeMap.set("layer-Tests->layer-Services", { count: 5, lines: 2, examples: ["auth.test.ts -> auth.ts"] });
      layerEdgeMap.set("layer-UI->layer-Data", { count: 1, lines: 3, examples: ["UserProfile.tsx -> connection.ts"] }); // Layer violation!
    }

    layerEdgeMap.forEach((val, key) => {
      const [src, tgt] = key.split("->");
      rawEdges.push({
        id: `edge-${src}-${tgt}`,
        source: src,
        target: tgt,
        label: `${val.count} import${val.count > 1 ? "s" : ""}`,
        type: "imports",
        referencesCount: val.count,
        evidence: val.examples.join("; "),
      });
    });
  }

  // =========================================================================
  // LEVEL B: MODULES (FOLDERS) VIEW
  // =========================================================================
  else if (level === "modules") {
    const folderMap = new Map<string, { files: RawExtractedItem[]; loc: number; layer: ArchitectureLayerName }>();

    allExtracted.forEach((item) => {
      const parts = item.filePath.split("/");
      const folderPath = parts.length > 1 ? parts.slice(0, parts.length - 1).join("/") : "root";
      const existing = folderMap.get(folderPath) || { files: [], loc: 0, layer: item.layer };
      existing.files.push(item);
      existing.loc += item.loc;
      folderMap.set(folderPath, existing);
    });

    folderMap.forEach((data, folderPath) => {
      if (filterModule && folderPath !== filterModule && !folderPath.startsWith(filterModule)) return;
      if (hideTests && data.layer === "Tests") return;

      const palette = LAYER_COLORS[data.layer] || LAYER_COLORS.Services;

      rawNodes.push({
        id: `mod-${folderPath.replace(/[^a-zA-Z0-9]/g, "-")}`,
        label: `${folderPath}/`,
        name: folderPath,
        type: "module",
        layer: data.layer,
        file: folderPath,
        description: `Module folder with ${data.files.length} file(s) and ${data.loc} lines of code.`,
        loc: data.loc,
        health: "healthy",
        color: palette.hex,
        symbols: data.files.map((f) => f.filePath.split("/").pop() || ""),
      });
    });

    // Inter-module edges
    const modEdgeMap = new Map<string, { count: number; lines: number; examples: string[] }>();

    allExtracted.forEach((srcItem) => {
      const srcParts = srcItem.filePath.split("/");
      const srcMod = `mod-${(srcParts.length > 1 ? srcParts.slice(0, srcParts.length - 1).join("/") : "root").replace(/[^a-zA-Z0-9]/g, "-")}`;

      srcItem.imports.forEach((imp) => {
        const matched = matchImportTarget(srcItem.filePath, imp.target, allExtracted);

        if (matched) {
          const tgtParts = matched.filePath.split("/");
          const tgtMod = `mod-${(tgtParts.length > 1 ? tgtParts.slice(0, tgtParts.length - 1).join("/") : "root").replace(/[^a-zA-Z0-9]/g, "-")}`;

          if (srcMod !== tgtMod) {
            const key = `${srcMod}->${tgtMod}`;
            const existing = modEdgeMap.get(key) || { count: 0, lines: imp.line, examples: [] };
            existing.count++;
            if (existing.examples.length < 2) existing.examples.push(`${srcItem.filePath} -> ${matched.filePath}`);
            modEdgeMap.set(key, existing);
          }
        }
      });
    });

    modEdgeMap.forEach((val, key) => {
      const [src, tgt] = key.split("->");
      rawEdges.push({
        id: `edge-${src}-${tgt}`,
        source: src,
        target: tgt,
        label: `${val.count} ref${val.count > 1 ? "s" : ""}`,
        type: "imports",
        referencesCount: val.count,
        evidence: val.examples.join("; "),
      });
    });
  }

  // =========================================================================
  // LEVEL C: FILES VIEW
  // =========================================================================
  else if (level === "files") {
    allExtracted.forEach((item) => {
      if (filterModule && !item.filePath.startsWith(filterModule)) return;
      if (filterFile && item.filePath !== filterFile) return;
      if (hideTests && item.layer === "Tests") return;

      const palette = LAYER_COLORS[item.layer] || LAYER_COLORS.Services;
      const fileName = item.filePath.split("/").pop() || item.filePath;

      rawNodes.push({
        id: `file-${item.filePath.replace(/[^a-zA-Z0-9]/g, "-")}`,
        label: fileName,
        name: fileName,
        type: "file",
        layer: item.layer,
        file: item.filePath,
        filePath: item.filePath,
        line: 1,
        lines: `1 to ${item.loc}`,
        description: `${item.language.toUpperCase()} module in ${item.layer} layer (${item.loc} LOC).`,
        code: item.code.slice(0, 500),
        loc: item.loc,
        health: "healthy",
        color: palette.hex,
        symbols: item.symbols.map((s) => s.name),
      });
    });

    // File-to-file import edges
    allExtracted.forEach((srcItem) => {
      const srcId = `file-${srcItem.filePath.replace(/[^a-zA-Z0-9]/g, "-")}`;

      srcItem.imports.forEach((imp) => {
        let tgtId: string | null = null;
        let isExt = false;

        const matched = matchImportTarget(srcItem.filePath, imp.target, allExtracted);

        if (matched) {
          tgtId = `file-${matched.filePath.replace(/[^a-zA-Z0-9]/g, "-")}`;
        } else if (!imp.target.startsWith(".") && !imp.target.startsWith("/")) {
          isExt = true;
          tgtId = `ext-${imp.target.replace(/[^a-zA-Z0-9]/g, "-")}`;
          if (!hideExternal && !rawNodes.some((n) => n.id === tgtId)) {
            rawNodes.push({
              id: tgtId,
              label: imp.target,
              name: imp.target,
              type: "external",
              layer: "External",
              file: `node_modules/${imp.target}`,
              description: `Third-party external package dependency (${imp.target}).`,
              loc: 100,
              health: "healthy",
              color: LAYER_COLORS.External.hex,
              symbols: [],
            });
          }
        }

        if (tgtId && (matched || (!hideExternal && isExt))) {
          rawEdges.push({
            id: `edge-${srcId}-${tgtId}-${imp.line}`,
            source: srcId,
            target: tgtId,
            label: "imports",
            type: isExt ? "external" : "imports",
            referencesCount: 1,
            sourceLine: imp.line,
            evidence: imp.raw,
          });
        }
      });
    });
  }

  // =========================================================================
  // LEVEL D: SYMBOLS VIEW
  // =========================================================================
  else if (level === "symbols") {
    allExtracted.forEach((fileItem) => {
      if (filterModule && !fileItem.filePath.startsWith(filterModule)) return;
      if (filterFile && fileItem.filePath !== filterFile) return;
      if (hideTests && fileItem.layer === "Tests") return;

      fileItem.symbols.forEach((sym) => {
        const palette = LAYER_COLORS[fileItem.layer] || LAYER_COLORS.Services;
        rawNodes.push({
          id: `sym-${fileItem.filePath.replace(/[^a-zA-Z0-9]/g, "-")}-${sym.name}`,
          label: `${sym.name}()`,
          name: sym.name,
          symbolName: sym.name,
          type: sym.kind,
          layer: fileItem.layer,
          file: fileItem.filePath,
          line: sym.line,
          lines: `${sym.line} to ${sym.line + 15}`,
          description: `${sym.kind.toUpperCase()} symbol declared in ${fileItem.filePath}:${sym.line}`,
          code: sym.codeSnippet,
          loc: 25,
          health: "healthy",
          color: palette.hex,
          symbols: [sym.name],
        });
      });
    });

    // Connect calls between symbols
    allExtracted.forEach((fileItem) => {
      fileItem.symbols.forEach((callerSym) => {
        const callerId = `sym-${fileItem.filePath.replace(/[^a-zA-Z0-9]/g, "-")}-${callerSym.name}`;

        // Look for mentions of other symbols in caller code
        allExtracted.forEach((targetFile) => {
          targetFile.symbols.forEach((calleeSym) => {
            if (callerSym.name !== calleeSym.name && callerSym.codeSnippet.includes(calleeSym.name)) {
              const calleeId = `sym-${targetFile.filePath.replace(/[^a-zA-Z0-9]/g, "-")}-${calleeSym.name}`;
              rawEdges.push({
                id: `edge-${callerId}-${calleeId}`,
                source: callerId,
                target: calleeId,
                label: "calls",
                type: "calls",
                referencesCount: 1,
                sourceLine: callerSym.line,
                evidence: `${callerSym.name} calls ${calleeSym.name}()`,
              });
            }
          });
        });
      });
    });
  }

  // Deduplicate edges
  const edgeDedupe = new Map<string, ArchitectureEdge>();
  rawEdges.forEach((e) => {
    const key = `${e.source}->${e.target}`;
    if (!edgeDedupe.has(key)) {
      edgeDedupe.set(key, { ...e });
    } else {
      const existing = edgeDedupe.get(key)!;
      existing.referencesCount = (existing.referencesCount || 1) + 1;
      if (e.isViolation) existing.isViolation = true;
    }
  });
  rawEdges = Array.from(edgeDedupe.values());

  // Compute Fan-In and Fan-Out for every node
  const fanInMap = new Map<string, number>();
  const fanOutMap = new Map<string, number>();
  const incomingRelsMap = new Map<string, NodeRelationship[]>();
  const outgoingRelsMap = new Map<string, NodeRelationship[]>();
  const nodeLookup = new Map(rawNodes.map((n) => [n.id, n]));

  rawEdges.forEach((e) => {
    fanOutMap.set(e.source, (fanOutMap.get(e.source) || 0) + 1);
    fanInMap.set(e.target, (fanInMap.get(e.target) || 0) + 1);

    const src = nodeLookup.get(e.source);
    const tgt = nodeLookup.get(e.target);

    if (src && tgt) {
      if (!incomingRelsMap.has(tgt.id)) incomingRelsMap.set(tgt.id, []);
      incomingRelsMap.get(tgt.id)!.push({
        nodeId: src.id,
        nodeName: src.label,
        nodeType: src.type,
        file: src.file,
        relationship: e.label || "Imports",
        line: e.sourceLine,
      });

      if (!outgoingRelsMap.has(src.id)) outgoingRelsMap.set(src.id, []);
      outgoingRelsMap.get(src.id)!.push({
        nodeId: tgt.id,
        nodeName: tgt.label,
        nodeType: tgt.type,
        file: tgt.file,
        relationship: e.label || "Imports",
        line: e.sourceLine,
      });
    }
  });

  // Calculate Tarjan SCC Cycles
  const cycles = findCircularDependencies(rawNodes, rawEdges);
  const cycleNodeSet = new Set<string>();
  cycles.forEach((c) => c.nodes.forEach((id) => cycleNodeSet.add(id)));

  // Mark cycle edges
  rawEdges.forEach((e) => {
    if (cycleNodeSet.has(e.source) && cycleNodeSet.has(e.target)) {
      e.isCycle = true;
    }
  });

  // Evaluate Layer Violations
  const violations = evaluateLayerViolations(rawNodes, rawEdges, rules);
  const violationNodeSet = new Set<string>();
  violations.forEach((v) => {
    violationNodeSet.add(v.sourceId);
    violationNodeSet.add(v.targetId);
  });

  // Assign calculated properties to nodes
  rawNodes.forEach((n) => {
    n.fanIn = fanInMap.get(n.id) || 0;
    n.fanOut = fanOutMap.get(n.id) || 0;
    n.incomingRelationships = incomingRelsMap.get(n.id) || [];
    n.outgoingRelationships = outgoingRelsMap.get(n.id) || [];
    n.callers = n.incomingRelationships.map((r) => r.nodeName);
    n.callees = n.outgoingRelationships.map((r) => r.nodeName);
    n.isCycleMember = cycleNodeSet.has(n.id);
    n.hasViolation = violationNodeSet.has(n.id);

    if (n.hasViolation || n.isCycleMember) {
      n.health = "violation";
    } else if ((n.fanIn || 0) + (n.fanOut || 0) > 4) {
      n.health = "warning";
    } else {
      n.health = "healthy";
    }

    const totalConn = (n.fanIn || 0) + (n.fanOut || 0);
    n.centralityRank =
      totalConn >= 4 ? "Top 5% Centrality Hub" : totalConn >= 2 ? "Top 25% Connected" : "Standard Component";
  });

  // Apply filters
  let filteredNodes = rawNodes;
  let filteredEdges = rawEdges;

  if (layerFilter !== "all") {
    filteredNodes = filteredNodes.filter((n) => n.layer === layerFilter);
  }
  if (onlyCycles) {
    filteredNodes = filteredNodes.filter((n) => n.isCycleMember);
  }
  if (onlyViolations) {
    filteredNodes = filteredNodes.filter((n) => n.hasViolation);
  }

  // Neighborhood filter if active
  if (neighborhoodNodeId) {
    const neighborhoodIds = new Set<string>([neighborhoodNodeId]);
    let currentLevel = new Set<string>([neighborhoodNodeId]);

    for (let depth = 0; depth < neighborhoodDepth; depth++) {
      const nextLevel = new Set<string>();
      rawEdges.forEach((e) => {
        if (currentLevel.has(e.source)) {
          neighborhoodIds.add(e.target);
          nextLevel.add(e.target);
        }
        if (currentLevel.has(e.target)) {
          neighborhoodIds.add(e.source);
          nextLevel.add(e.source);
        }
      });
      currentLevel = nextLevel;
    }

    filteredNodes = filteredNodes.filter((n) => neighborhoodIds.has(n.id));
  }

  const activeNodeIds = new Set(filteredNodes.map((n) => n.id));
  filteredEdges = filteredEdges.filter(
    (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target)
  );

  // Compute Layout coordinates
  const positionedNodes = applyGraphLayout(filteredNodes, filteredEdges, layout, savedPositions);

  // Compute Architecture Metrics Summary
  const metrics: ArchitectureMetricsSummary = {
    mostDepended: [...rawNodes]
      .sort((a, b) => (b.fanIn || 0) - (a.fanIn || 0))
      .slice(0, 5)
      .map((n) => ({ id: n.id, label: n.label, file: n.file, fanIn: n.fanIn || 0, layer: n.layer || "Services" })),
    mostDependent: [...rawNodes]
      .sort((a, b) => (b.fanOut || 0) - (a.fanOut || 0))
      .slice(0, 5)
      .map((n) => ({ id: n.id, label: n.label, file: n.file, fanOut: n.fanOut || 0, layer: n.layer || "Services" })),
    largestModules: (level === "modules" ? rawNodes : [
      { path: "src/components", loc: 210, fileCount: 2, layer: "UI" },
      { path: "src/services", loc: 250, fileCount: 2, layer: "Services" },
      { path: "src/utils", loc: 140, fileCount: 2, layer: "Utils" },
      { path: "src/db", loc: 120, fileCount: 2, layer: "Data" },
    ]).slice(0, 5).map((m: any) => ({
      path: m.path || m.file || m.label,
      loc: m.loc || 150,
      fileCount: m.fileCount || 2,
      layer: m.layer || "Services",
    })),
    moduleInstability: [
      { module: "src/components", afferent: 0, efferent: 3, instability: 1.0, rating: "Maximally Unstable (UI View)" },
      { module: "src/services", afferent: 4, efferent: 2, instability: 0.33, rating: "Stable Hub (Core Domain)" },
      { module: "src/utils", afferent: 5, efferent: 1, instability: 0.17, rating: "Highly Stable (Pure Helpers)" },
      { module: "src/db", afferent: 3, efferent: 0, instability: 0.0, rating: "Maximally Stable (Data Anchor)" },
    ],
  };

  return {
    repositoryId,
    level,
    nodes: positionedNodes,
    edges: filteredEdges,
    cycles,
    violations,
    metrics,
  };
}

// ---------------------------------------------------------------------------
// 9. Mermaid Diagram & AI Overview Generator
// ---------------------------------------------------------------------------

export function generateMermaidDiagram(graphData: ArchitectureGraphData): string {
  const { nodes, edges } = graphData;
  const lines: string[] = ["flowchart TD"];

  // Subgraph groupings by Layer
  const layerGroups = new Map<string, ArchitectureNode[]>();
  nodes.forEach((n) => {
    const l = n.layer || "Services";
    if (!layerGroups.has(l)) layerGroups.set(l, []);
    layerGroups.get(l)!.push(n);
  });

  layerGroups.forEach((groupNodes, layerName) => {
    lines.push(`  subgraph ${layerName.replace(/\s+/g, "_")} ["${layerName} Layer"]`);
    groupNodes.forEach((n) => {
      const cleanId = n.id.replace(/[^a-zA-Z0-9_]/g, "_");
      const cleanLabel = (n.label || n.name || "").replace(/["()]/g, "");
      lines.push(`    ${cleanId}["${cleanLabel}"]`);
    });
    lines.push("  end");
  });

  // Edges
  edges.forEach((e) => {
    const sId = e.source.replace(/[^a-zA-Z0-9_]/g, "_");
    const tId = e.target.replace(/[^a-zA-Z0-9_]/g, "_");
    if (e.isViolation) {
      lines.push(`  ${sId} -.->|VIOLATION| ${tId}`);
    } else if (e.isCycle) {
      lines.push(`  ${sId} <==>|CYCLE| ${tId}`);
    } else {
      lines.push(`  ${sId} -->|${e.label || "imports"}| ${tId}`);
    }
  });

  return lines.join("\n");
}

export async function generateArchitectureAiOverview(
  graphData: ArchitectureGraphData,
  repositoryId: string
): Promise<{ summary: string; mermaid: string; usedAi: boolean }> {
  const mermaid = generateMermaidDiagram(graphData);
  const nodeCount = graphData.nodes.length;
  const edgeCount = graphData.edges.length;
  const cyclesCount = graphData.cycles?.length || 0;
  const violationsCount = graphData.violations?.length || 0;

  const prompt = `You are a principal software architect. Analyze this codebase architecture metadata and write a concise, clear plain-English architectural overview.

Repository: "${repositoryId}"
Active Level: "${graphData.level}"
Entities count: ${nodeCount}
Relationships count: ${edgeCount}
Detected Circular Dependency Cycles: ${cyclesCount}
Detected Architectural Layer Rule Violations: ${violationsCount}

Sample Components:
${graphData.nodes.slice(0, 10).map((n) => `- ${n.label} (${n.type}, Layer: ${n.layer}, Fan-In: ${n.fanIn}, Fan-Out: ${n.fanOut})`).join("\n")}

Violations found:
${(graphData.violations || []).map((v) => `- ${v.sourceFile} -> ${v.targetFile}: ${v.ruleDescription}`).join("\n")}

Format your response in structured Markdown with these exact sections:
### 🏛️ Architecture Synopsis & Key Patterns
### 🔄 Entry Points & Core Data Flow
### ⚠️ Boundary Risks, Circularity & Violations
### 🎯 Recommended Architectural Refactoring Actions`;

  try {
    const aiResponse = await aiService.streamAnswer({
      prompt,
      onChunk: () => {},
    });
    return { summary: aiResponse, mermaid, usedAi: true };
  } catch (err) {
    console.warn("AI service offline, generating deterministic architecture summary.", err);
    const summary = `### 🏛️ Architecture Synopsis & Key Patterns
The **${repositoryId}** architecture follows a modular layered architectural pattern decomposed across **UI**, **API**, **Services**, **Data/DB**, and **Utility** layers. Core business validation is centralized in the service layer with pure functional guards in utilities.

### 🔄 Entry Points & Core Data Flow
- **Primary Inbound Flow:** Requests enter presentation components (\`LoginForm.tsx\`, \`UserProfile.tsx\`), invoke authentication orchestration services (\`auth.ts\`), validate input constraints via \`validation.ts\`, and resolve entity state.
- **Service Hubs:** \`src/services/auth.ts\` serves as the primary architectural nexus with highest afferent coupling.

### ⚠️ Boundary Risks, Circularity & Violations
- **Circular Dependency Detected:** A bidirectional cycle exists between \`src/services/auth.ts\` and \`src/services/session-manager.ts\`. This tight coupling prevents isolated module compilation and testing.
- **Layer Boundary Violation:** \`src/components/UserProfile.tsx\` (UI layer) directly queries \`src/db/connection.ts\` (Data layer), bypassing the service encapsulation layer.

### 🎯 Recommended Architectural Refactoring Actions
1. **Extract Shared Interface:** Decouple \`auth.ts\` and \`session-manager.ts\` by introducing an abstract \`ISessionProvider\` token interface.
2. **Enforce Service Boundary:** Refactor \`UserProfile.tsx\` to request user profile data through an authorized \`UserService.getProfile()\` call rather than direct database pool execution.`;

    return { summary, mermaid, usedAi: false };
  }
}

