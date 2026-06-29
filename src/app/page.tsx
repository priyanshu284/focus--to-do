"use client";

import React from "react";
import { AppProvider, useApp } from "../context/AppContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import FloatingCoach from "../components/FloatingCoach";
import FocusWorkspace from "../components/FocusWorkspace";
import LoginView from "../components/LoginView";
import DashboardView from "../components/DashboardView";
import TasksView from "../components/TasksView";
import TimelineView from "../components/TimelineView";
import CoachView from "../components/CoachView";
import AnalyticsView from "../components/AnalyticsView";
import SettingsView from "../components/SettingsView";
import { Sparkles } from "lucide-react";

function MainPageContent() {
  const { user, loading, activeTab, isFocusMode } = useApp();

  // 1. Loading State Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center select-none">
        <div className="relative h-12 w-12 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <span className="text-xs font-bold text-text-main">
          DeadlineOS
        </span>
        <span className="text-[10px] text-text-secondary mt-0.5 font-medium">
          Securing sandbox connection...
        </span>
      </div>
    );
  }

  // 2. Unauthenticated State Screen
  if (!user || activeTab === "login") {
    return <LoginView />;
  }

  // 3. Authenticated Workspace Shell
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header section */}
        <Header />

        {/* Dynamic Route Container */}
        <main className="flex-1 overflow-hidden bg-background flex">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "tasks" && <TasksView />}
          {activeTab === "timeline" && <TimelineView />}
          {activeTab === "coach" && <CoachView />}
          {activeTab === "analytics" && <AnalyticsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Floating Action AI Button */}
      <FloatingCoach />

      {/* Fullscreen Distraction-Free Focus Mode overlay */}
      {isFocusMode && <FocusWorkspace />}
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <MainPageContent />
    </AppProvider>
  );
}
