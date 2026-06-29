"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import { Task } from "../lib/types";
import { Sparkles, Calendar, Clock, AlertTriangle, CheckSquare, GitCommit } from "lucide-react";

export default function TimelineView() {
  const { tasks, startFocusSession } = useApp();

  const pendingTasks = tasks.filter((t) => t.status !== "completed");

  // ----------------------------------------------------
  // GROUP TASKS BY TIMELINE BLOCKS
  // ----------------------------------------------------
  const getTimelineBlocks = () => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const tomorrow: Task[] = [];
    const upcoming: Task[] = [];

    const now = new Date();
    
    // Today's date boundary
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // Tomorrow's date boundary
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);

    pendingTasks.forEach((task) => {
      const deadline = new Date(task.deadline);
      
      if (deadline.getTime() < now.getTime()) {
        overdue.push(task);
      } else if (deadline.getTime() >= todayStart.getTime() && deadline.getTime() <= todayEnd.getTime()) {
        today.push(task);
      } else if (deadline.getTime() >= tomorrowStart.getTime() && deadline.getTime() <= tomorrowEnd.getTime()) {
        tomorrow.push(task);
      } else {
        upcoming.push(task);
      }
    });

    return [
      { id: "overdue", label: "Overdue Work Blocks", tasks: overdue, color: "text-danger bg-danger/10 border-danger/20", lineClass: "bg-danger/40" },
      { id: "today", label: "Today's Work Targets", tasks: today, color: "text-primary bg-primary/10 border-primary/20", lineClass: "bg-primary/40" },
      { id: "tomorrow", label: "Tomorrow's Schedules", tasks: tomorrow, color: "text-warning bg-warning/10 border-warning/20", lineClass: "bg-warning/40" },
      { id: "upcoming", label: "Upcoming Milestones", tasks: upcoming, color: "text-success bg-success/10 border-success/20", lineClass: "bg-success/40" }
    ];
  };

  const blocks = getTimelineBlocks();
  const hasTasks = pendingTasks.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-8 select-none">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-text-main flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-primary" />
            Execution Timeline
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Vertical plan showing task blocks, deadlines, and execution risk.
          </p>
        </div>

        {!hasTasks ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Calendar className="h-8 w-8 text-primary/20 mx-auto mb-3" />
            <p className="text-xs font-bold text-text-secondary">Your schedule is clear</p>
            <p className="text-[10px] text-text-secondary/70 mt-0.5">All tasks are completed. You have no pending deadlines.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-border/80 space-y-8 mt-4">
            {blocks.map((block) => {
              if (block.tasks.length === 0) return null;

              return (
                <div key={block.id} className="relative space-y-4">
                  {/* Timeline Node Point Marker */}
                  <span className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-background flex items-center justify-center`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      block.id === "overdue" ? "bg-danger" : block.id === "today" ? "bg-primary" : "bg-text-secondary"
                    }`} />
                  </span>

                  {/* Section Label */}
                  <h3 className="text-xs font-extrabold text-text-secondary uppercase tracking-widest flex items-center gap-2 leading-none">
                    {block.label}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background border border-border normal-case tracking-normal">
                      {block.tasks.length} {block.tasks.length === 1 ? "task" : "tasks"}
                    </span>
                  </h3>

                  {/* Tasks block container */}
                  <div className="space-y-3">
                    {block.tasks.map((task) => {
                      const deadlineDate = new Date(task.deadline);
                      const timeDiffHours = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
                      const relativeTimeText =
                        timeDiffHours < 0
                          ? `${Math.abs(Math.round(timeDiffHours))} hours overdue`
                          : timeDiffHours <= 1
                          ? "Due within the hour"
                          : `Due in ${Math.round(timeDiffHours)} hours`;

                      return (
                        <div
                          key={task.id}
                          className="bg-card border border-border rounded-xl p-4 flex justify-between items-start gap-4 hover:shadow-md hover:shadow-text-main/5 hover:border-primary/20 transition-all group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-text-secondary font-bold">
                                {task.category}
                              </span>
                              <span className="text-text-secondary/50 text-[10px]">•</span>
                              <span className={`text-[9px] font-semibold ${
                                task.completionRisk === "high" ? "text-danger" : "text-text-secondary"
                              }`}>
                                {relativeTimeText}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-text-main mt-2 truncate">
                              {task.title}
                            </h4>
                            
                            <p className="text-[10px] text-text-secondary mt-1.5 leading-relaxed truncate">
                              {task.description || "No description provided."}
                            </p>

                            {/* Estimated parameters */}
                            <div className="flex items-center gap-4 text-[9px] font-bold text-text-secondary/70 mt-3 pt-3 border-t border-border/40">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-text-secondary" /> {task.estimatedTime}h Budget
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-text-secondary" /> Due {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {/* AI Priority & Action */}
                          <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              <span>{task.priorityScore}</span>
                            </div>

                            <button
                              onClick={() => startFocusSession(task)}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            >
                              Focus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
