"use client";

import { useState } from "react";
import { AssistantMessage } from "@/types/assistant";
import { assistantService } from "@/services/assistant-service";

export function useAssistant(repositoryId: string = "my-project") {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "msg-1",
      sender: "user",
      text: "How does login work?",
      timestamp: "10 mins ago",
    },
    {
      id: "msg-2",
      sender: "ai",
      text: "Handled by login(), auth.py lines 6 to 16. Confirmed from source. The session step is inferred.",
      timestamp: "9 mins ago",
      citations: ["src/auth.py:6-16", "tests/test_auth.py:4"],
      confirmedFacts: [
        "Finds user in db via users.find(email)",
        "Verifies password hash using verify_hash()",
        "Issues signed JWT payload with user identifier",
      ],
      inferredFacts: [
        "Session persistence stored in Redis or PostgreSQL session table",
      ],
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputQuestion, setInputQuestion] = useState("");

  const ask = async (questionText?: string) => {
    const q = questionText || inputQuestion;
    if (!q.trim()) return;

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsThinking(true);

    const response = await assistantService.askQuestion({
      repositoryId,
      question: q,
    });

    setMessages((prev) => [...prev, response]);
    setIsThinking(false);
  };

  return {
    messages,
    isThinking,
    inputQuestion,
    setInputQuestion,
    ask,
  };
}
