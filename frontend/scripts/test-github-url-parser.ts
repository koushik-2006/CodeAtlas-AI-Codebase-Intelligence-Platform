import { parseGitHubUrl } from "../lib/github-url-parser";

console.log("=========================================");
console.log("  Testing GitHub URL Parser & Normalizer ");
console.log("=========================================\n");

const TEST_CASES = [
  {
    input: "https://github.com/koushik-2006/Tourist-Management-System",
    expectedOwner: "koushik-2006",
    expectedRepo: "Tourist-Management-System",
  },
  {
    input: "https://github.com/koushik-2006/Tourist-Management-System.git",
    expectedOwner: "koushik-2006",
    expectedRepo: "Tourist-Management-System",
  },
  {
    input: "https://github.com/koushik-2006/Tourist-Management-System/",
    expectedOwner: "koushik-2006",
    expectedRepo: "Tourist-Management-System",
  },
  {
    input: "http://github.com/koushik-2006/Tourist-Management-System",
    expectedOwner: "koushik-2006",
    expectedRepo: "Tourist-Management-System",
  },
  {
    input: "https://www.github.com/koushik-2006/Tourist-Management-System",
    expectedOwner: "koushik-2006",
    expectedRepo: "Tourist-Management-System",
  },
  {
    input: "github.com/koushik-2006/Tourist-Management-System",
    expectedOwner: "koushik-2006",
    expectedRepo: "Tourist-Management-System",
  },
  {
    input: "git@github.com:koushik-2006/Tourist-Management-System.git",
    expectedOwner: "koushik-2006",
    expectedRepo: "Tourist-Management-System",
  },
  {
    input: "https://github.com/koushik-2006/CodeAtlas-AI-Codebase-Intelligence-Platform.git",
    expectedOwner: "koushik-2006",
    expectedRepo: "CodeAtlas-AI-Codebase-Intelligence-Platform",
  },
  {
    input: "https://github.com/facebook/react/tree/main/packages/react",
    expectedOwner: "facebook",
    expectedRepo: "react",
    expectedBranch: "main",
    expectedPath: "packages/react",
  },
  {
    input: "https://github.com/facebook/react/blob/v18.2.0/README.md",
    expectedOwner: "facebook",
    expectedRepo: "react",
    expectedBranch: "v18.2.0",
    expectedPath: "README.md",
  },
];

let failed = 0;

for (const tc of TEST_CASES) {
  const result = parseGitHubUrl(tc.input);
  if (!result.valid) {
    console.error(`❌ FAILED for "${tc.input}": returned invalid (${result.error})`);
    failed++;
    continue;
  }
  if (result.owner !== tc.expectedOwner) {
    console.error(`❌ FAILED owner for "${tc.input}": got "${result.owner}", expected "${tc.expectedOwner}"`);
    failed++;
    continue;
  }
  if (result.repo !== tc.expectedRepo) {
    console.error(`❌ FAILED repo for "${tc.input}": got "${result.repo}", expected "${tc.expectedRepo}"`);
    failed++;
    continue;
  }
  if (tc.expectedBranch && result.branch !== tc.expectedBranch) {
    console.error(`❌ FAILED branch for "${tc.input}": got "${result.branch}", expected "${tc.expectedBranch}"`);
    failed++;
    continue;
  }
  if (tc.expectedPath && result.path !== tc.expectedPath) {
    console.error(`❌ FAILED path for "${tc.input}": got "${result.path}", expected "${tc.expectedPath}"`);
    failed++;
    continue;
  }
  console.log(`✔ Passed: ${tc.input} -> ${result.fullName} (branch: ${result.branch || "default"})`);
}

// Negative tests
const NEGATIVE_CASES = [
  "https://gitlab.com/owner/repo",
  "https://github.com/",
  "https://github.com/onlyowner",
  "",
  "not a url at all",
];

for (const input of NEGATIVE_CASES) {
  const res = parseGitHubUrl(input);
  if (res.valid) {
    console.error(`❌ NEGATIVE TEST FAILED: "${input}" was accepted but should be rejected`);
    failed++;
  } else {
    console.log(`✔ Correctly rejected invalid input: "${input}" (${res.error})`);
  }
}

if (failed === 0) {
  console.log("\n🎉 All GitHub URL Parser Tests Passed!");
} else {
  console.error(`\n💥 ${failed} tests failed!`);
  process.exit(1);
}

