"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { analyzeTaskWithAI } from "../lib/gemini";
import { X, Sparkles, AlertTriangle, CheckSquare, Clock, Calendar, Bookmark } from "lucide-react";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTaskModal({ isOpen, onClose }: AddTaskModalProps) {
  const { createTask } = useApp();
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("1.0");
  const [category, setCategory] = useState<"Work" | "Personal" | "Health" | "Finance" | "Education" | "Other">("Work");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");

  // UI Flow State
  const [step, setStep] = useState<"form" | "loading" | "analysis">("form");
  const [loadingStage, setLoadingStage] = useState("Initializing analyzer...");
  const [aiData, setAiData] = useState<any>(null);

  if (!isOpen) return null;

  // Run AI analysis pipeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) return;

    setStep("loading");
    
    // Simulate loading steps for professional aesthetic feel
    const stages = [
      "Connecting to Gemini Engine...",
      "Evaluating current weekly workload...",
      "Running deadline collision heuristics...",
      "Formulating custom subtask breakdowns...",
      "Refining priority scores..."
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stages.length) {
        setLoadingStage(stages[stageIdx]);
        stageIdx++;
      }
    }, 450);

    try {
      const response = await analyzeTaskWithAI(
        title,
        description,
        category,
        deadline,
        parseFloat(estimatedTime),
        priority
      );
      
      clearInterval(interval);
      setAiData(response);
      setStep("analysis");
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setStep("form");
    }
  };

  // Confirm task and commit to store
  const handleConfirmSave = async () => {
    if (!aiData) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await createTask(
      {
        title,
        description,
        deadline,
        estimatedTime: parseFloat(estimatedTime),
        category,
        priority,
        tags,
        notes,
      },
      aiData
    );

    // Reset Form
    setTitle("");
    setDescription("");
    setDeadline("");
    setEstimatedTime("1.0");
    setCategory("Work");
    setPriority("medium");
    setTagsInput("");
    setNotes("");
    setStep("form");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-text-main/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-bold text-text-main flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
            {step === "analysis" ? "AI Analysis & Scheduling Plan" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-main hover:bg-background transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dynamic Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                {/* Title */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Build Hackathon Project"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief summary of the execution objective..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium resize-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Health">Health</option>
                    <option value="Finance">Finance</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                  />
                </div>

                {/* Estimated Focus Time */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Est. Work Time (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. dev, coding, homework"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                    Reference Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Doc link, repo credentials..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary hover:text-text-main hover:bg-background transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-primary/10 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze with AI
                </button>
              </div>
            </form>
          )}

          {step === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative h-12 w-12 flex items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-text-main">
                Formulating AI Plan
              </h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm">
                {loadingStage}
              </p>
            </div>
          )}

          {step === "analysis" && aiData && (
            <div className="space-y-6">
              {/* Header metrics card */}
              <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                {/* Priority Score */}
                <div className="p-4 rounded-xl border border-border bg-background text-center relative overflow-hidden">
                  <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                    Priority Score
                  </div>
                  <div className="text-3xl font-extrabold text-primary mt-1">
                    {aiData.priorityScore}
                    <span className="text-xs text-text-secondary font-medium">/100</span>
                  </div>
                  <p className="text-[9px] text-text-secondary mt-1">
                    Urgency factor rating
                  </p>
                </div>

                {/* Completion Risk */}
                <div className="p-4 rounded-xl border border-border bg-background text-center relative overflow-hidden">
                  <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                    Deadline Risk
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1.5">
                    {aiData.completionRisk === "high" && (
                      <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[11px] font-extrabold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> High
                      </span>
                    )}
                    {aiData.completionRisk === "medium" && (
                      <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[11px] font-extrabold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Medium
                      </span>
                    )}
                    {aiData.completionRisk === "low" && (
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-extrabold flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" /> Low
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-text-secondary mt-2 truncate" title={aiData.riskExplanation}>
                    {aiData.riskExplanation}
                  </p>
                </div>

                {/* Suggested slot */}
                <div className="p-4 rounded-xl border border-border bg-background text-center">
                  <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                    Suggested Focus Slot
                  </div>
                  <div className="text-xs font-bold text-text-main mt-2.5 truncate" title={aiData.suggestedSlot}>
                    {aiData.suggestedSlot}
                  </div>
                  <p className="text-[9px] text-text-secondary mt-2">
                    Best biological clock slot
                  </p>
                </div>
              </div>

              {/* Risk explanation Alert */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                <Sparkles className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-text-main">AI Risk Analysis</h4>
                  <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                    {aiData.riskExplanation}
                  </p>
                </div>
              </div>

              {/* Checklist subtasks breakdown */}
              <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" />
                  AI Suggested Execution Breakdown
                </h4>
                <div className="space-y-2 border border-border bg-background rounded-xl p-3 max-h-48 overflow-y-auto">
                  {aiData.suggestedBreakdown.map((st: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-4.5 w-4.5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-extrabold">
                          {idx + 1}
                        </div>
                        <span className="text-xs font-bold text-text-main">
                          {st.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold text-text-secondary flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" /> {st.estimatedTime}h
                        </span>
                        <span
                          className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            st.priority === "high"
                              ? "bg-danger/10 text-danger"
                              : st.priority === "medium"
                              ? "bg-warning/10 text-warning"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {st.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-xs font-bold text-text-secondary hover:text-text-main transition-colors cursor-pointer"
                >
                  Adjust Parameters
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-text-secondary hover:text-text-main hover:bg-background transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm shadow-primary/10 transition-colors cursor-pointer"
                  >
                    Confirm & Save AI Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
