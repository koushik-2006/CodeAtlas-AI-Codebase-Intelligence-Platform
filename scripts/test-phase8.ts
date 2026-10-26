import assert from "assert";
import { architectureEngine } from "../lib/server/architecture-engine";
import { impactEngine } from "../lib/server/impact-engine";
import { db } from "../lib/server/db";

async function runPhase8TestSuite() {
  console.log("🚀 Starting Phase 8 Architecture & Change-Impact Test Suite...\n");

  // 1. Architecture Graph Generation
  console.log("▶ Test 1: Grounded Architecture Graph Derivation from Indexed Codebase");
  const graphResult = architectureEngine.getGraph("sample-project");
  assert(graphResult.data.nodes.length >= 6, "Expected at least 6 architecture nodes");
  assert(graphResult.data.edges.length >= 4, "Expected at least 4 architecture edges");

  const functionNode = graphResult.data.nodes.find((n) => n.name === "loginUser" || n.label.includes("loginUser"));
  assert(functionNode, "loginUser function node must be present");
  assert(functionNode.file.includes("auth.ts"), "loginUser node must point to auth.ts");
  assert(functionNode.line && functionNode.line > 0, "loginUser node must have verified line number");

  console.log(`  ✔ Derived ${graphResult.data.nodes.length} nodes and ${graphResult.data.edges.length} edges with verified source locations.`);

  // 2. Graph Metrics & Cycle Detection
  console.log("▶ Test 2: Graph Metrics, Centrality & Cycle Detection");
  assert(graphResult.metrics.totalNodes === graphResult.data.nodes.length, "Metrics totalNodes must match node count");
  assert(Array.isArray(graphResult.metrics.centralNodes), "Central nodes must be an array");
  assert(Array.isArray(graphResult.metrics.circularDependencies), "Circular dependencies must be tracked");
  console.log(`  ✔ Computed graph metrics: ${graphResult.metrics.centralNodes.length} central nodes, ${graphResult.metrics.circularDependencies.length} cycles detected.`);

  // 3. Neighborhood Extraction
  console.log("▶ Test 3: Neighborhood-First Subgraph Retrieval");
  const targetId = functionNode.id;
  const neighborhood = architectureEngine.getNeighborhood("sample-project", targetId, 1);
  assert(neighborhood.nodes.length > 0, "Neighborhood must return nodes");
  assert(neighborhood.nodes.some((n) => n.id === targetId), "Neighborhood must include root node");
  console.log(`  ✔ Extracted 1-hop neighborhood containing ${neighborhood.nodes.length} connected entities.`);

  // 4. Graph Path Explorer
  console.log("▶ Test 4: Graph Path Explorer (Shortest Verified Path)");
  const submitNode = graphResult.data.nodes.find((n) => n.name === "handleSubmit");
  const serviceNode = graphResult.data.nodes.find((n) => n.name === "UserService");

  if (submitNode && serviceNode) {
    const path = architectureEngine.findPath("sample-project", submitNode.id, serviceNode.id);
    assert(path.found, "Expected verified path between handleSubmit and UserService");
    assert(path.steps.length >= 2, "Path must contain at least 2 steps");
    console.log(`  ✔ Traced verified path: ${path.steps.map((s) => s.nodeName).join(" -> ")} (${path.length} hops).`);
  }

  // 5. Unconnected Path Safety (Honest Rejection)
  console.log("▶ Test 5: Unconnected Path Safety & Disconnected Fallback");
  const fakeTargetId = "node_non_existent_xyz";
  const missingPath = architectureEngine.findPath("sample-project", functionNode.id, fakeTargetId);
  assert(!missingPath.found, "Must return found: false for unverified path");
  assert(missingPath.message && missingPath.message.length > 0, "Must provide clear honest explanation");
  console.log("  ✔ Unreachable path cleanly rejected without hallucinating edges.");

  // 6. Dependency Analysis
  console.log("▶ Test 6: Node Dependency & Caller Analysis");
  const depAnalysis = architectureEngine.getDependencyAnalysis("sample-project", functionNode.id);
  assert(depAnalysis !== null, "Dependency analysis must exist for loginUser");
  assert(depAnalysis.directDependents.length > 0, "loginUser must have direct callers");
  console.log(`  ✔ Identified ${depAnalysis.directDependents.length} direct caller(s) and ${depAnalysis.directDependencies.length} outbound dependencies.`);

  // 7. Grounded Change Impact Intelligence
  console.log("▶ Test 7: Change Impact Calculation & Safety Disclosures");
  const impact = impactEngine.analyzeImpact({
    repositoryId: "sample-project",
    file: "src/services/auth.ts",
    symbol: "loginUser",
  });

  assert(impact.riskScore > 0, "Risk score must be positive");
  assert(impact.riskLevel === "High" || impact.riskLevel === "Medium", "Risk level must reflect caller impact");
  assert(impact.directlyDependent.length > 0, "Must list directly dependent callers");
  assert(impact.testsToRerun.length > 0, "Must identify affected test suites");
  assert(impact.limitationsNote && impact.limitationsNote.includes("Never assume"), "Must disclose safety limitations");
  assert(!impact.isSimulated, "Must be computed from actual AST index, not simulated");

  console.log(`  ✔ Computed impact: Severity ${impact.riskLevel} (Score ${impact.riskScore}/100), ${impact.directlyDependent.length} caller(s), ${impact.testsToRerun.length} test(s) to re-run.`);

  console.log("\n🎉 All 7 Phase 8 Architecture & Change-Impact Tests Passed Successfully!\n");
}

runPhase8TestSuite().catch((err) => {
  console.error("❌ Phase 8 Test Suite Failed:", err);
  process.exit(1);
});
