"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { getCoachResponse } from "../lib/gemini";
import { Sparkles, Send, Bot, Clock, HelpCircle, ChevronRight, Play } from "lucide-react";

export default function CoachView() {
  const { tasks, startFocusSession } = useApp();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([
    {
      id: "welcome",
      sender: "ai",
      text: `Hello! I'm CoachOS, your AI Execution Partner. 
      
I don't just remind you about deadlines — I help you actively plan and finish your work. I specialize in breaking tasks down, prioritizing your backlog, and restructuring schedules.
      
What can I help you accomplish right now?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Hook to capture triggers from FloatingCoach or TaskDetails redirects
  useEffect(() => {
    if (typeof window !== "undefined") {
      const trigger = sessionStorage.getItem("deadlineos_coach_trigger");
      if (trigger) {
        sessionStorage.removeItem("deadlineos_coach_trigger");
        handleSendMessage(trigger);
      }
    }
  }, []);

  const handleSendMessage = async (textToSend: string) => {
    const queryText = textToSend.trim();
    if (!queryText) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await getCoachResponse(queryText, tasks);
      setMessages((prev) => [...prev, response]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: "ai",
          text: "I encountered a communication timeout. Could you try asking again?",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleActionClick = (action: any) => {
    if (action.type === "start_focus" && action.payload?.taskId) {
      const task = tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        startFocusSession(task);
      }
    }
  };

  const chips = [
    "What should I do next?",
    "Break my tasks into smaller steps.",
    "Help me finish this before tomorrow.",
    "Reschedule my work."
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-card select-none">
      {/* Coach Header bar */}
      <div className="px-8 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-text-main">CoachOS Execution Partner</h2>
            <p className="text-[9px] text-text-secondary font-medium">Focused strictly on tasks and workload optimizations</p>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              {/* Avatar indicator */}
              <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}>
                {msg.sender === "user" ? "U" : <Sparkles className="h-4 w-4" />}
              </div>

              {/* Card text */}
              <div className={`rounded-2xl border p-4 space-y-3 ${
                msg.sender === "user"
                  ? "bg-primary/5 border-primary/20 text-text-main"
                  : "bg-card border-border text-text-main"
              }`}>
                <p className="text-xs leading-relaxed font-semibold whitespace-pre-line">
                  {msg.text}
                </p>

                {/* Structured actions inside response */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                    {msg.actions.map((act: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleActionClick(act)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-background border border-border hover:border-primary/25 text-[11px] font-bold text-text-main flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <span className="flex items-center gap-1.5">
                          <Play className="h-3 w-3 text-primary fill-current" />
                          {act.label}
                        </span>
                        <ChevronRight className="h-3 w-3 text-text-secondary group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="h-8 w-8 rounded-full shrink-0 bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 flex gap-1.5 items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce delay-100" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce delay-200" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Footer with Suggestions & Inputs */}
      <div className="p-6 border-t border-border shrink-0 bg-background/50 flex flex-col gap-4">
        {/* Suggestion Chips */}
        <div className="max-w-2xl mx-auto w-full flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-3.5 py-1.5 rounded-full bg-card border border-border hover:border-primary/25 hover:bg-background text-[10px] font-bold text-text-secondary hover:text-text-main transition-all cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="max-w-2xl w-full mx-auto flex gap-3 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Coach (e.g. 'What should I do next?', 'Help me reschedule'...)"
            className="flex-1 pl-4 pr-12 py-3 rounded-xl border border-border bg-card text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-30 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
