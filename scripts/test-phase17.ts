import { multiRepoService } from "../lib/server/multi-repo-service";
import { CrossRepoSearchRequest, CrossRepoImpactRequest } from "../types/multi-repo";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runPhase17Tests() {
  console.log("\n=========================================================================");
  console.log("🚀 Starting CodeAtlas Phase 17 Multi-Repository Intelligence Tests");
  console.log("=========================================================================\n");

  const userId = "usr_default";

  // -------------------------------------------------------------------------
  // TEST 1: Authorized Repository Enumeration & Freshness Status
  // -------------------------------------------------------------------------
  console.log("▶ TEST 1: Authorized Repository Enumeration & Independent Boundary Checks");
  const authorizedRepos = multiRepoService.getAuthorizedRepositories(userId);
  assert(authorizedRepos.length >= 4, `Expected at least 4 authorized repos, got ${authorizedRepos.length}`);

  const sampleRepo = authorizedRepos.find((r) => r.id === "sample-project");
  const sharedRepo = authorizedRepos.find((r) => r.id === "shared-core-lib");
  const authRepo = authorizedRepos.find((r) => r.id === "auth-service");
  const paymentRepo = authorizedRepos.find((r) => r.id === "payment-service");

  assert(!!sampleRepo, "sample-project must be authorized for usr_default");
  assert(!!sharedRepo, "shared-core-lib must be authorized for usr_default");
  assert(!!authRepo, "auth-service must be authorized for usr_default");
  assert(!!paymentRepo, "payment-service must be authorized for usr_default");

  // Verify secret-vault is unauthorized for usr_default
  const hasSecretVault = authorizedRepos.some((r) => r.id === "secret-vault");
  assert(!hasSecretVault, "CRITICAL: secret-vault must NOT be accessible to usr_default (strict isolation)");

  // Check revision and branch attribution
  assert(sampleRepo!.revision === "main@b7f8e12", `Expected sample-project revision main@b7f8e12, got ${sampleRepo!.revision}`);
  assert(sharedRepo!.revision === "v2.1.0@f4a91c0", `Expected shared-core-lib revision v2.1.0@f4a91c0, got ${sharedRepo!.revision}`);

  // Test independent verification method
  const accessCheck = multiRepoService.verifyRepositoryAccess(userId, ["sample-project", "secret-vault"]);
  assert(accessCheck.authorizedIds.includes("sample-project"), "sample-project must be verified as authorized");
  assert(accessCheck.deniedIds.includes("secret-vault"), "secret-vault must be rejected into deniedIds");

  console.log(`  ✔ Verified ${authorizedRepos.length} authorized repos with revision attribution. Unauthorized 'secret-vault' correctly isolated.`);

  // -------------------------------------------------------------------------
  // TEST 2: Cross-Repository Code Search & Exact Symbol Matching
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 2: Cross-Repository Code Search & Exact Symbol Prioritization");
  const searchExact = multiRepoService.crossRepoSearch(userId, {
    query: "validateEmail",
    exactSymbol: true,
  });

  assert(searchExact.total >= 2, `Expected at least 2 exact matches for validateEmail, got ${searchExact.total}`);
  const matchRepos = new Set(searchExact.results.map((r) => r.repositoryId));
  assert(matchRepos.has("sample-project"), "validateEmail must be found in sample-project");
  assert(matchRepos.has("shared-core-lib"), "validateEmail must be found in shared-core-lib");

  // Verify exact matches have exact_symbol matchType and correct revision
  const exactResult = searchExact.results[0];
  assert(exactResult.matchType === "exact_symbol", "Top match must be flagged as exact_symbol");
  assert(!!exactResult.revision, "Result must contain repository revision identifier");

  // Verify unauthorized repositories never appear in search results
  const leakedSecret = searchExact.results.some((r) => r.repositoryId === "secret-vault");
  assert(!leakedSecret, "CRITICAL: Unauthorized repository results must never leak into search output");

  console.log(`  ✔ Search returned ${searchExact.total} matches across ${Object.keys(searchExact.groupedByRepo).length} repos. Exact symbol match prioritized.`);

  // -------------------------------------------------------------------------
  // TEST 3: Multi-Entity Category Filtering & Result Deduplication
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 3: Multi-Entity Category Filtering (APIs, Manifests, Tests)");
  const manifestSearch = multiRepoService.crossRepoSearch(userId, {
    query: "package.json",
    category: "manifest",
  });
  assert(manifestSearch.total >= 3, `Expected at least 3 manifest files, got ${manifestSearch.total}`);

  const apiSearch = multiRepoService.crossRepoSearch(userId, {
    query: "/api/v1/auth",
    category: "api",
  });
  assert(apiSearch.total >= 1, "Expected to find /api/v1/auth endpoint");
  assert(apiSearch.results[0].category === "api", "Category must match API endpoint");

  console.log(`  ✔ Successfully filtered across ${manifestSearch.total} package manifests and API endpoints.`);

  // -------------------------------------------------------------------------
  // TEST 4: Cross-Repository Dependency Graph & Relationship Categories
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 4: Cross-Repository Dependency Discovery & Multi-Category Extraction");
  const graph = multiRepoService.getDependencyGraph(userId);
  assert(graph.nodes.length >= 4, `Expected at least 4 nodes, got ${graph.nodes.length}`);
  assert(graph.edges.length >= 3, `Expected at least 3 dependency edges, got ${graph.edges.length}`);

  // 1. Check verified package dependency from sample-project to shared-core-lib
  const pkgDep = graph.edges.find(
    (e) => e.sourceRepoId === "sample-project" && e.targetRepoId === "shared-core-lib" && e.type === "verified_package_dependency"
  );
  assert(!!pkgDep, "Verified package dependency from sample-project to shared-core-lib must exist");
  assert(pkgDep!.packageName === "@acme/shared-utils", "Package name must be @acme/shared-utils");
  assert(pkgDep!.evidenceFile === "package.json", "Evidence must cite package.json");

  // 2. Check configured service relationship from sample-project to auth-service
  const svcRel = graph.edges.find(
    (e) => e.sourceRepoId === "sample-project" && e.targetRepoId === "auth-service" && e.type === "configured_service_relationship"
  );
  assert(!!svcRel, "Configured service relationship from sample-project to auth-service must exist");
  assert(svcRel!.confidence === "configured", "Confidence must be 'configured'");

  // 3. Check internal library classification
  assert(graph.stats.internalLibraries >= 1, "Graph stats must reflect internal library dependencies");

  console.log(`  ✔ Graph constructed: ${graph.nodes.length} nodes, ${graph.edges.length} edges across package manifests and service configurations.`);

  // -------------------------------------------------------------------------
  // TEST 5: Cross-Repository AI Question Answering with Citations
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 5: Cross-Repository RAG Question Answering & Source Citations");
  const authAnswer = await multiRepoService.answerCrossRepoQuestion(userId, {
    question: "Which repository defines the authentication service?",
    repositoryIds: ["sample-project", "auth-service", "shared-core-lib"],
  });

  assert(authAnswer.confidence === "supported", "Confidence must be supported with source evidence");
  assert(authAnswer.citations.length >= 1, "Must contain verified source citations");
  assert(authAnswer.confirmedFacts.length >= 1, "Must contain confirmed facts");

  const citesAuthService = authAnswer.citations.some((c) => c.repositoryId === "auth-service" && c.filePath.includes("server.ts"));
  assert(citesAuthService, "Must cite auth-service/src/server.ts for authentication endpoint definition");

  // Test question on shared package usage
  const pkgAnswer = await multiRepoService.answerCrossRepoQuestion(userId, {
    question: "Where is the @acme/shared-utils package used across projects?",
    repositoryIds: ["sample-project", "auth-service", "payment-service", "shared-core-lib"],
  });
  assert(pkgAnswer.citations.length >= 2, "Must cite consuming manifests for @acme/shared-utils");

  console.log(`  ✔ Cross-repo RAG answered queries with verified citations (${authAnswer.citations.length} citations) across multiple repositories.`);

  // -------------------------------------------------------------------------
  // TEST 6: Candidate Duplicate Implementation Discovery
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 6: Candidate Duplicate Discovery & Reuse Opportunities");
  const duplicates = multiRepoService.discoverDuplicates(userId);
  assert(duplicates.length >= 1, `Expected at least 1 duplicate candidate, got ${duplicates.length}`);

  const emailDup = duplicates.find((d) => d.id === "dup_validate_email");
  assert(!!emailDup, "dup_validate_email must be detected between sample-project and shared-core-lib");
  assert(emailDup!.isExactMatch === true, "validateEmail must be identified as an exact normalized AST match");
  assert(emailDup!.similarityScore >= 90, "Similarity score must be >= 90");
  assert(emailDup!.instances.length === 2, "Must link 2 repository instances");
  assert(emailDup!.instances[0].repositoryId === "sample-project", "Instance 1 must be sample-project");
  assert(emailDup!.instances[1].repositoryId === "shared-core-lib", "Instance 2 must be shared-core-lib");
  assert(emailDup!.reuseRecommendation.includes("@acme/shared-utils"), "Recommendation must suggest consolidating into shared library");

  console.log(`  ✔ Detected duplicate candidate '${emailDup!.title}' (${emailDup!.similarityScore}% match, exact AST match: ${emailDup!.isExactMatch}).`);

  // -------------------------------------------------------------------------
  // TEST 7: Shared API & Microservice Catalog Discovery
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 7: Shared API & Microservice Catalog Discovery");
  const endpoints = multiRepoService.discoverSharedAPIs(userId);
  assert(endpoints.length >= 1, `Expected at least 1 shared endpoint, got ${endpoints.length}`);

  const authEndpoint = endpoints.find((e) => e.endpointPath === "/api/v1/auth/session");
  assert(!!authEndpoint, "/api/v1/auth/session must be discovered");
  assert(authEndpoint!.httpMethod === "POST", "HTTP method must be POST");
  assert(authEndpoint!.repositoryId === "auth-service", "Must be defined in auth-service");
  assert(authEndpoint!.consumers.length >= 1, "Must identify client consumer in sample-project");
  assert(authEndpoint!.consumers[0].repositoryId === "sample-project", "Consumer must be sample-project");
  assert(authEndpoint!.relatedTests.length >= 1, "Must identify related integration test");

  console.log(`  ✔ Cataloged ${endpoints.length} shared service endpoints with verified caller references and integration tests.`);

  // -------------------------------------------------------------------------
  // TEST 8: Cross-Repository Change Impact Analysis
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 8: Cross-Repository Change Impact Analysis");
  const impactRequest: CrossRepoImpactRequest = {
    sourceRepoId: "shared-core-lib",
    changedComponent: {
      type: "symbol",
      name: "validateEmail",
      file: "src/validation.ts",
      isBreaking: true,
    },
  };

  const impactReport = multiRepoService.analyzeCrossRepoImpact(userId, impactRequest);
  assert(impactReport.riskLevel === "Critical", `Expected Critical risk for breaking change, got ${impactReport.riskLevel}`);
  assert(impactReport.affectedRepositories.length >= 2, `Expected at least 2 affected repositories, got ${impactReport.affectedRepositories.length}`);

  const affectedNames = impactReport.affectedRepositories.map((r) => r.repositoryName);
  assert(affectedNames.includes("sample-project"), "sample-project must be impacted");
  assert(affectedNames.includes("auth-service"), "auth-service must be impacted");

  const sampleImpact = impactReport.affectedRepositories.find((r) => r.repositoryId === "sample-project")!;
  assert(sampleImpact.recommendedTests.length >= 1, "Must recommend tests to rerun in consuming repo");
  assert(sampleImpact.recommendedTests[0].file === "tests/auth.test.ts", "Must recommend tests/auth.test.ts");

  console.log(`  ✔ Change impact evaluated: ${impactReport.riskLevel} risk (${impactReport.riskScore}/100) affecting ${impactReport.affectedRepositories.length} consuming repositories.`);

  // -------------------------------------------------------------------------
  // TEST 9: Organization-Wide Technology Insights
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 9: Organization-Wide Technology Insights & Metrics");
  const insights = multiRepoService.getTechnologyInsights(userId);
  assert(insights.totalRepositories >= 4, `Expected at least 4 repositories, got ${insights.totalRepositories}`);
  assert(insights.languages.length >= 1, "Must summarize programming languages");
  assert(insights.topDependencies.length >= 1, "Must aggregate shared dependencies");
  assert(insights.internalLibrariesCount >= 1, "Must detect internal libraries");
  assert(!!insights.methodologyNotice, "Must document calculation methodology");

  console.log(`  ✔ Technology insights generated: ${insights.languages.map((l) => `${l.name} (${l.percentage}%)`).join(", ")}.`);

  // -------------------------------------------------------------------------
  // TEST 10: Stale Indexing & Partial Scope Disclosures
  // -------------------------------------------------------------------------
  console.log("\n▶ TEST 10: Stale Indexing & Incomplete Scope Disclosure");
  const staleRepos = authorizedRepos.filter((r) => r.isStale);
  assert(staleRepos.length >= 1, `Expected at least 1 repository flagged as stale, got ${staleRepos.length}`);
  assert(staleRepos[0].status === "stale", "Freshness status must be 'stale' for repositories not indexed within 24h");

  console.log(`  ✔ Stale indexing correctly detected and disclosed (${staleRepos.length} stale repository identified).`);

  console.log("\n=========================================================================");
  console.log("🎉 ALL CODEATLAS PHASE 17 MULTI-REPOSITORY TESTS PASSED SUCCESSFULLY! (10/10)");
  console.log("=========================================================================\n");
}

runPhase17Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
