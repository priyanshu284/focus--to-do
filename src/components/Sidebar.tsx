"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  GitCommit,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const { activeTab, navigateTo, tasks, signOut, user } = useApp();

  const pendingCount = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "Tasks", icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: "timeline", label: "Timeline", icon: GitCommit },
    { id: "coach", label: "AI Coach", icon: Sparkles },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  if (!user) return null;

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm font-semibold">
            D
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-text-main flex items-center gap-1.5">
              DeadlineOS
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                AI
              </span>
            </h1>
            <p className="text-[10px] text-text-secondary font-medium tracking-wide leading-none mt-0.5">
              Execution Partner
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group duration-150 ${
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/10"
                  : "text-text-secondary hover:text-text-main hover:bg-background"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-white" : "text-text-secondary group-hover:text-text-main"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Suggestion Card Widget */}
      {pendingCount > 0 && (
        <div className="px-4 mb-4">
          <div className="p-4 rounded-xl bg-background border border-border flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-primary/5 blur-xl group-hover:scale-150 transition-all duration-300" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              <span>CoachOS Recommendation</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">
              Running tight on schedule? Ask the Coach to optimize your workslots.
            </p>
            <button
              onClick={() => navigateTo("coach")}
              className="mt-2 text-[11px] font-bold text-text-main hover:text-primary flex items-center gap-1 transition-colors self-start"
            >
              <span>What should I do next?</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* User Footer block */}
      <div className="p-4 border-t border-border bg-background/50">
        <div className="flex items-center gap-3 px-2 py-1">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="h-9 w-9 rounded-full object-cover border border-border" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm uppercase">
              {user.displayName ? user.displayName[0] : user.email[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-main truncate">
              {user.displayName || "Active User"}
            </p>
            <p className="text-[10px] text-text-secondary truncate">
              {user.email}
            </p>
          </div>
          <button
            onClick={signOut}
            title="Log Out"
            className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
