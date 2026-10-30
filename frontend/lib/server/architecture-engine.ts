import { db } from "./db";
import {
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureGraphData,
  ArchitectureNodeType,
  ArchitectureRelationshipType,
  NodeRelationship,
} from "@/types/architecture";
import { DbCodeSymbol, DbCodeRelationship, DbRepositoryFile } from "@/types/database";

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  nodeTypeBreakdown: Record<string, number>;
  circularDependencies: string[][];
  isolatedNodes: string[];
  centralNodes: { id: string; name: string; connections: number }[];
  maxDepth: number;
}

export interface PathStep {
  nodeId: string;
  nodeName: string;
  nodeType: ArchitectureNodeType;
  file: string;
  line?: number;
  relationshipToNext?: ArchitectureRelationshipType;
  evidence?: string;
}

export interface PathResult {
  found: boolean;
  sourceId: string;
  targetId: string;
  steps: PathStep[];
  length: number;
  message?: string;
}

export interface DependencyAnalysisResult {
  nodeId: string;
  nodeName: string;
  file: string;
  directDependencies: { id: string; name: string; type: ArchitectureNodeType; file: string; line?: number }[];
  directDependents: { id: string; name: string; type: ArchitectureNodeType; file: string; line?: number }[];
  transitiveDependencies: string[];
  dependencyDepth: number;
  isCircular: boolean;
  cycleMembers?: string[];
  linkedTests: { name: string; file: string; line?: number }[];
  relatedEndpoints: { name: string; file: string }[];
  relatedDatabase: { name: string; file: string }[];
}

/**
 * Server-side Architecture Intelligence Engine.
 * Extracts grounded DAG graph nodes, edges, dependency metrics, cycles, and traversal paths
 * from indexed repository files, AST symbols, and relationship tables.
 */
export class ArchitectureEngine {
  /**
   * Builds the complete architecture graph for a repository using indexed source code.
   */
  getGraph(repositoryId: string = "sample-project"): {
    data: ArchitectureGraphData;
    metrics: GraphMetrics;
  } {
    const symbols = db.getCodeSymbols(repositoryId);
    const relationships = db.getCodeRelationships(repositoryId);
    const files = db.getRepositoryFiles(repositoryId);

    const nodes: ArchitectureNode[] = [];
    const edges: ArchitectureEdge[] = [];
    const nodeMap = new Map<string, ArchitectureNode>();

    // 1. Generate Nodes from AST Symbols
    symbols.forEach((sym, idx) => {
      const type = this.mapSymbolTypeToNodeType(sym);
      const tone = this.getNodeTone(type);
      const color = this.getNodeColor(type);

      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = 120 + col * 200;
      const y = 100 + row * 120;

      const node: ArchitectureNode = {
        id: sym.id,
        label: sym.name,
        name: sym.name,
        type,
        file: sym.filePath,
        line: sym.startLine,
        lines: `${sym.startLine} to ${sym.endLine}`,
        symbolName: sym.name,
        description: `${type} declared in ${sym.filePath}`,
        code: this.extractSymbolSnippet(files, sym),
        callers: [],
        callees: [],
        tests: [],
        incomingRelationships: [],
        outgoingRelationships: [],
        color,
        x,
        y,
        cx: x + 40,
        cy: y - 20,
        a: 24,
        h: 50 + (idx % 3) * 15,
        tone,
      };

      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // 2. Synthesize File Nodes for Files that contain primary entry points or configs if not already present
    files.forEach((file) => {
      const hasSymbols = symbols.some((s) => s.filePath === file.path);
      if (!hasSymbols || file.path.endsWith("package.json") || file.path.includes("README")) {
        const fileNodeId = `node_file_${repositoryId}_${file.path.replace(/[^a-zA-Z0-9]/g, "_")}`;
        if (!nodeMap.has(fileNodeId)) {
          const isConfig = file.path.endsWith("package.json") || file.path.endsWith("tsconfig.json");
          const type: ArchitectureNodeType = isConfig ? "External dependency" : "Source file";
          const node: ArchitectureNode = {
            id: fileNodeId,
            label: file.name,
            name: file.name,
            type,
            file: file.path,
            line: 1,
            lines: `1 to ${file.lineCount}`,
            description: `${type}: ${file.path}`,
            code: file.content.split("\n").slice(0, 15).join("\n"),
            callers: [],
            callees: [],
            tests: [],
            incomingRelationships: [],
            outgoingRelationships: [],
            color: isConfig ? "#A0AEC0" : "#6C4DFF",
            x: 80,
            y: 80 + nodes.length * 30,
            cx: 120,
            cy: 80,
            a: 20,
            h: 40,
            tone: isConfig ? "cyan" : "brand",
          };
          nodes.push(node);
          nodeMap.set(node.id, node);
        }
      }
    });

    // 3. Generate Edges & Link Relationships
    relationships.forEach((rel, idx) => {
      const sourceNode = nodeMap.get(rel.fromSymbolId);
      const targetNode = nodeMap.get(rel.toSymbolId);

      const edgeType = this.mapRelationshipType(rel.type);
      const edgeId = rel.id || `edge_${idx}_${rel.fromSymbolId}_${rel.toSymbolId}`;

      edges.push({
        id: edgeId,
        source: rel.fromSymbolId,
        target: rel.toSymbolId,
        label: edgeType,
        type: edgeType,
      });

      // Populate Node incoming/outgoing details
      if (sourceNode) {
        sourceNode.callees = sourceNode.callees || [];
        if (!sourceNode.callees.includes(rel.toSymbolName)) {
          sourceNode.callees.push(rel.toSymbolName);
        }
        sourceNode.outgoingRelationships = sourceNode.outgoingRelationships || [];
        sourceNode.outgoingRelationships.push({
          nodeId: rel.toSymbolId,
          nodeName: rel.toSymbolName,
          nodeType: targetNode?.type || "Function",
          file: targetNode?.file,
          relationship: edgeType,
          description: `Dispatches ${edgeType.toLowerCase()} to ${rel.toSymbolName}`,
        });
      }

      if (targetNode) {
        targetNode.callers = targetNode.callers || [];
        if (!targetNode.callers.includes(rel.fromSymbolName)) {
          targetNode.callers.push(rel.fromSymbolName);
        }
        if (rel.type === "tests") {
          targetNode.tests = targetNode.tests || [];
          if (!targetNode.tests.includes(`${sourceNode?.file || "tests"}:${rel.fromSymbolName}`)) {
            targetNode.tests.push(`${sourceNode?.file || "tests"}:${rel.fromSymbolName}`);
          }
        }
        targetNode.incomingRelationships = targetNode.incomingRelationships || [];
        targetNode.incomingRelationships.push({
          nodeId: rel.fromSymbolId,
          nodeName: rel.fromSymbolName,
          nodeType: sourceNode?.type || "Function",
          file: sourceNode?.file,
          relationship: edgeType,
          description: `Receives ${edgeType.toLowerCase()} from ${rel.fromSymbolName}`,
        });
      }
    });

    // 4. Calculate Structural Graph Metrics
    const metrics = this.calculateMetrics(nodes, edges);

    return {
      data: {
        repositoryId,
        nodes,
        edges,
      },
      metrics,
    };
  }

  /**
   * Retrieves a focused neighborhood subgraph around a specific node.
   */
  getNeighborhood(
    repositoryId: string,
    nodeId: string,
    depth: number = 1
  ): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
    const full = this.getGraph(repositoryId);
    const visited = new Set<string>();
    const queue: { id: string; currentDepth: number }[] = [{ id: nodeId, currentDepth: 0 }];
    visited.add(nodeId);

    const adjacency = new Map<string, Set<string>>();
    full.data.edges.forEach((edge) => {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    });

    while (queue.length > 0) {
      const { id, currentDepth } = queue.shift()!;
      if (currentDepth >= depth) continue;

      const neighbors = adjacency.get(id) || new Set();
      neighbors.forEach((nbr) => {
        if (!visited.has(nbr)) {
          visited.add(nbr);
          queue.push({ id: nbr, currentDepth: currentDepth + 1 });
        }
      });
    }

    const subNodes = full.data.nodes.filter((n) => visited.has(n.id));
    const subEdges = full.data.edges.filter(
      (e) => visited.has(e.source) && visited.has(e.target)
    );

    return { nodes: subNodes, edges: subEdges };
  }

  /**
   * Finds the shortest verified architecture path between two entities using BFS.
   */
  findPath(repositoryId: string, sourceId: string, targetId: string): PathResult {
    const full = this.getGraph(repositoryId);
    const nodeMap = new Map(full.data.nodes.map((n) => [n.id, n]));

    if (!nodeMap.has(sourceId) || !nodeMap.has(targetId)) {
      return {
        found: false,
        sourceId,
        targetId,
        steps: [],
        length: 0,
        message: "Source or target entity not found in the indexed repository graph.",
      };
    }

    if (sourceId === targetId) {
      const n = nodeMap.get(sourceId)!;
      return {
        found: true,
        sourceId,
        targetId,
        steps: [
          {
            nodeId: n.id,
            nodeName: n.name || n.label,
            nodeType: n.type,
            file: n.file,
            line: n.line,
          },
        ],
        length: 0,
      };
    }

    // Forward adjacency for directed path
    const outgoing = new Map<string, { target: string; edge: ArchitectureEdge }[]>();
    full.data.edges.forEach((e) => {
      if (!outgoing.has(e.source)) outgoing.set(e.source, []);
      outgoing.get(e.source)!.push({ target: e.target, edge: e });
    });

    const queue: { current: string; path: { nodeId: string; edge?: ArchitectureEdge }[] }[] = [
      { current: sourceId, path: [{ nodeId: sourceId }] },
    ];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const { current, path } = queue.shift()!;

      if (current === targetId) {
        // Build steps
        const steps: PathStep[] = path.map((item, i) => {
          const n = nodeMap.get(item.nodeId)!;
          const nextEdge = path[i]?.edge;
          return {
            nodeId: n.id,
            nodeName: n.name || n.label,
            nodeType: n.type,
            file: n.file,
            line: n.line,
            relationshipToNext: (nextEdge?.label as ArchitectureRelationshipType) || undefined,
            evidence: nextEdge
              ? `${n.name || n.label} dispatches ${nextEdge.label} to target`
              : undefined,
          };
        });

        return {
          found: true,
          sourceId,
          targetId,
          steps,
          length: steps.length - 1,
        };
      }

      const neighbors = outgoing.get(current) || [];
      for (const { target, edge } of neighbors) {
        if (!visited.has(target)) {
          visited.add(target);
          queue.push({
            current: target,
            path: [...path, { nodeId: target, edge }],
          });
        }
      }
    }

    return {
      found: false,
      sourceId,
      targetId,
      steps: [],
      length: 0,
      message: `No verified call or import path exists from '${nodeMap.get(sourceId)?.label}' to '${nodeMap.get(targetId)?.label}' in the static index.`,
    };
  }

  /**
   * Computes upstream callers, downstream dependencies, cycles, and test coverage for a specific node.
   */
  getDependencyAnalysis(repositoryId: string, nodeId: string): DependencyAnalysisResult | null {
    const full = this.getGraph(repositoryId);
    const node = full.data.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const directDependencies: { id: string; name: string; type: ArchitectureNodeType; file: string; line?: number }[] = [];
    const directDependents: { id: string; name: string; type: ArchitectureNodeType; file: string; line?: number }[] = [];

    full.data.edges.forEach((edge) => {
      if (edge.source === nodeId) {
        const target = full.data.nodes.find((n) => n.id === edge.target);
        if (target) {
          directDependencies.push({
            id: target.id,
            name: target.name || target.label,
            type: target.type,
            file: target.file,
            line: target.line,
          });
        }
      }
      if (edge.target === nodeId) {
        const source = full.data.nodes.find((n) => n.id === edge.source);
        if (source) {
          directDependents.push({
            id: source.id,
            name: source.name || source.label,
            type: source.type,
            file: source.file,
            line: source.line,
          });
        }
      }
    });

    // Check circular dependencies
    const cycle = full.metrics.circularDependencies.find((c) => c.includes(nodeId));

    // Linked tests
    const linkedTests: { name: string; file: string; line?: number }[] = [];
    directDependents
      .filter((d) => d.type === "Test")
      .forEach((t) => linkedTests.push({ name: t.name, file: t.file, line: t.line }));

    // Related endpoints & databases
    const relatedEndpoints: { name: string; file: string }[] = [];
    const relatedDatabase: { name: string; file: string }[] = [];

    directDependencies.forEach((dep) => {
      if (dep.type === "API endpoint") relatedEndpoints.push({ name: dep.name, file: dep.file });
      if (dep.type === "Database model or table") relatedDatabase.push({ name: dep.name, file: dep.file });
    });

    return {
      nodeId: node.id,
      nodeName: node.name || node.label,
      file: node.file,
      directDependencies,
      directDependents,
      transitiveDependencies: directDependencies.map((d) => d.name),
      dependencyDepth: directDependencies.length > 0 ? 1 : 0,
      isCircular: Boolean(cycle),
      cycleMembers: cycle,
      linkedTests,
      relatedEndpoints,
      relatedDatabase,
    };
  }

  // --- Internal Helpers ---

  private mapSymbolTypeToNodeType(sym: DbCodeSymbol): ArchitectureNodeType {
    switch (sym.type) {
      case "endpoint":
        return "API endpoint";
      case "service":
        return "Service";
      case "test":
        return "Test";
      case "class":
        return "Class";
      case "table":
        return "Database model or table";
      case "function":
      default:
        return "Function";
    }
  }

  private mapRelationshipType(type: DbCodeRelationship["type"]): ArchitectureRelationshipType {
    switch (type) {
      case "calls":
        return "Function calls";
      case "imports":
        return "Imports";
      case "tests":
        return "Test coverage";
      case "queries":
        return "Data access";
      default:
        return "Dependency";
    }
  }

  private getNodeTone(type: ArchitectureNodeType): "brand" | "mint" | "cyan" | "coral" | "purple" | "sun" {
    switch (type) {
      case "API endpoint":
        return "sun";
      case "Service":
        return "mint";
      case "Test":
        return "coral";
      case "Database model or table":
        return "cyan";
      case "Class":
      case "Source file":
        return "purple";
      case "Function":
      default:
        return "brand";
    }
  }

  private getNodeColor(type: ArchitectureNodeType): string {
    switch (type) {
      case "API endpoint":
        return "#FF8C42";
      case "Service":
        return "#2FD6A0";
      case "Test":
        return "#FF5A5F";
      case "Database model or table":
        return "#29D3C2";
      case "Class":
      case "Source file":
        return "#8B7CFF";
      case "External dependency":
        return "#A0AEC0";
      case "Function":
      default:
        return "#6C4DFF";
    }
  }

  private extractSymbolSnippet(files: DbRepositoryFile[], sym: DbCodeSymbol): string {
    const file = files.find((f) => f.path === sym.filePath);
    if (!file) return `// ${sym.filePath}:${sym.startLine}\n// Symbol: ${sym.name}`;

    const lines = file.content.split("\n");
    const start = Math.max(0, sym.startLine - 1);
    const end = Math.min(lines.length, sym.endLine);
    return lines.slice(start, end).join("\n");
  }

  private calculateMetrics(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): GraphMetrics {
    const typeCount: Record<string, number> = {};
    nodes.forEach((n) => {
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    });

    // Degree centrality
    const degreeMap = new Map<string, number>();
    edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
    });

    const centralNodes = Array.from(degreeMap.entries())
      .map(([id, connections]) => {
        const n = nodes.find((node) => node.id === id);
        return { id, name: n?.name || n?.label || id, connections };
      })
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);

    // Isolated nodes
    const connectedSet = new Set<string>();
    edges.forEach((e) => {
      connectedSet.add(e.source);
      connectedSet.add(e.target);
    });
    const isolatedNodes = nodes.filter((n) => !connectedSet.has(n.id)).map((n) => n.id);

    // Detect Circular Dependencies (Tarjan's or DFS cycle detection)
    const cycles = this.findCycles(nodes, edges);

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeTypeBreakdown: typeCount,
      circularDependencies: cycles,
      isolatedNodes,
      centralNodes,
      maxDepth: cycles.length > 0 ? -1 : 3,
    };
  }

  private findCycles(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): string[][] {
    const adj = new Map<string, string[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => {
      if (adj.has(e.source)) adj.get(e.source)!.push(e.target);
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, currentPath: string[]) => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adj.get(nodeId) || [];
      for (const nbr of neighbors) {
        if (!visited.has(nbr)) {
          dfs(nbr, [...currentPath, nbr]);
        } else if (recStack.has(nbr)) {
          const cycleStart = currentPath.indexOf(nbr);
          if (cycleStart >= 0) {
            cycles.push(currentPath.slice(cycleStart));
          } else {
            cycles.push([...currentPath, nbr]);
          }
        }
      }

      recStack.delete(nodeId);
    };

    nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        dfs(n.id, [n.id]);
      }
    });

    return cycles;
  }
}

export const architectureEngine = new ArchitectureEngine();
