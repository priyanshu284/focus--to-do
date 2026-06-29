"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Task } from "../lib/types";
import AddTaskModal from "./AddTaskModal";
import {
  Plus,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  Play,
  Trash2,
  Bookmark,
  ChevronRight,
  CheckCircle2,
  HelpCircle
} from "lucide-react";

export default function TasksView() {
  const { tasks, toggleSubtaskStatus, deleteTaskById, startFocusSession, navigateTo } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [modalOpen, setModalOpen] = useState(false);

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return t.status === "pending" || t.status === "in_progress";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || null;

  // Render priority colors
  const getPriorityBadge = (p: Task["priority"]) => {
    switch (p) {
      case "urgent":
        return "bg-danger/10 text-danger border-danger/25";
      case "high":
        return "bg-warning/10 text-warning border-warning/25";
      case "medium":
        return "bg-primary/10 text-primary border-primary/25";
      case "low":
        default:
          return "bg-success/10 text-success border-success/25";
    }
  };

  const getRiskColor = (risk: Task["completionRisk"]) => {
    switch (risk) {
      case "high":
        return "text-danger";
      case "medium":
        return "text-warning";
      case "low":
      default:
        return "text-success";
    }
  };

  const handleAskAICoach = (taskTitle: string) => {
    navigateTo("coach");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("deadlineos_coach_trigger", `Break "${taskTitle}" into smaller steps.`);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden select-none">
      {/* Left Pane: Filter and List */}
      <div className="flex-1 flex flex-col h-full border-r border-border bg-card">
        {/* Toolbar */}
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            {(["all", "pending", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-text-main hover:bg-background"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-primary/20 mx-auto mb-3" />
              <p className="text-xs font-bold text-text-secondary">No tasks found</p>
              <p className="text-[10px] text-text-secondary/70 mt-0.5">Add a new task to get started.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const completedSubCount = task.suggestedBreakdown.filter((st) => st.status === "completed").length;
              const totalSubCount = task.suggestedBreakdown.length;
              const subProgress = totalSubCount > 0 ? Math.round((completedSubCount / totalSubCount) * 100) : 0;
              const isSelected = selectedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-4 flex justify-between items-start gap-4 hover:bg-background/40 transition-colors cursor-pointer border-l-2 ${
                    isSelected ? "border-l-primary bg-background/50" : "border-l-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border capitalize ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-text-secondary font-semibold">
                        {task.category}
                      </span>
                    </div>

                    <h4 className={`text-xs font-bold text-text-main truncate mt-2 ${task.status === "completed" ? "line-through opacity-50" : ""}`}>
                      {task.title}
                    </h4>
                    
                    {/* Time metrics */}
                    <div className="flex gap-4 text-[10px] text-text-secondary mt-1.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Due {new Date(task.deadline).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {task.estimatedTime}h
                      </span>
                    </div>
                  </div>

                  {/* AI priority score badge & status indicators */}
                  <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-extrabold text-text-main">{task.priorityScore}</span>
                    </div>
                    {totalSubCount > 0 && (
                      <span className="text-[9px] font-semibold text-text-secondary">
                        {completedSubCount}/{totalSubCount} subtasks ({subProgress}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Inspector Details */}
      <div className="w-96 shrink-0 bg-background/50 flex flex-col h-full border-l border-border max-lg:hidden">
        {activeTask ? (
          <div className="flex-col flex h-full overflow-y-auto p-6 space-y-6">
            {/* Header Title */}
            <div>
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-sm font-bold text-text-main leading-snug">
                  {activeTask.title}
                </h3>
                <button
                  onClick={() => {
                    deleteTaskById(activeTask.id);
                    setSelectedTaskId(null);
                  }}
                  className="p-1.5 rounded-lg border border-border text-text-secondary hover:text-danger hover:bg-danger/10 hover:border-danger/25 transition-all cursor-pointer shrink-0"
                  title="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[10px] text-text-secondary mt-1">
                Created on {new Date(activeTask.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Description */}
            {activeTask.description && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Description
                </span>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  {activeTask.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {activeTask.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activeTask.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-background border border-border text-[9px] font-semibold text-text-secondary"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* AI Diagnostics details */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>CoachOS Diagnostics</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-background border border-border/60">
                  <span className="text-[9px] text-text-secondary font-bold uppercase block leading-none">
                    Risk Level
                  </span>
                  <span className={`font-extrabold capitalize mt-1.5 inline-flex items-center gap-1 ${getRiskColor(activeTask.completionRisk)}`}>
                    <AlertTriangle className="h-3 w-3" />
                    {activeTask.completionRisk}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-background border border-border/60">
                  <span className="text-[9px] text-text-secondary font-bold uppercase block leading-none">
                    Ideal Slot
                  </span>
                  <span className="font-bold text-text-main mt-1.5 block truncate" title={activeTask.suggestedSlot}>
                    {activeTask.suggestedSlot.split(" ")[0]}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-text-secondary leading-relaxed font-semibold">
                {activeTask.riskExplanation}
              </p>
            </div>

            {/* Action controls */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => startFocusSession(activeTask)}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-primary/10 transition-colors cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                Start Focus Session
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAskAICoach(activeTask.title)}
                  className="py-2 rounded-xl border border-border bg-card hover:bg-background text-text-main text-xs font-bold transition-all cursor-pointer"
                >
                  Break steps
                </button>
                <button
                  onClick={() => {
                    navigateTo("coach");
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("deadlineos_coach_trigger", `I cannot finish "${activeTask.title}" today.`);
                    }
                  }}
                  className="py-2 rounded-xl border border-border bg-card hover:bg-background text-text-main text-xs font-bold transition-all cursor-pointer"
                >
                  Reschedule
                </button>
              </div>
            </div>

            {/* Subtasks Checklist */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Checklist Breakdown
              </span>
              
              <div className="space-y-2">
                {activeTask.suggestedBreakdown.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => toggleSubtaskStatus(activeTask.id, st.id)}
                    className="w-full text-left p-2.5 rounded-lg bg-card border border-border hover:border-primary/25 transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={st.status === "completed"}
                      onChange={() => {}} // handled by wrapper button click
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-card mt-0.5 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-bold block truncate ${st.status === "completed" ? "line-through text-text-secondary opacity-60" : "text-text-main"}`}>
                        {st.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center p-6 text-center text-text-secondary">
            <HelpCircle className="h-8 w-8 text-border mb-3" />
            <p className="text-xs font-bold">No Task Selected</p>
            <p className="text-[10px] text-text-secondary/70 mt-0.5">Select a task from the list to review AI breakdown and analysis.</p>
          </div>
        )}
      </div>

      <AddTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
