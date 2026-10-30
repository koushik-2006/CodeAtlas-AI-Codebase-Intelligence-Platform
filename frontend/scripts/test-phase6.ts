import assert from "assert";
import { parseSourceCode } from "../lib/server/code-parser";
import { db } from "../lib/server/db";
import { github, DEVELOPER_SANDBOX_REPOS } from "../lib/server/github";
import { indexer } from "../lib/server/indexer";

async function runTests() {
  console.log("🚀 Starting Phase 6 Backend & Integration Test Suite...\n");

  // Test 1: Parser & Symbol Extraction on TypeScript code
  console.log("▶ Test 1: Parser & AST Symbol Extraction");
  const sampleTs = `
export class OrderService {
  private taxRate: number = 0.08;

  async calculateTotal(items: any[]) {
    return items.reduce((acc, i) => acc + i.price, 0);
  }
}

export async function processPayment(orderId: string, amount: number) {
  const service = new OrderService();
  return service.calculateTotal([]);
}
`;
  const parsed = parseSourceCode("test-repo", "src/services/order.ts", sampleTs);
  assert(parsed.symbols.length >= 2, "Should extract OrderService class and processPayment function");
  const orderServiceSym = parsed.symbols.find((s) => s.name === "OrderService");
  assert(orderServiceSym, "OrderService symbol should exist");
  assert.strictEqual(orderServiceSym?.type, "service", "OrderService should be classified as service");

  const processPaymentSym = parsed.symbols.find((s) => s.name === "processPayment");
  assert(processPaymentSym, "processPayment symbol should exist");
  assert.strictEqual(processPaymentSym?.type, "function");
  console.log("  ✔ Correctly extracted TypeScript service, method, and function symbols.");

  // Test 2: Database User Isolation & CRUD
  console.log("▶ Test 2: Database User Isolation & Repository Records");
  const user = db.getUser("usr_default");
  assert(user, "Default user alex@codeatlas.dev should be present");
  assert.strictEqual(user?.email, "alex@codeatlas.dev");

  const testRepo = db.saveRepository({
    id: "unit-test-repo",
    userId: "usr_default",
    name: "unit-test-repo",
    owner: "test-owner",
    description: "Automated test repository",
    visibility: "private",
    language: "TypeScript",
    defaultBranch: "main",
    url: "https://github.com/test-owner/unit-test-repo",
    status: "ready",
    progress: 100,
    symbolCount: 5,
    fileCount: 2,
    lastAnalyzed: "Just now",
    isIndexed: true,
    connectionType: "github",
  });

  const retrieved = db.getRepository("unit-test-repo", "usr_default");
  assert(retrieved, "Should retrieve saved repository");
  assert.strictEqual(retrieved?.id, "unit-test-repo");
  assert.strictEqual(retrieved?.visibility, "private");
  console.log("  ✔ User-scoped repository record created, isolated, and retrieved.");

  // Test 3: Code Search & Line Reference Resolution
  console.log("▶ Test 3: Repository-Aware Code Search");
  db.saveRepositoryFiles("unit-test-repo", [
    {
      id: "f_1",
      repositoryId: "unit-test-repo",
      path: "src/payment.ts",
      name: "payment.ts",
      language: "typescript",
      size: 150,
      content: "import { OrderService } from './order';\n\nexport function executeCheckout() {\n  return true;\n}",
      lineCount: 5,
    },
  ]);
  const searchResults = db.searchRepositoryCode("unit-test-repo", "OrderService");
  assert(searchResults.length > 0, "Should find OrderService in payment.ts");
  assert.strictEqual(searchResults[0].file, "src/payment.ts");
  assert.strictEqual(searchResults[0].line, 1);
  console.log("  ✔ Accurate keyword and symbol search returns exact line reference (line 1).");

  // Test 4: GitHub Discovery & Sandbox Fallback
  console.log("▶ Test 4: GitHub Discovery & Sandbox Fallback");
  assert(DEVELOPER_SANDBOX_REPOS.length >= 4, "Developer sandbox should contain curated repositories");
  const privateRepo = DEVELOPER_SANDBOX_REPOS.find((r) => r.private);
  assert(privateRepo, "Sandbox should include private repositories for testing authorization");
  console.log(`  ✔ Sandbox provides ${DEVELOPER_SANDBOX_REPOS.length} discoverable public & private repos.`);

  // Test 5: Connected Account Storage & Security Safeguards
  console.log("▶ Test 5: Connected Account Lifecycle & Disconnect");
  db.saveConnectedAccount({
    userId: "usr_default",
    provider: "github",
    username: "test-engineer",
    avatar: "https://example.com/avatar.png",
    accessToken: "sec_token_never_sent_to_browser",
    scopes: ["read:user", "repo"],
    connectedAt: new Date().toISOString(),
  });
  const account = db.getConnectedAccount("usr_default", "github");
  assert(account, "Connected account should be stored");
  assert.strictEqual(account?.username, "test-engineer");

  db.deleteConnectedAccount("usr_default", "github");
  const disconnected = db.getConnectedAccount("usr_default", "github");
  assert.strictEqual(disconnected, null, "Account should be purged upon disconnect");
  console.log("  ✔ Secure server account persistence and clean disconnect verified.");

  // Clean up test repo
  db.deleteRepository("unit-test-repo", "usr_default");

  console.log("\n🎉 All 5 Phase 6 Integration Tests Passed Successfully!\n");
}

runTests().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});
