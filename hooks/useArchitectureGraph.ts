"use client";

import { useState, useEffect } from "react";
import { ArchitectureNode, ArchitectureEdge } from "@/types/architecture";
import { architectureService } from "@/services/architecture-service";

export function useArchitectureGraph(repositoryId: string = "my-project") {
  const [nodes, setNodes] = useState<ArchitectureNode[]>([]);
  const [edges, setEdges] = useState<ArchitectureEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("auth");
  const [viewStyle, setViewStyle] = useState<"graph" | "city">("graph");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGraph() {
      setLoading(true);
      const res = await architectureService.getGraphForRepository(repositoryId);
      setNodes(res.data.nodes);
      setEdges(res.data.edges);
      setLoading(false);
    }
    fetchGraph();
  }, [repositoryId]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  return {
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    viewStyle,
    setViewStyle,
    loading,
  };
}
