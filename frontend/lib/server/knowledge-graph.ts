import { db } from "./db";
import {
  KnowledgeGraphData,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  KnowledgeNodeType,
  KnowledgeEdgeType,
  KnowledgeGraphMetrics,
  KnowledgeGraphQueryOptions,
} from "@/types/knowledge-graph";
import { DbCodeSymbol, DbRepositoryFile, DbCodeRelationship } from "@/types/database";

export class KnowledgeGraphEngine {
  /**
   * Builds the comprehensive repository knowledge graph with entities, verified & heuristic relationships,
   * source evidence, and completeness metrics.
   */
  getKnowledgeGraph(repositoryId: string = "sample-project", options?: KnowledgeGraphQueryOptions): KnowledgeGraphData {
    const files = db.getRepositoryFiles(repositoryId);
    const symbols = db.getCodeSymbols(repositoryId);
    const relationships = db.getCodeRelationships(repositoryId);

    const nodesMap = new Map<string, KnowledgeGraphNode>();
    const edgesMap = new Map<string, KnowledgeGraphEdge>();

    // 1. Ingest Directory Nodes (Top-level & Nested)
    const directorySet = new Set<string>();
    files.forEach((file) => {
      const parts = file.path.split("/");
      let currentDir = "";
      for (let i = 0; i < parts.length - 1; i++) {
        currentDir = currentDir ? `${currentDir}/${parts[i]}` : parts[i];
        directorySet.add(currentDir);
      }
    });

    directorySet.forEach((dir) => {
      const dirNodeId = `kg_dir_${repositoryId}_${dir.replace(/[^a-zA-Z0-9]/g, "_")}`;
      nodesMap.set(dirNodeId, {
        id: dirNodeId,
        name: dir,
        type: "directory",
        filePath: dir,
        description: `Source directory '${dir}' containing module assets`,
        inDegree: 0,
        outDegree: 0,
      });
    });

    // 2. Ingest File Nodes & Config/Doc classification
    files.forEach((file) => {
      const isConfig =
        file.name.includes("config") ||
        file.name === "package.json" ||
        file.name === "tsconfig.json" ||
        file.name === "Dockerfile";
      const isDoc = file.name.endsWith(".md") || file.name.endsWith(".txt") || file.path.includes("docs/");
      const isTest = file.name.includes(".test.") || file.name.includes(".spec.") || file.path.startsWith("tests/");

      const fileNodeType: KnowledgeNodeType = isConfig ? "config" : isDoc ? "doc" : isTest ? "test" : "file";
      const fileNodeId = `kg_file_${repositoryId}_${file.path.replace(/[^a-zA-Z0-9]/g, "_")}`;

      nodesMap.set(fileNodeId, {
        id: fileNodeId,
        name: file.name,
        type: fileNodeType,
        filePath: file.path,
        startLine: 1,
        endLine: file.lineCount,
        description: `${file.language} ${fileNodeType} (${file.lineCount} lines)`,
        metadata: {
          size: file.size,
          language: file.language,
        },
        inDegree: 0,
        outDegree: 0,
      });

      // Connect Directory -> File (defines)
      const lastSlash = file.path.lastIndexOf("/");
      if (lastSlash > 0) {
        const parentDir = file.path.substring(0, lastSlash);
        const parentDirId = `kg_dir_${repositoryId}_${parentDir.replace(/[^a-zA-Z0-9]/g, "_")}`;
        if (nodesMap.has(parentDirId)) {
          const edgeId = `edge_dir_${parentDirId}_${fileNodeId}`;
          edgesMap.set(edgeId, {
            id: edgeId,
            source: parentDirId,
            target: fileNodeId,
            type: "defines",
            isVerified: true,
            evidence: {
              sourceFile: file.path,
              syntaxEvidence: `File located within directory ${parentDir}`,
              confidence: 1.0,
              parserType: "manifest_parsed",
            },
          });
        }
      }
    });

    // 3. Ingest Symbols (Functions, Classes, Services, Endpoints, Tables, Tests)
    symbols.forEach((sym) => {
      const symNodeType: KnowledgeNodeType =
        sym.type === "endpoint"
          ? "endpoint"
          : sym.type === "service"
          ? "service"
          : sym.type === "class"
          ? "class"
          : sym.type === "table"
          ? "model"
          : sym.type === "test"
          ? "test"
          : "function";

      const symNodeId = `kg_sym_${repositoryId}_${sym.id}`;
      nodesMap.set(symNodeId, {
        id: symNodeId,
        name: sym.name,
        type: symNodeType,
        filePath: sym.filePath,
        startLine: sym.startLine,
        endLine: sym.endLine,
        scope: sym.scope,
        description: `${symNodeType} declaration in ${sym.filePath}:${sym.startLine}`,
        metadata: {
          parameters: sym.parameters || [],
          originalType: sym.type,
        },
        inDegree: 0,
        outDegree: 0,
      });

      // Connect File -> Symbol (defines)
      const fileNodeId = `kg_file_${repositoryId}_${sym.filePath.replace(/[^a-zA-Z0-9]/g, "_")}`;
      if (nodesMap.has(fileNodeId)) {
        const edgeId = `edge_def_${fileNodeId}_${symNodeId}`;
        edgesMap.set(edgeId, {
          id: edgeId,
          source: fileNodeId,
          target: symNodeId,
          type: "defines",
          isVerified: true,
          evidence: {
            sourceFile: sym.filePath,
            startLine: sym.startLine,
            endLine: sym.endLine,
            syntaxEvidence: `AST declaration on line ${sym.startLine}`,
            confidence: 1.0,
            parserType: "ast_static",
          },
        });
      }
    });

    // 4. Ingest Syntactically Verified Relationships from AST
    relationships.forEach((rel) => {
      const fromNodeId = `kg_sym_${repositoryId}_${rel.fromSymbolId}`;
      const toNodeId = `kg_sym_${repositoryId}_${rel.toSymbolId}`;

      if (nodesMap.has(fromNodeId) && nodesMap.has(toNodeId)) {
        const edgeType: KnowledgeEdgeType =
          rel.type === "calls"
            ? "calls"
            : rel.type === "tests"
            ? "tests"
            : rel.type === "queries"
            ? "accesses_db"
            : "references";

        const edgeId = `edge_rel_${rel.id}`;
        edgesMap.set(edgeId, {
          id: edgeId,
          source: fromNodeId,
          target: toNodeId,
          type: edgeType,
          isVerified: true,
          evidence: {
            sourceFile: nodesMap.get(fromNodeId)!.filePath,
            startLine: nodesMap.get(fromNodeId)!.startLine,
            syntaxEvidence: `${rel.fromSymbolName} -> ${rel.toSymbolName} [${rel.type}]`,
            confidence: 0.98,
            parserType: "ast_static",
          },
        });
      }
    });

    // 5. Ingest File-to-File Import Relationships
    files.forEach((file) => {
      const sourceFileId = `kg_file_${repositoryId}_${file.path.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const importMatches = file.content.matchAll(/(?:import\s+(?:.*?\s+from\s+)?["'](.*?)["']|require\(["'](.*?)["']\))/g);

      for (const match of importMatches) {
        const importSpecifier = match[1] || match[2];
        if (!importSpecifier) continue;

        // Resolve relative import to repo file
        let targetFilePath = "";
        if (importSpecifier.startsWith(".")) {
          const currentDir = file.path.substring(0, file.path.lastIndexOf("/"));
          const combined = `${currentDir}/${importSpecifier}`.replace(/\/\.\//g, "/");
          const candidate = files.find(
            (f) =>
              f.path === combined ||
              f.path === `${combined}.ts` ||
              f.path === `${combined}.tsx` ||
              f.path === `${combined}.js` ||
              f.path === `${combined}/index.ts`
          );
          if (candidate) targetFilePath = candidate.path;
        }

        if (targetFilePath) {
          const targetFileId = `kg_file_${repositoryId}_${targetFilePath.replace(/[^a-zA-Z0-9]/g, "_")}`;
          if (nodesMap.has(targetFileId)) {
            const edgeId = `edge_imp_${sourceFileId}_${targetFileId}`;
            if (!edgesMap.has(edgeId)) {
              edgesMap.set(edgeId, {
                id: edgeId,
                source: sourceFileId,
                target: targetFileId,
                type: "imports",
                isVerified: true,
                evidence: {
                  sourceFile: file.path,
                  syntaxEvidence: `import specifier: ${importSpecifier}`,
                  confidence: 0.95,
                  parserType: "ast_static",
                },
              });
            }
          }
        } else if (!importSpecifier.startsWith(".")) {
          // External Package dependency
          const pkgName = importSpecifier.split("/")[0].replace(/^@/, "@" + (importSpecifier.split("/")[1] ? importSpecifier.split("/")[1] : ""));
          const pkgNodeId = `kg_pkg_${repositoryId}_${pkgName.replace(/[^a-zA-Z0-9]/g, "_")}`;
          if (!nodesMap.has(pkgNodeId)) {
            nodesMap.set(pkgNodeId, {
              id: pkgNodeId,
              name: pkgName,
              type: "package",
              filePath: "package.json",
              description: `External dependency package: ${pkgName}`,
              inDegree: 0,
              outDegree: 0,
            });
          }
          const edgeId = `edge_dep_${sourceFileId}_${pkgNodeId}`;
          if (!edgesMap.has(edgeId)) {
            edgesMap.set(edgeId, {
              id: edgeId,
              source: sourceFileId,
              target: pkgNodeId,
              type: "references",
              isVerified: true,
              evidence: {
                sourceFile: file.path,
                syntaxEvidence: `import from external package: ${importSpecifier}`,
                confidence: 0.95,
                parserType: "ast_static",
              },
            });
          }
        }
      }
    });

    // 6. Calculate In/Out Degrees for all nodes
    edgesMap.forEach((edge) => {
      const srcNode = nodesMap.get(edge.source);
      const tgtNode = nodesMap.get(edge.target);
      if (srcNode) srcNode.outDegree++;
      if (tgtNode) tgtNode.inDegree++;
    });

    let allNodes = Array.from(nodesMap.values());
    let allEdges = Array.from(edgesMap.values());

    // 7. Apply Query Filter Options (if requested)
    if (options) {
      if (options.nodeTypes && options.nodeTypes.length > 0) {
        const typesSet = new Set(options.nodeTypes);
        allNodes = allNodes.filter((n) => typesSet.has(n.type));
        const remainingNodeIds = new Set(allNodes.map((n) => n.id));
        allEdges = allEdges.filter((e) => remainingNodeIds.has(e.source) && remainingNodeIds.has(e.target));
      }

      if (options.verifiedOnly) {
        allEdges = allEdges.filter((e) => e.isVerified);
      }

      if (options.searchQuery) {
        const q = options.searchQuery.toLowerCase();
        allNodes = allNodes.filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            n.filePath.toLowerCase().includes(q) ||
            (n.description && n.description.toLowerCase().includes(q))
        );
        const matchedIds = new Set(allNodes.map((n) => n.id));
        allEdges = allEdges.filter((e) => matchedIds.has(e.source) && matchedIds.has(e.target));
      }

      if (options.focusNodeId && options.neighborhoodRadius) {
        const neighborhood = this.extractNeighborhood(allNodes, allEdges, options.focusNodeId, options.neighborhoodRadius);
        allNodes = neighborhood.nodes;
        allEdges = neighborhood.edges;
      }

      if (options.limit && options.limit > 0) {
        allNodes = allNodes.slice(0, options.limit);
        const limitedIds = new Set(allNodes.map((n) => n.id));
        allEdges = allEdges.filter((e) => limitedIds.has(e.source) && limitedIds.has(e.target));
      }
    }

    // 8. Compute Knowledge Graph Metrics
    const verifiedEdgesCount = allEdges.filter((e) => e.isVerified).length;
    const verifiedPercentage = allEdges.length > 0 ? Math.round((verifiedEdgesCount / allEdges.length) * 100) : 100;

    const entityTypeDistribution: Record<string, number> = {};
    allNodes.forEach((n) => {
      entityTypeDistribution[n.type] = (entityTypeDistribution[n.type] || 0) + 1;
    });

    const relationshipTypeDistribution: Record<string, number> = {};
    allEdges.forEach((e) => {
      relationshipTypeDistribution[e.type] = (relationshipTypeDistribution[e.type] || 0) + 1;
    });

    const completenessScore = Math.min(
      100,
      Math.round((allNodes.length > 0 ? 30 : 0) + (allEdges.length > 0 ? 30 : 0) + (verifiedPercentage * 0.4))
    );

    const metrics: KnowledgeGraphMetrics = {
      totalEntities: allNodes.length,
      totalRelationships: allEdges.length,
      verifiedPercentage,
      entityTypeDistribution,
      relationshipTypeDistribution,
      completenessScore,
      indexingStatus: "complete",
      lastGenerated: new Date().toISOString(),
    };

    return {
      repositoryId,
      nodes: allNodes,
      edges: allEdges,
      metrics,
    };
  }

  /**
   * Bounded BFS neighborhood extraction around a focus node.
   */
  private extractNeighborhood(
    nodes: KnowledgeGraphNode[],
    edges: KnowledgeGraphEdge[],
    focusNodeId: string,
    radius: number
  ): { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] } {
    const visited = new Set<string>([focusNodeId]);
    let currentLevel = new Set<string>([focusNodeId]);

    const adj = new Map<string, Set<string>>();
    edges.forEach((e) => {
      if (!adj.has(e.source)) adj.set(e.source, new Set());
      if (!adj.has(e.target)) adj.set(e.target, new Set());
      adj.get(e.source)!.add(e.target);
      adj.get(e.target)!.add(e.source);
    });

    for (let r = 0; r < radius; r++) {
      const nextLevel = new Set<string>();
      currentLevel.forEach((nodeId) => {
        const neighbors = adj.get(nodeId);
        if (neighbors) {
          neighbors.forEach((nbr) => {
            if (!visited.has(nbr)) {
              visited.add(nbr);
              nextLevel.add(nbr);
            }
          });
        }
      });
      currentLevel = nextLevel;
      if (currentLevel.size === 0) break;
    }

    const filteredNodes = nodes.filter((n) => visited.has(n.id));
    const filteredEdges = edges.filter((e) => visited.has(e.source) && visited.has(e.target));

    return { nodes: filteredNodes, edges: filteredEdges };
  }
}

export const knowledgeGraphEngine = new KnowledgeGraphEngine();
