"use client";

import { useState } from "react";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { QuickActionCards } from "@/components/dashboard/QuickActionCards";
import { RepositoryOverview } from "@/components/dashboard/RepositoryOverview";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { AddRepositoryDialog } from "@/components/repositories/AddRepositoryDialog";
import { useRepositories } from "@/hooks/useRepositories";

export default function DashboardPage() {
  const [isAddRepoOpen, setIsAddRepoOpen] = useState(false);
  const { repositories, addRepository } = useRepositories();
  const activeRepoId = repositories[0]?.id || "sample-project";

  const handleAddRepo = async (name: string, url: string, method: "github" | "zip" | "url" | "sample") => {
    await addRepository({
      name,
      owner: "you",
      description: url || "Connected repository AST symbol analysis in progress.",
      visibility: "private",
      language: method === "sample" && name.includes("python") ? "Python" : "TypeScript",
      symbolCount: 18,
      connectionType: method === "url" ? "git_url" : method === "zip" ? "zip" : "github",
    });
  };

  return (
    <div className="space-y-8">
      {/* 1. Welcome Section */}
      <WelcomeSection onAddRepository={() => setIsAddRepoOpen(true)} />

      {/* 2. Quick Action Cards (6 functional workflows) */}
      <QuickActionCards
        onConnectGitHub={() => setIsAddRepoOpen(true)}
        activeRepoId={activeRepoId}
      />

      {/* 3. Two-Column Workspace: Your Repositories & Getting Started Checklist */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <RepositoryOverview onAddRepository={() => setIsAddRepoOpen(true)} />
        <GettingStartedChecklist />
      </div>

      {/* 4. Recent Activity Panel */}
      <RecentActivityPanel />

      {/* Add Repository Modal */}
      <AddRepositoryDialog
        isOpen={isAddRepoOpen}
        onClose={() => setIsAddRepoOpen(false)}
        onAdd={handleAddRepo}
      />
    </div>
  );
}
