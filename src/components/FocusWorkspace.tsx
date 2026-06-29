"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Task, SubTask } from "../lib/types";
import { getCoachResponse } from "../lib/gemini";
import { Play, Pause, RotateCcw, X, CheckSquare, Sparkles, MessageSquare, Send, BookOpen } from "lucide-react";

export default function FocusWorkspace() {
  const { activeFocusTask, endFocusSession, toggleSubtaskStatus, logFocusSession, tasks } = useApp();
  
  // Timer settings
  const workMinutes = 25;
  const [secondsRemaining, setSecondsRemaining] = useState(workMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // AI Help Panel State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      sender: "ai",
      text: "Hello! I am here to help you execute this task. If you're stuck on a step or need advice, just ask.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Audio synthesize system (oscillators) for notification sounds without needing assets
  const playAlertSound = (type: "work_done" | "break_done") => {
    if (typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === "work_done") {
        // High double-beep
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
        
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6
          gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.25);
        }, 200);
      } else {
        // Low warm tone
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Failed to generate synthesize audio:", e);
    }
  };

  // Timer Tick Effect
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsRemaining === 0) {
      // Session finished
      if (!isBreak) {
        // Finished working focus session
        playAlertSound("work_done");
        logFocusSession({
          taskId: activeFocusTask?.id || "unknown",
          taskTitle: activeFocusTask?.title || "Focus Task",
          startTime: new Date(Date.now() - workMinutes * 60 * 1000).toISOString(),
          durationMinutes: workMinutes,
          completedSubtasks: []
        });
        // Switch to break
        setIsBreak(true);
        setSecondsRemaining(5 * 60); // 5 min break
        setIsActive(false);
      } else {
        // Break finished
        playAlertSound("break_done");
        setIsBreak(false);
        setSecondsRemaining(workMinutes * 60);
        setIsActive(false);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining, isBreak]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  if (!activeFocusTask) return null;

  // Sync latest task information from global tasks state
  const currentTask = tasks.find((t) => t.id === activeFocusTask.id) || activeFocusTask;
  const subtasks = currentTask.suggestedBreakdown || [];
  const completedCount = subtasks.filter((st) => st.status === "completed").length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Timer formatting
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // SVG Progress Ring calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const totalTime = isBreak ? 5 * 60 : workMinutes * 60;
  const dashoffset = circumference - ((totalTime - secondsRemaining) / totalTime) * circumference;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: `chat-${Date.now()}`,
      sender: "user",
      text: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await getCoachResponse(userMsg.text, tasks);
      setChatHistory((prev) => [...prev, response]);
    } catch (e) {
      console.error(e);
      setChatHistory((prev) => [
        ...prev,
        {
          id: `chat-err-${Date.now()}`,
          sender: "ai",
          text: "I had a connection issue. Can you try again?",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleActionClick = (action: any) => {
    if (action.type === "start_focus") {
      setIsActive(true);
      setChatOpen(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  return (
    <div className="fixed inset-0 bg-[#0B0F19] text-slate-100 flex flex-col z-50 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            {isBreak ? "Break Session" : "Focus Mode"}
          </span>
          <span className="text-xs text-slate-600">|</span>
          <span className="text-xs font-bold text-slate-300 truncate max-w-sm">
            {currentTask.title}
          </span>
        </div>
        <button
          onClick={endFocusSession}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Exit Focus
        </button>
      </div>

      {/* Main Grid Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Tasks checklist & Notes */}
        <div className="w-80 border-r border-slate-800 flex flex-col h-full bg-slate-950/30 overflow-y-auto p-6 max-md:hidden">
          {/* Checklist */}
          <div>
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" /> Checklist
            </h3>
            {subtasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No checklist items generated.</p>
            ) : (
              <div className="space-y-2">
                {subtasks.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => toggleSubtaskStatus(currentTask.id, st.id)}
                    className="w-full text-left p-3 rounded-xl border border-slate-800/80 bg-slate-900/30 hover:bg-slate-900/60 transition-all flex items-start gap-3 group cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={st.status === "completed"}
                      onChange={() => {}} // handled by button click
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary focus:ring-offset-slate-950 mt-0.5 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${st.status === "completed" ? "line-through text-slate-600" : "text-slate-300"}`}>
                        {st.title}
                      </p>
                      <span className="text-[10px] text-slate-500">{st.estimatedTime}h needed</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes reference */}
          {currentTask.notes && (
            <div className="mt-8 border-t border-slate-800 pt-6">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Reference Notes
              </h3>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 leading-relaxed font-medium">
                {currentTask.notes}
              </div>
            </div>
          )}
        </div>

        {/* Center: Large Countdown Timer */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950/10">
          <div className="relative h-64 w-64 flex items-center justify-center">
            {/* SVG Progress Circle Background */}
            <svg className="absolute inset-0 h-full w-full">
              <circle
                cx="128"
                cy="128"
                r={radius}
                className="stroke-slate-800/60 fill-none"
                strokeWidth="6"
              />
              <circle
                cx="128"
                cy="128"
                r={radius}
                className="stroke-primary fill-none progress-ring-circle"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
              />
            </svg>

            {/* Timer Output */}
            <div className="text-center z-10">
              <span className="text-5xl font-mono font-extrabold text-slate-50 tracking-tight">
                {formatTime(secondsRemaining)}
              </span>
              <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">
                {isBreak ? "Break" : "Remaining"}
              </p>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={() => {
                setIsActive(false);
                setSecondsRemaining(isBreak ? 5 * 60 : workMinutes * 60);
              }}
              className="p-3 rounded-full border border-slate-800 hover:bg-slate-900 hover:text-white text-slate-400 transition-all cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`px-8 py-3.5 rounded-full text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-100 text-slate-950 hover:bg-slate-200"
                  : "bg-primary text-white hover:bg-primary-hover shadow-primary/10"
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="h-4.5 w-4.5 fill-current" /> Pause Focus
                </>
              ) : (
                <>
                  <Play className="h-4.5 w-4.5 fill-current" /> Start Focus
                </>
              )}
            </button>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-3 rounded-full border transition-all cursor-pointer ${
                chatOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white"
              }`}
              title="AI Support Panel"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar info */}
          <div className="w-full max-w-sm mt-12 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-slate-400">Execution Progress</span>
              <span className="font-bold text-primary">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium">
              <span>{completedCount} of {totalCount} subtasks done</span>
              <span>Keep pushing</span>
            </div>
          </div>
        </div>

        {/* Right Side: AI Coach side-drawer */}
        {chatOpen && (
          <div className="w-80 border-l border-slate-800 bg-slate-950 flex flex-col h-full z-10 shrink-0">
            {/* Coach Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>CoachOS Focus Assist</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary/25 border border-primary/20 text-slate-200 self-end ml-auto"
                      : "bg-slate-900 border border-slate-800 text-slate-300 self-start mr-auto"
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>
                  
                  {/* Actions suggestions */}
                  {msg.actions && msg.actions.map((act: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(act)}
                      className="mt-2.5 w-full py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              ))}
              
              {chatLoading && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 self-start flex gap-1.5 items-center mr-auto">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" />
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce delay-100" />
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce delay-200" />
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Suggested micro chips */}
            <div className="p-3 border-t border-slate-900 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => handleQuickPrompt("How do I start this task?")}
                className="px-2.5 py-1 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-[10px] text-slate-400 font-semibold transition-all cursor-pointer"
              >
                How to start?
              </button>
              <button
                onClick={() => handleQuickPrompt("Split this next step.")}
                className="px-2.5 py-1 rounded-full border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-[10px] text-slate-400 font-semibold transition-all cursor-pointer"
              >
                Split next step
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/40 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask focus coach..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-slate-700 transition-all font-medium"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
