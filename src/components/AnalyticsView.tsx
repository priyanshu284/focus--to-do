"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { fetchFocusSessions } from "../lib/db";
import { FocusSession } from "../lib/types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BarChart3, Clock, CheckSquare, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

export default function AnalyticsView() {
  const { tasks, user } = useApp();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Load Focus Sessions
  useEffect(() => {
    async function loadSessions() {
      if (user) {
        try {
          const focusLogs = await fetchFocusSessions(user.uid);
          setSessions(focusLogs);
        } catch (e) {
          console.error("Failed to load sessions for analytics:", e);
        }
      }
      setLoadingSessions(false);
    }
    loadSessions();
  }, [user, tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-8 select-none">
        <div className="max-w-md text-center">
          <BarChart3 className="h-10 w-10 text-primary/30 mx-auto mb-3" />
          <p className="text-xs font-bold text-text-secondary">No Analytics Available</p>
          <p className="text-[10px] text-text-secondary/70 mt-0.5">
            Create tasks and log focus sessions to generate productivity metrics.
          </p>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");

  // Focus hours sum
  const totalFocusMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalFocusHours = Number((totalFocusMinutes / 60).toFixed(1));

  // Completion Rate
  const completionRate = Math.round((completedTasks.length / tasks.length) * 100);

  // Deadline Success Rate: completed before deadline
  const onTimeCompleted = completedTasks.filter((t) => {
    // Assuming if it is completed, it was finished on time unless it was marked overdue
    return t.status === "completed"; // Simplified since we do not store completion timestamps
  }).length;
  
  const deadlineSuccessRate = completedTasks.length > 0
    ? Math.round((onTimeCompleted / completedTasks.length) * 100)
    : 100;

  // Execution Score calculation
  const calculateExecutionScore = () => {
    const completedWeight = completedTasks.length * 100;
    const overdueCount = tasks.filter((t) => {
      const isPast = new Date(t.deadline).getTime() < Date.now();
      return isPast && t.status !== "completed";
    }).length;
    
    const rawScore = (completedWeight - (overdueCount * 30)) / tasks.length;
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  };

  const executionScore = calculateExecutionScore();

  // Category chart distribution data
  const getCategoryChartData = () => {
    const categories = ["Work", "Personal", "Health", "Finance", "Education", "Other"];
    return categories.map((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat);
      const catCompleted = catTasks.filter((t) => t.status === "completed").length;
      return {
        name: cat,
        Total: catTasks.length,
        Completed: catCompleted
      };
    }).filter(d => d.Total > 0); // Only show categories with tasks
  };

  const categoryData = getCategoryChartData();

  // Weekly Progress Data
  const getWeeklyProgressData = () => {
    const data = [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    // We check tasks created in the last 7 days and sum completions per day
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toDateString();
      const dayName = days[(d.getDay() + 6) % 7]; // shift sunday to end

      // Count tasks due or completed on this day
      const completedOnDay = completedTasks.filter(t => new Date(t.deadline).toDateString() === dateStr).length;

      data.push({
        name: dayName,
        Completed: completedOnDay
      });
    }
    return data;
  };

  const weeklyProgress = getWeeklyProgressData();

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none">
      <div>
        <h1 className="text-xl font-bold text-text-main flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Analytics Dashboard
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Historical execution metrics generated from your task activity log.
        </p>
      </div>

      {/* Metric Grid Cards */}
      <div className="grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-sm:grid-cols-1">
        {/* Execution Score */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
            Execution Score
          </span>
          <div className="text-2xl font-black text-primary mt-1.5">
            {executionScore}
            <span className="text-xs text-text-secondary font-medium">/100</span>
          </div>
          <p className="text-[9px] text-text-secondary mt-1 font-semibold">
            Quality factor rating
          </p>
        </div>

        {/* Tasks Completed */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
            Completed Tasks
          </span>
          <div className="text-2xl font-black text-text-main mt-1.5">
            {completedTasks.length}
            <span className="text-xs text-text-secondary font-semibold ml-1">of {tasks.length}</span>
          </div>
          <p className="text-[9px] text-text-secondary mt-1 font-semibold">
            Total achievements logged
          </p>
        </div>

        {/* Focus Hours */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
            Logged Focus Time
          </span>
          <div className="text-2xl font-black text-text-main mt-1.5">
            {totalFocusHours}
            <span className="text-xs text-text-secondary font-semibold ml-1">Hours</span>
          </div>
          <p className="text-[9px] text-text-secondary mt-1 font-semibold">
            Logged Pomodoro slots
          </p>
        </div>

        {/* Completion Rate */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
            Completion Rate
          </span>
          <div className="text-2xl font-black text-text-main mt-1.5">
            {completionRate}%
          </div>
          <p className="text-[9px] text-text-secondary mt-1 font-semibold">
            Success probability ratio
          </p>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        {/* Category distribution */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-6">
            Category Breakdown
          </h3>
          <div className="h-64 w-full text-xs font-bold">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary/50 italic">
                No category data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Bar dataKey="Total" fill="var(--border)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completed" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Productivity Progress */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-6">
            Weekly Progress (Completions)
          </h3>
          <div className="h-64 w-full text-xs font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "11px" }}
                />
                <Bar dataKey="Completed" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
