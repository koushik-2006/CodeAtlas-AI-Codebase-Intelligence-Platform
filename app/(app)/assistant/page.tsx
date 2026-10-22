"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/components/ThemeProvider";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Send,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Code2,
  Terminal,
} from "lucide-react";

interface FileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
}

const FILE_TREE: FileNode[] = [
  {
    name: "src",
    type: "folder",
    path: "src",
    children: [
      {
        name: "api",
        type: "folder",
        path: "src/api",
        children: [
          {
            name: "routes.py",
            type: "file",
            path: "src/api/routes.py",
            language: "python",
            content: `# API Route Handler for Authentication
from fastapi import APIRouter, Depends, HTTPException
from src.auth import login, verify_token

router = APIRouter(prefix="/auth")

@router.post("/login")
async def handle_login(payload: LoginRequest):
    """Invokes core authorization and returns signed JWT."""
    token = login(payload.email, payload.password)
    return {"access_token": token, "type": "bearer"}
`,
          },
        ],
      },
      {
        name: "auth.py",
        type: "file",
        path: "src/auth.py",
        language: "python",
        content: `from db import users
from src.services.UserService import UserService
from src.crypto import verify_hash, issue_jwt

# Confirmed authentication gateway logic
def login(email: str, pw: str):
    user = users.find(email)
    if not user:
        raise AuthError("Invalid user credentials")
    
    if not verify_hash(pw, user.password_hash):
        raise AuthError("Password verification failed")
        
    session = UserService.create_session(user.id)
    return issue_jwt(user, session)

def verify(user, pw):
    return verify_hash(pw, user.password_hash)
`,
      },
      {
        name: "models",
        type: "folder",
        path: "src/models",
        children: [
          {
            name: "user.py",
            type: "file",
            path: "src/models/user.py",
            language: "python",
            content: `class User:
    def __init__(self, id: str, email: str, password_hash: str):
        self.id = id
        self.email = email
        self.password_hash = password_hash
`,
          },
        ],
      },
      {
        name: "services",
        type: "folder",
        path: "src/services",
        children: [
          {
            name: "UserService.ts",
            type: "file",
            path: "src/services/UserService.ts",
            language: "typescript",
            content: `export class UserService {
  static async createSession(userId: string): Promise<Session> {
    const sessionToken = crypto.randomUUID();
    await db.query("INSERT INTO sessions (user_id, token) VALUES (?, ?)", [userId, sessionToken]);
    return { token: sessionToken, createdAt: Date.now() };
  }
}
`,
          },
        ],
      },
      {
        name: "LoginForm.tsx",
        type: "file",
        path: "src/LoginForm.tsx",
        language: "typescript",
        content: `import React, { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
`,
      },
    ],
  },
  {
    name: "tests",
    type: "folder",
    path: "tests",
    children: [
      {
        name: "test_auth.py",
        type: "file",
        path: "tests/test_auth.py",
        language: "python",
        content: `import pytest
from src.auth import login

def test_login_ok():
    token = login("alice@codeatlas.dev", "correct-horse-battery")
    assert token is not None

def test_login_invalid_password():
    with pytest.raises(Exception):
        login("alice@codeatlas.dev", "wrong-password")
`,
      },
    ],
  },
];

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  citations?: string[];
  confirmedFacts?: string[];
  inferredFacts?: string[];
}

export default function AssistantPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // File tree state
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    src: true,
    "src/api": true,
    tests: true,
  });
  const [selectedFilePath, setSelectedFilePath] = useState("src/auth.py");
  const [highlightedLines, setHighlightedLines] = useState<[number, number] | null>([6, 15]);

  // Code content
  const activeFile = (() => {
    const findFile = (nodes: FileNode[]): FileNode | null => {
      for (const n of nodes) {
        if (n.path === selectedFilePath) return n;
        if (n.children) {
          const found = findFile(n.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findFile(FILE_TREE) || FILE_TREE[0].children![1];
  })();

  // AI Chat state matching Reference 2 Page 4
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "user",
      text: "How does login work?",
    },
    {
      sender: "ai",
      text: "Handled by login(), auth.py lines 6 to 16. Confirmed from source. The session step is inferred.",
      citations: ["auth.py:6-16", "test_auth.py:4"],
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

  const [inputQuestion, setInputQuestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleAskQuestion = (q?: string) => {
    const questionText = q || inputQuestion;
    if (!questionText.trim()) return;

    const userMsg: ChatMessage = { sender: "user", text: questionText };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsThinking(true);

    setTimeout(() => {
      let aiResponse: ChatMessage;
      if (questionText.toLowerCase().includes("test")) {
        aiResponse = {
          sender: "ai",
          text: "Login is covered by test_login_ok() and test_login_invalid_password() in test_auth.py.",
          citations: ["test_auth.py:4-9"],
          confirmedFacts: ["Tests assert token issuance and exception handling on mismatch."],
        };
        setSelectedFilePath("tests/test_auth.py");
        setHighlightedLines([4, 9]);
      } else if (questionText.toLowerCase().includes("session") || questionText.toLowerCase().includes("user")) {
        aiResponse = {
          sender: "ai",
          text: "UserService.createSession creates a UUID session token and commits it to the database.",
          citations: ["src/services/UserService.ts:2-5"],
          confirmedFacts: ["Session commits user_id and token."],
        };
        setSelectedFilePath("src/services/UserService.ts");
        setHighlightedLines([2, 5]);
      } else {
        aiResponse = {
          sender: "ai",
          text: `Analysis for "${questionText}": Sourced through auth.py and routes.py. All calls ground in static AST references.`,
          citations: ["src/auth.py:6-16"],
          confirmedFacts: ["Verified through AST symbol resolver."],
          inferredFacts: ["Underlying database engine connection pooled at boot."],
        };
        setSelectedFilePath("src/auth.py");
        setHighlightedLines([6, 16]);
      }

      setMessages((prev) => [...prev, aiResponse]);
      setIsThinking(false);
    }, 800);
  };

  const renderFileTree = (nodes: FileNode[]) => {
    return (
      <ul className="space-y-0.5">
        {nodes.map((node) => {
          if (node.type === "folder") {
            const isOpen = !!openFolders[node.path];
            return (
              <li key={node.path}>
                <button
                  onClick={() => toggleFolder(node.path)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  {isOpen ? (
                    <FolderOpen className="w-3.5 h-3.5 text-[var(--primary)]" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  )}
                  <span>{node.name}</span>
                </button>
                {isOpen && node.children && (
                  <div className="pl-4 border-l border-[var(--border-color)]/60 ml-3 mt-0.5">
                    {renderFileTree(node.children)}
                  </div>
                )}
              </li>
            );
          }

          const isSelected = selectedFilePath === node.path;
          return (
            <li key={node.path}>
              <button
                onClick={() => {
                  setSelectedFilePath(node.path);
                  setHighlightedLines(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? isDark
                      ? "bg-[#111725] text-[#29D3C2] font-bold border border-[#242B39]"
                      : "bg-[#EAE5FF] text-[#6C4DFF] font-bold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20"
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{node.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  const codeLines = (activeFile.content || "").split("\n");

  return (
    <div>
      <PageHeader
        title={`my-project / ${activeFile.name}`}
        sub="Repository explorer & AI assistant with verified source citations"
      />

      {/* 3-Panel Desktop Layout */}
      <div className="grid gap-4 lg:grid-cols-12 min-h-[640px]">
        {/* Panel 1: File Tree (3 cols) */}
        <div
          className={`lg:col-span-3 rounded-2xl border p-4 flex flex-col justify-between ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Files & Modules
              </span>
              <span className="text-[10px] font-mono text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                6 indexed
              </span>
            </div>

            {renderFileTree(FILE_TREE)}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--border-color)] text-[11px] text-[var(--text-secondary)]">
            <span className="font-semibold">Branch:</span> <code className="font-mono">main</code> · 1,248 LOC
          </div>
        </div>

        {/* Panel 2: Source Code Viewer (5 cols) */}
        <div
          className={`lg:col-span-5 rounded-2xl border flex flex-col overflow-hidden ${
            isDark ? "bg-[#0A0F19] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          {/* Code Viewer Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[var(--primary)]" />
              <span className="font-mono text-xs font-bold">{activeFile.path}</span>
            </div>
            <span className="font-mono text-[10px] uppercase text-[var(--text-secondary)] bg-[var(--border-color)]/40 px-2 py-0.5 rounded">
              {activeFile.language || "code"}
            </span>
          </div>

          {/* Code Lines with Line Numbers */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-6">
            <table className="w-full border-collapse">
              <tbody>
                {codeLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isHighlighted =
                    highlightedLines &&
                    lineNum >= highlightedLines[0] &&
                    lineNum <= highlightedLines[1];

                  return (
                    <tr
                      key={lineNum}
                      className={`transition-colors ${
                        isHighlighted
                          ? isDark
                            ? "bg-[#29D3C2]/15 text-[#F3F5FA]"
                            : "bg-[#EAE5FF] text-[#19143D]"
                          : "hover:bg-[var(--border-color)]/10"
                      }`}
                    >
                      <td className="w-8 select-none pr-3 text-right text-[11px] text-[var(--text-secondary)]/50 font-mono">
                        {lineNum}
                      </td>
                      <td className="whitespace-pre pl-2">
                        {line}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 3: AI Assistant (4 cols) */}
        <div
          className={`lg:col-span-4 rounded-2xl border flex flex-col justify-between overflow-hidden ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <span>ASK CODEATLAS</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
              AI with receipts
            </span>
          </div>

          {/* Conversation History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[440px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-2xl p-3.5 text-xs ${
                  msg.sender === "user"
                    ? isDark
                      ? "bg-[#111725] text-[#F3F5FA] border border-[#242B39] ml-6"
                      : "bg-[#EAE5FF] text-[#19143D] font-medium ml-6"
                    : isDark
                    ? "bg-[#0A0F19] text-[#F3F5FA] border border-[#242B39] mr-2"
                    : "bg-[#FAF9FF] text-[#19143D] border border-[#E8E5F4] mr-2"
                }`}
              >
                <div className="font-semibold mb-1 flex items-center justify-between">
                  <span>{msg.sender === "user" ? "You" : "CodeAtlas Engine"}</span>
                  {msg.sender === "ai" && (
                    <span className="text-[9px] font-mono text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded">
                      Grounded
                    </span>
                  )}
                </div>
                <p className="leading-relaxed">{msg.text}</p>

                {/* Sourced Citations */}
                {msg.citations && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--border-color)]/60">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] block mb-1">
                      CITATIONS BESIDE ANSWER:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cite) => (
                        <button
                          key={cite}
                          onClick={() => {
                            if (cite.includes("test_auth.py")) {
                              setSelectedFilePath("tests/test_auth.py");
                              setHighlightedLines([4, 9]);
                            } else {
                              setSelectedFilePath("src/auth.py");
                              setHighlightedLines([6, 16]);
                            }
                          }}
                          className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded transition-transform hover:scale-105 ${
                            isDark
                              ? "bg-[#29D3C2]/15 text-[#29D3C2] hover:bg-[#29D3C2]/25"
                              : "bg-[#6C4DFF]/10 text-[#6C4DFF] hover:bg-[#6C4DFF]/20"
                          }`}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {cite}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed vs Inferred Breakdown */}
                {msg.confirmedFacts && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-[#2FD6A0] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Confirmed Facts:
                    </span>
                    <ul className="list-disc pl-4 text-[10px] text-[var(--text-secondary)] space-y-0.5">
                      {msg.confirmedFacts.map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {msg.inferredFacts && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-[#F3C969] flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> Inferred Architecture:
                    </span>
                    <ul className="list-disc pl-4 text-[10px] text-[var(--text-secondary)] space-y-0.5">
                      {msg.inferredFacts.map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="rounded-2xl p-3 text-xs bg-[var(--bg-page)] flex items-center gap-2 text-[var(--text-secondary)]">
                <div className="h-3.5 w-3.5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <span>Tracing call graph and indexing receipts...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts & Question Input */}
          <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {[
                "How does login work?",
                "Which tests cover auth?",
                "How is session created?",
              ].map((qp) => (
                <button
                  key={qp}
                  onClick={() => handleAskQuestion(qp)}
                  className="text-[10px] font-medium py-1 px-2 rounded-lg border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                >
                  {qp}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Ask about this repository..."
                className={`w-full pl-3 pr-10 py-2.5 rounded-xl text-xs outline-none border transition-all ${
                  isDark
                    ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                    : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
                }`}
              />
              <button
                type="submit"
                disabled={!inputQuestion.trim()}
                className={`absolute right-1.5 p-1.5 rounded-lg text-white transition-all disabled:opacity-40 ${
                  isDark ? "bg-[#29D3C2] text-[#070A12]" : "bg-[#6C4DFF]"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
