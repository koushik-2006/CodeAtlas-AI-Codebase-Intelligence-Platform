"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useWorkspaces, WorkspaceItem } from "@/hooks/useWorkspaces";
import {
  Users,
  User,
  ChevronDown,
  Plus,
  Check,
  Building2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Eye,
} from "lucide-react";
import CreateWorkspaceModal from "./CreateWorkspaceModal";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export default function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const { workspaces, activeWorkspace, setActiveWorkspaceId, loading, refreshWorkspaces } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "owner":
        return (
          <span title="Workspace Owner">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
          </span>
        );
      case "admin":
        return (
          <span title="Workspace Admin">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </span>
        );
      case "member":
        return (
          <span title="Workspace Member">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          </span>
        );
      default:
        return (
          <span title="Viewer (Read-only)">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
          </span>
        );
    }
  };

  const teamWorkspaces = workspaces.filter((w) => !w.isPersonal);
  const personalWorkspaces = workspaces.filter((w) => w.isPersonal);

  if (loading && !activeWorkspace) {
    return (
      <div className={`p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]/40 animate-pulse ${collapsed ? "w-10 h-10" : "w-full h-12"}`} />
    );
  }

  return (
    <div className="relative mb-3" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]/70 hover:bg-[var(--bg-surface)] hover:border-[var(--primary)]/40 p-2 text-left transition-all ${
          collapsed ? "justify-center p-2" : "px-3 py-2.5"
        }`}
        title={activeWorkspace?.name || "Select Workspace"}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-purple-600/30 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--primary)] font-medium text-xs">
            {activeWorkspace?.isPersonal ? (
              <User className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-[var(--primary)]" />
            )}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                  {activeWorkspace?.name || "Select Workspace"}
                </span>
                {getRoleIcon(activeWorkspace?.userRole)}
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] truncate">
                {activeWorkspace?.isPersonal
                  ? "Personal Workspace"
                  : `${activeWorkspace?.memberCount || 1} members · ${activeWorkspace?.repoCount || 0} repos`}
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <ChevronDown
            className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/95 backdrop-blur-md shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-2.5 py-1.5 border-b border-[var(--border-color)]/60 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Switch Workspace
            </span>
            <Link
              href="/workspaces"
              onClick={() => setOpen(false)}
              className="text-[10px] text-[var(--primary)] hover:underline flex items-center gap-0.5"
            >
              All Workspaces
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>

          {/* Team Workspaces */}
          {teamWorkspaces.length > 0 && (
            <div className="mb-1">
              <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-[var(--text-secondary)]/80 block">
                Team Workspaces
              </span>
              <div className="space-y-0.5">
                {teamWorkspaces.map((ws) => {
                  const isSelected = ws.id === activeWorkspace?.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isSelected
                          ? "bg-[var(--primary)]/15 text-[var(--primary)] font-medium"
                          : "text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-[var(--primary)] flex-shrink-0" />
                        <span className="truncate">{ws.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] px-1.5 py-0.2 rounded border border-[var(--border-color)] text-[var(--text-secondary)] capitalize">
                          {ws.userRole}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Personal Workspaces */}
          {personalWorkspaces.length > 0 && (
            <div className="mb-1">
              <span className="px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-[var(--text-secondary)]/80 block">
                Personal
              </span>
              <div className="space-y-0.5">
                {personalWorkspaces.map((ws) => {
                  const isSelected = ws.id === activeWorkspace?.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isSelected
                          ? "bg-[var(--primary)]/15 text-[var(--primary)] font-medium"
                          : "text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--primary)]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-1.5 mt-1 border-t border-[var(--border-color)]/60">
            <button
              onClick={() => {
                setOpen(false);
                setCreateModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Team Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {createModalOpen && (
        <CreateWorkspaceModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            refreshWorkspaces();
          }}
        />
      )}
    </div>
  );
}
