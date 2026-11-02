import assert from "assert";
import { ragService } from "../lib/server/rag-service";

async function main() {
  console.log("=== Testing Assistant ChatGPT-Style Behaviors ===");

  // 1. Casual Greeting "hi"
  console.log("\n1. Testing greeting 'hi':");
  const greetingRes = await ragService.answerQuestion({
    repositoryId: "sample-project",
    question: "hi",
  });
  console.log("Answer snippet:", greetingRes.answer.slice(0, 120));
  console.log("Sources count:", greetingRes.sources.length);
  assert.strictEqual(greetingRes.sources.length, 0, "Greetings must NOT return source receipts or file dumps");
  assert(
    greetingRes.answer.toLowerCase().includes("hello") ||
    greetingRes.answer.toLowerCase().includes("help") ||
    greetingRes.answer.toLowerCase().includes("codeatlas"),
    "Greeting must be natural, welcoming, and helpful"
  );
  assert(!greetingRes.answer.includes("README.md (lines 1-9)"), "Must NOT dump README.md on 'hi'");
  assert(!greetingRes.answer.includes("LoginForm.tsx"), "Must NOT dump LoginForm.tsx on 'hi'");

  // 2. Question "what can you do?"
  console.log("\n2. Testing introductory question 'what can you do?':");
  const introRes = await ragService.answerQuestion({
    repositoryId: "sample-project",
    question: "what can you do?",
  });
  console.log("Intro answer snippet:", introRes.answer.slice(0, 120));
  assert.strictEqual(introRes.sources.length, 0, "Introductory inquiries must NOT return source receipts");

  // 3. Codebase-grounded question "Where is authentication configured?"
  console.log("\n3. Testing codebase question 'Where is authentication configured?':");
  const codeRes = await ragService.answerQuestion({
    repositoryId: "sample-project",
    question: "Where is authentication configured in this project?",
  });
  console.log("Code answer snippet:", codeRes.answer.slice(0, 120));
  console.log("Sources count:", codeRes.sources.length);
  assert(codeRes.sources.length > 0, "Codebase questions must return verified citations");
  assert(
    codeRes.sources.some((s) => s.file.includes("auth") || s.file.includes("LoginForm")),
    "Citations must point to actual codebase auth files"
  );

  // 4. Multi-turn conversation history
  console.log("\n4. Testing multi-turn conversational context:");
  const followUpRes = await ragService.answerQuestion({
    repositoryId: "sample-project",
    question: "Can you summarize that in 2 bullet points?",
    conversationHistory: [
      { sender: "user", text: "Where is authentication configured in this project?" },
      { sender: "ai", text: "Authentication is handled in src/services/auth.ts at loginUser and src/components/LoginForm.tsx." },
    ],
  });
  console.log("Follow-up snippet:", followUpRes.answer.slice(0, 120));
  assert(followUpRes.answer.length > 0, "Follow-up response must be generated");

  console.log("\n All Assistant ChatGPT-style tests passed successfully!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

