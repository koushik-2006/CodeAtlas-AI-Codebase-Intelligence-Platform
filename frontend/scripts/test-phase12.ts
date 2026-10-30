import { db } from "../lib/server/db";
import { knowledgeGraphEngine } from "../lib/server/knowledge-graph";
import { onboardingEngine } from "../lib/server/onboarding-engine";
import { symbolNavigator } from "../lib/server/symbol-navigator";
import { workflowTraceEngine } from "../lib/server/workflow-trace-engine";
import { learningPathEngine } from "../lib/server/learning-path";
import { healthInsightsEngine } from "../lib/server/health-insights-engine";
import { ragService } from "../lib/server/rag-service";

async function runPhase12Tests() {
  console.log("=========================================================================");
  console.log("🚀 Starting CodeAtlas Phase 12 Advanced Intelligence & Knowledge Graph Tests");
  console.log("=========================================================================\n");

  const userId = "usr_default";
  const repoId = "sample-project";

  // ▶ TEST 1: Repository Knowledge Graph Extraction & Completeness
  console.log("▶ TEST 1: Repository Knowledge Graph Entity & Relationship Extraction");
  const kg = knowledgeGraphEngine.getKnowledgeGraph(repoId);

  if (kg.nodes.length === 0 || kg.edges.length === 0) {
    throw new Error("Test 1 Failed: Knowledge Graph returned empty nodes or edges.");
  }

  const hasFiles = kg.nodes.some((n) => n.type === "file");
  const hasDirs = kg.nodes.some((n) => n.type === "directory");
  const hasFunctions = kg.nodes.some((n) => n.type === "function" || n.type === "service");
  const hasTests = kg.nodes.some((n) => n.type === "test");

  if (!hasFiles || !hasDirs || !hasFunctions || !hasTests) {
    throw new Error("Test 1 Failed: Knowledge Graph missing essential entity types.");
  }

  const verifiedEdges = kg.edges.filter((e) => e.isVerified);
  if (verifiedEdges.length === 0) {
    throw new Error("Test 1 Failed: Zero AST-verified edges found in Knowledge Graph.");
  }

  // Neighborhood extraction
  const sampleNode = kg.nodes[0];
  const neighborhood = knowledgeGraphEngine.getKnowledgeGraph(repoId, {
    focusNodeId: sampleNode.id,
    neighborhoodRadius: 1,
  });
  if (neighborhood.nodes.length === 0) {
    throw new Error("Test 1 Failed: Neighborhood BFS extraction failed.");
  }

  console.log(
    `  ✔ Knowledge Graph extracted: ${kg.nodes.length} entities (${Object.keys(kg.metrics.entityTypeDistribution).join(", ")}), ${kg.edges.length} edges (${kg.metrics.verifiedPercentage}% AST Verified, Completeness Score: ${kg.metrics.completenessScore}/100).\n`
  );

  // ▶ TEST 2: Smart Codebase Onboarding & Project Knowledge Report
  console.log("▶ TEST 2: Evidence-Grounded Onboarding Overview & Guided Journey");
  const overview = onboardingEngine.generateRepositoryOverview(repoId);

  if (overview.languages.length === 0 || overview.entryPoints.length === 0) {
    throw new Error("Test 2 Failed: Onboarding overview missing languages or entry points.");
  }

  if (overview.incompleteAreas.length === 0) {
    throw new Error("Test 2 Failed: Incomplete parser limitations were not transparently disclosed.");
  }

  const hasCitations = overview.citations.length > 0 && overview.citations.every((c) => c.file && c.line);
  if (!hasCitations) {
    throw new Error("Test 2 Failed: Architectural overview citations missing real file/line references.");
  }

  // Journey progression
  const journeyBefore = onboardingEngine.getOnboardingJourney(userId, repoId);
  const journeyAfter = onboardingEngine.completeStep(userId, repoId, "understand_structure");
  if (!journeyAfter.steps.find((s) => s.id === "understand_structure")?.isCompleted) {
    throw new Error("Test 2 Failed: Onboarding step completion state did not persist.");
  }

  console.log(
    `  ✔ Onboarding overview generated: ${overview.languages.map((l) => `${l.language} ${l.percentage}%`).join(", ")}, ${overview.entryPoints.length} entry point(s), ${overview.citations.length} verified citation receipts, 6 guided milestones.\n`
  );

  // ▶ TEST 3: Symbol-Level Code Navigation
  console.log("▶ TEST 3: Symbol-Level Navigation (Definitions, Callers, Callees, Tests)");
  const navResult = symbolNavigator.navigateSymbol(repoId, "src/services/auth.ts", 18, "loginUser");

  if (!navResult.definition || navResult.definition.line !== 18) {
    throw new Error("Test 3 Failed: Definition resolution failed for 'loginUser'.");
  }

  if (!navResult.definition.isVerified) {
    throw new Error("Test 3 Failed: AST-defined symbol was not marked as isVerified=true.");
  }

  if (navResult.callers.length === 0) {
    throw new Error("Test 3 Failed: Failed to resolve callers of 'loginUser'.");
  }

  if (navResult.relatedTests.length === 0) {
    throw new Error("Test 3 Failed: Failed to resolve linked test assertions for 'loginUser'.");
  }

  console.log(
    `  ✔ Symbol 'loginUser' resolved: Definition at ${navResult.definition.file}:${navResult.definition.line}, ${navResult.callers.length} caller(s), ${navResult.references.length} cross-file reference(s), ${navResult.relatedTests.length} linked test(s).\n`
  );

  // ▶ TEST 4: Workflow Trace Explorer
  console.log("▶ TEST 4: Architectural Workflow Trace from Entry Points");
  const entryPoints = workflowTraceEngine.getAvailableEntryPoints(repoId);
  if (entryPoints.length === 0) {
    throw new Error("Test 4 Failed: No available entry points discovered.");
  }

  const trace = workflowTraceEngine.traceWorkflow(repoId, "handleSubmit");
  if (trace.steps.length < 4) {
    throw new Error(`Test 4 Failed: Workflow trace has fewer than 4 steps (got ${trace.steps.length}).`);
  }

  const firstStep = trace.steps[0];
  const lastStep = trace.steps[trace.steps.length - 1];
  if (!firstStep.file.includes("LoginForm.tsx") || !lastStep.file.includes("auth.test.ts")) {
    throw new Error("Test 4 Failed: Workflow trace did not correctly traverse from UI submit to test assertion.");
  }

  if (trace.limitations.length === 0) {
    throw new Error("Test 4 Failed: Static analysis limitations were not disclosed.");
  }

  console.log(
    `  ✔ Workflow trace for 'handleSubmit': ${trace.steps.length} sequential execution steps (${Math.round(trace.verifiedRatio * 100)}% AST Proven), verified from ${firstStep.name} to ${lastStep.name}.\n`
  );

  // ▶ TEST 5: Repository Learning Path & Completion Tracking
  console.log("▶ TEST 5: Personalized Repository Learning Curriculum");
  const curriculum = learningPathEngine.getLearningPath(userId, repoId);

  if (curriculum.steps.length !== 6 || curriculum.totalEstimatedMinutes <= 0) {
    throw new Error("Test 5 Failed: Learning path missing milestone steps or reading time estimate.");
  }

  const initialToggle = learningPathEngine.setStepCompletion(userId, repoId, "step_overview", true);
  if (!initialToggle.steps.find((s) => s.id === "step_overview")?.completed) {
    throw new Error("Test 5 Failed: Learning step completion toggle failed.");
  }

  console.log(
    `  ✔ Learning curriculum verified: ${curriculum.steps.length} steps (~${curriculum.totalEstimatedMinutes} mins total reading time, ${initialToggle.progressPercentage}% completed).\n`
  );

  // ▶ TEST 6: Codebase Health Insights & Coupling Analysis
  console.log("▶ TEST 6: Codebase Health Insights, Coupling Ratios & Dismissals");
  const health = healthInsightsEngine.getHealthScore(userId, repoId);

  if (health.overallScore <= 0 || health.overallScore > 100) {
    throw new Error("Test 6 Failed: Health score out of bounds.");
  }

  if (health.insights.length === 0) {
    throw new Error("Test 6 Failed: Zero codebase insights generated.");
  }

  const hasHeuristicDistinction = health.insights.some((i) => i.isHeuristic === true) && health.insights.some((i) => i.isHeuristic === false);
  if (!hasHeuristicDistinction) {
    throw new Error("Test 6 Failed: Health insights failed to distinguish measured facts from heuristic suggestions.");
  }

  // Dismiss insight test
  const sampleInsight = health.insights[0];
  const dismissedHealth = healthInsightsEngine.dismissInsight(userId, repoId, sampleInsight.id);
  const dismissedCheck = dismissedHealth.insights.find((i) => i.id === sampleInsight.id);
  if (!dismissedCheck?.isDismissed) {
    throw new Error("Test 6 Failed: Insight dismissal state did not persist.");
  }

  console.log(
    `  ✔ Codebase Health Score: ${health.overallScore}/100 (Modularity: ${health.modularityScore}/100, Test Linkage: ${Math.round(health.testCoverageRatio * 100)}%, ${health.insights.length} total insight(s) with fact-vs-heuristic tags).\n`
  );

  // ▶ TEST 7: Natural-Language Code Explorer (RAG with Architectural Intent)
  console.log("▶ TEST 7: Natural-Language Code Explorer Querying with Knowledge Graph Context");

  // Query A: Where does the application start?
  const startQuery = await ragService.answerQuestion({
    repositoryId: repoId,
    question: "Where does the application start?",
    userId,
  });
  if (!startQuery.answer.includes("LoginForm.tsx") && !startQuery.answer.includes("auth.ts")) {
    throw new Error("Test 7 Failed: Natural language query did not identify application entry point.");
  }

  // Query B: Where is the database accessed?
  const dbQuery = await ragService.answerQuestion({
    repositoryId: repoId,
    question: "Where is the database accessed?",
    userId,
  });
  if (dbQuery.sources.length === 0) {
    throw new Error("Test 7 Failed: Database query returned 0 verified citations.");
  }

  // Query C: Which tests are related to login?
  const testQuery = await ragService.answerQuestion({
    repositoryId: repoId,
    question: "Which tests verify login authentication?",
    userId,
  });
  if (!testQuery.sources.some((s) => s.file.includes("test") || s.file.includes("auth"))) {
    throw new Error("Test 7 Failed: Test query failed to cite test suites.");
  }

  console.log("  ✔ Natural-language code queries successfully resolved entry points, database access, and test suites with verified citations.\n");

  console.log("=========================================================================");
  console.log("🎉 ALL 7 PHASE 12 ADVANCED CODE INTELLIGENCE TESTS PASSED WITH ZERO ERRORS!");
  console.log("=========================================================================\n");
}

runPhase12Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Phase 12 Test Suite Failed:", err);
    process.exit(1);
  });
