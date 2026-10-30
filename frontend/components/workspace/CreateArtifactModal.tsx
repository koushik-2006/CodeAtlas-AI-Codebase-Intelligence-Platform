"use client";

import { useState } from "react";
import { X, FileText, Loader2, AlertCircle, Share2, Sparkles } from "lucide-react";
import { SharedArtifactType } from "@/types/workspace";
import { apiClient } from "@/services/api-client";

interface CreateArtifactModalProps {
  isOpen: boolean;
  workspaceId: string;
  repositories: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: (artifact: any) => void;
}

const ARTIFACT_TYPES: { type: SharedArtifactType; label: string; desc: string }[] = [
  { type: "architecture_snapshot", label: "Architecture Snapshot", desc: "System component map & dependencies" },
  { type: "knowledge_report", label: "Knowledge Report", desc: "Detailed analysis of repository domain" },
  { type: "workflow_trace", label: "Workflow Trace", desc: "Execution sequence across services & APIs" },
  { type: "change_impact", label: "Change Impact Report", desc: "Blast radius analysis for modifications" },
  { type: "code_explanation", label: "Code Explanation", desc: "Deep dive on tricky symbols or logic" },
  { type: "onboarding_guide", label: "Onboarding Guide", desc: "Guided path for new developers" },
];

export default function CreateArtifactModal({
  isOpen,
  workspaceId,
  repositories,
  onClose,
  onSuccess,
}: CreateArtifactModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<SharedArtifactType>("architecture_snapshot");
  const [repositoryId, setRepositoryId] = useState(repositories[0]?.id || "sample-project");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"workspace" | "private">("workspace");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please provide both a title and artifact content");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.post<any>(`/api/workspaces/${workspaceId}/artifacts`, {
        title: title.trim(),
        description: description.trim(),
        type,
        repositoryId: repositoryId || undefined,
        content: content.trim(),
        visibility,
      });

      const json = res.data || {};
      if (!res.success) {
        throw new Error(json.error || res.message || "Failed to create artifact");
      }

      onSuccess(json.data || json);
    } catch (err: any) {
      console.error("Create artifact error:", err);
      setError(err.message || "Failed to create artifact");
    } finally {
      setLoading(false);
    }
  };

  const insertTemplate = () => {
    switch (type) {
      case "architecture_snapshot":
        setContent(`### Architecture Overview\n\n- **Target Flow**: Client -> Auth Gateway -> User Service\n- **Primary Invariant**: Tokens signed with RS256; 15 min TTL.\n- **Storage**: In-memory cache + persistent relational store.\n\n### Critical Path Nodes\n1. \`LoginForm.tsx\` - User input submission\n2. \`services/auth.ts\` - Credential verification & token generation\n3. \`tests/auth.test.ts\` - Automated security validation suite`);
        break;
      case "change_impact":
        setContent(`### Change Impact Assessment\n\n- **Target Symbol**: \`validateEmail\` in \`src/utils/validation.ts\`\n- **Direct Callers**: \`LoginForm.tsx\`, \`registration.ts\`\n- **API Endpoints Affected**: \`POST /api/auth/login\`, \`POST /api/auth/signup\`\n- **Risk Level**: Medium (Auth pipeline boundary)\n- **Recommended Test Actions**: Run auth unit tests and inspect error notification state.`);
        break;
      case "onboarding_guide":
        setContent(`### Team Onboarding Guide\n\nWelcome to the repository! Here is your quickstart guide:\n\n1. **Core Components**: Explore \`src/components/\` to view UI elements.\n2. **Business Logic**: Review \`src/services/auth.ts\` for login & token flows.\n3. **Running Checks**: Execute \`npm run test\` to ensure regression coverage.`);
        break;
      default:
        setContent(`### ${title || "Shared Codebase Report"}\n\n- **Summary**: Key architectural findings and documentation for the team.\n- **Key Decisions**: Document why specific patterns were chosen.\n- **Action Items**: Next steps for team alignment.`);
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Create Shared Knowledge Artifact</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Persist architecture blueprints, impact analyses, or onboarding guides for your team.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Artifact Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Auth Architecture Snapshot"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Associated Repository
              </label>
              <select
                value={repositoryId}
                onChange={(e) => setRepositoryId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                disabled={loading}
              >
                {repositories.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Artifact Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ARTIFACT_TYPES.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setType(item.type)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    type === item.type
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-primary)]"
                      : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-color)]/80"
                  }`}
                >
                  <p className="text-xs font-semibold truncate mb-0.5">{item.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Documenting credential verification and session tokens"
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                Markdown Content *
              </label>
              <button
                type="button"
                onClick={insertTemplate}
                className="text-[11px] text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Insert Template</span>
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write Markdown or paste architecture summary..."
              rows={8}
              className="w-full font-mono rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-y"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-secondary)]">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === "workspace"}
                  onChange={() => setVisibility("workspace")}
                  className="text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span>Workspace Shared</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-secondary)]">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span>Private (Only Me)</span>
              </label>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !content.trim()}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-medium transition-all shadow-md shadow-[var(--primary)]/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Artifact</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
