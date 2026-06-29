"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Task } from "../lib/types";
import AddTaskModal from "./AddTaskModal";
import { Sparkles, Plus, AlertTriangle, Clock, Calendar, CheckCircle2, ChevronRight, Play } from "lucide-react";

export default function DashboardView() {
  const { tasks, startFocusSession, settings } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  // ----------------------------------------------------
  // CALCULATE DYNAMIC METRICS
  // ----------------------------------------------------
  const calculateExecutionScore = () => {
    if (tasks.length === 0) return 0;
    const completedWeight = completedTasks.length * 100;
    
    // Deduct score for overdue tasks
    const overdueCount = tasks.filter((t) => {
      const isPast = new Date(t.deadline).getTime() < Date.now();
      return isPast && t.status !== "completed";
    }).length;
    
    const rawScore = (completedWeight - (overdueCount * 30)) / tasks.length;
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  };

  const executionScore = calculateExecutionScore();

  // Progress Bar percentage
  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0;

  // Total Focus Hours Budget
  const totalFocusHours = pendingTasks.reduce((sum, t) => sum + t.estimatedTime, 0);

  // ----------------------------------------------------
  // WORKLOAD ANALYZER (NEXT 7 DAYS)
  // ----------------------------------------------------
  const getWorkloadData = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const workload: { name: string; dateStr: string; hours: number; dayOfWeek: string }[] = [];
    
    // Generate next 7 days starting from today
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toDateString();
      const dayOfWeek = days[d.getDay()];
      
      // Sum estimated hours for tasks due on this date (UTC-ignored simple date check)
      const dailyHours = tasks
        .filter((t) => t.status !== "completed" && new Date(t.deadline).toDateString() === dateStr)
        .reduce((sum, t) => sum + t.estimatedTime, 0);

      workload.push({
        name: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayOfWeek.substring(0, 3),
        dateStr,
        hours: Number(dailyHours.toFixed(1)),
        dayOfWeek
      });
    }
    return workload;
  };

  const workloadData = getWorkloadData();

  // Settings work budget limit
  const getDailyWorkloadLimit = () => {
    const [startH, startM] = settings.workingHoursStart.split(":").map(Number);
    const [endH, endM] = settings.workingHoursEnd.split(":").map(Number);
    return Math.max(2, (endH + endM / 60) - (startH + startM / 60));
  };

  const dailyLimit = getDailyWorkloadLimit();

  // Check if any day is overloaded
  const overloadedDay = workloadData.find((wd) => wd.hours > dailyLimit);

  // ----------------------------------------------------
  // RENDER EMPTY STATE
  // ----------------------------------------------------
  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 select-none">
        <div className="max-w-md text-center flex flex-col items-center">
          {/* Minimal illustration */}
          <div className="relative h-24 w-24 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse-subtle" />
            <Sparkles className="h-10 w-10 text-primary/40" />
          </div>

          <h3 className="text-base font-bold text-text-main">
            You're all caught up.
          </h3>
          <p className="text-xs text-text-secondary mt-2 max-w-xs leading-relaxed">
            Create your first task to let AI build your custom execution plan, subtasks, and schedule slots.
          </p>

          <button
            onClick={() => setModalOpen(true)}
            className="mt-6 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/10 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create First Task
          </button>
        </div>

        <AddTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    );
  }

  // Today's top priority task (highest priority score)
  const topPriorityTask = [...pendingTasks].sort((a, b) => b.priorityScore - a.priorityScore)[0];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none">
      {/* Dynamic Summary Cards Grid */}
      <div className="grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {/* Execution Score Gauge */}
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="h-16 w-16 shrink-0 relative flex items-center justify-center">
            {/* SVG circle */}
            <svg className="absolute inset-0 h-full w-full">
              <circle cx="32" cy="32" r="28" className="stroke-border fill-none" strokeWidth="4" />
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-primary fill-none"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - executionScore / 100)}
                strokeLinecap="round"
                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            </svg>
            <span className="text-sm font-extrabold text-text-main">{executionScore}</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wide">
              Execution Score
            </h4>
            <p className="text-[10px] text-text-secondary mt-1 leading-relaxed">
              Task compliance index. Keep it above 85.
            </p>
          </div>
        </div>

        {/* Today's Progress Bar */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-bold text-text-secondary uppercase tracking-wide">Progress</span>
            <span className="font-extrabold text-primary">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-secondary/70 mt-2 font-medium">
            <span>{completedTasks.length} completed</span>
            <span>{pendingTasks.length} pending</span>
          </div>
        </div>

        {/* Focus Hours */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-1">
            Focus Budget Needed
          </span>
          <div className="text-2xl font-black text-text-main">
            {totalFocusHours.toFixed(1)} <span className="text-xs text-text-secondary font-medium">Hours</span>
          </div>
          <p className="text-[10px] text-text-secondary mt-1.5 font-medium leading-none">
            Required active working budget.
          </p>
        </div>

        {/* Queue Count */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden group">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-1">
            Active Backlog
          </span>
          <div className="text-2xl font-black text-text-main">
            {pendingTasks.length} <span className="text-xs text-text-secondary font-medium">Tasks</span>
          </div>
          <p className="text-[10px] text-text-secondary mt-1.5 font-medium leading-none">
            Manual tasks left to finish.
          </p>
          {/* Quick Add Button */}
          <button
            onClick={() => setModalOpen(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-primary hover:bg-primary-hover text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
            title="Create Task"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: AI suggestions & Workload analyzer */}
      <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
        {/* Left Side: Workload Chart & AI advice */}
        <div className="col-span-2 space-y-6">
          {/* Workload Analyzer */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-5">
              Workload Overview (Next 7 Days)
            </h3>
            
            <div className="space-y-4">
              {workloadData.map((day) => {
                const percent = Math.min(100, (day.hours / dailyLimit) * 100);
                const isOverloaded = day.hours > dailyLimit;

                return (
                  <div key={day.dateStr} className="flex items-center gap-4 text-xs font-medium">
                    <span className="w-16 font-semibold text-text-secondary">{day.name}</span>
                    <div className="flex-1 h-4 bg-background border border-border/40 rounded-md overflow-hidden relative">
                      {day.hours > 0 ? (
                        <div
                          className={`h-full rounded-r transition-all duration-500 ${
                            isOverloaded ? "bg-danger" : "bg-primary"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      ) : (
                        <div className="w-full h-full bg-background flex items-center px-2 text-[9px] text-text-secondary/40 font-medium">
                          No tasks scheduled
                        </div>
                      )}
                    </div>
                    <span className={`w-14 text-right font-bold ${isOverloaded ? "text-danger" : "text-text-main"}`}>
                      {day.hours > 0 ? `${day.hours}h` : "0h"}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-text-secondary/70 mt-6 border-t border-border/60 pt-4 font-semibold">
              <span>Daily Working Limit: {dailyLimit} hours</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Normal
                <span className="h-2 w-2 rounded-full bg-danger" /> Overloaded
              </span>
            </div>
          </div>

          {/* AI Suggestions Card */}
          {overloadedDay ? (
            <div className="p-5 rounded-2xl bg-danger/5 border border-danger/10 flex gap-4 animate-breathing">
              <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-text-main">
                  AI Schedule Collision Warning
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed mt-1 font-medium">
                  Your scheduled tasks for **{overloadedDay.name}** ({overloadedDay.hours} hours) exceed your set daily working hours budget ({dailyLimit} hours). 
                  To prevent missing deadlines, the AI recommends rescheduling low-priority items like tasks marked 'low' or moving development focus.
                </p>
                <div className="flex gap-4 mt-3">
                  <span className="text-[10px] text-danger font-extrabold uppercase">
                    Deadline Risk: HIGH
                  </span>
                  <span className="text-[10px] text-text-secondary/80 font-bold">
                    Buffer shortfalls: {Math.round(overloadedDay.hours - dailyLimit)} hours
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-success/5 border border-success/10 flex gap-4">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-text-main">
                  AI Plan Optimization Check
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed mt-1 font-medium">
                  Excellent! Your workload queue is fully optimized. The total estimated focus time for all upcoming days remains well within your scheduled working hours. All buffer capacities look stable.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Today's AI Daily Plan & Upcoming deadlines */}
        <div className="space-y-6">
          {/* Today's AI Plan */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-4 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Today's AI Daily Plan
            </h3>

            {topPriorityTask ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background border border-border relative overflow-hidden group">
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                    Top Priority
                  </span>
                  <h4 className="text-xs font-bold text-text-main truncate mt-2">
                    {topPriorityTask.title}
                  </h4>
                  <p className="text-[10px] text-text-secondary mt-1 truncate">
                    {topPriorityTask.description || "No description provided."}
                  </p>
                  
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-[10px] text-text-secondary font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Slot: {topPriorityTask.suggestedSlot.split(" ")[0]}
                    </span>
                    <button
                      onClick={() => startFocusSession(topPriorityTask)}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[10px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" /> Start Focus
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-border/60 pt-4 text-xs font-medium">
                  <div className="flex justify-between text-text-secondary">
                    <span>Focus session target:</span>
                    <span className="font-bold text-text-main">{topPriorityTask.estimatedTime} Hours</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Suggested breaks:</span>
                    <span className="font-bold text-text-main">2 x 5 Min Breaks</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-secondary italic">No tasks in focus today. Enjoy your downtime!</p>
            )}
          </div>

          {/* Upcoming Deadlines list */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-4">
              Upcoming Deadlines
            </h3>

            {pendingTasks.length === 0 ? (
              <p className="text-xs text-text-secondary italic">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.slice(0, 3).map((task) => {
                  const deadlineDate = new Date(task.deadline);
                  const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-text-main truncate">
                          {task.title}
                        </h4>
                        <span className="text-[10px] text-text-secondary flex items-center gap-1 mt-0.5">
                          <Calendar className="h-2.5 w-2.5" /> Due {deadlineDate.toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          daysLeft <= 1
                            ? "bg-danger/10 text-danger"
                            : daysLeft <= 3
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {daysLeft <= 0 ? "Overdue" : daysLeft === 1 ? "1d left" : `${daysLeft}d left`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
