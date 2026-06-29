"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Sparkles, MessageSquare } from "lucide-react";

export default function FloatingCoach() {
  const { navigateTo, user, isFocusMode } = useApp();
  const [visible, setVisible] = useState(false);

  // Trigger brief micro animation or delayed entry on mount
  useEffect(() => {
    if (user && !isFocusMode) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [user, isFocusMode]);

  if (!visible) return null;

  const handleAction = () => {
    // Navigate to coach tab and trigger initial action
    navigateTo("coach");
    // Trigger prompt via sessionStorage so the coach component reads it on mount
    if (typeof window !== "undefined") {
      sessionStorage.setItem("deadlineos_coach_trigger", "what should i do next");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-3 z-40 select-none animate-float">
      {/* Speech Box */}
      <div className="bg-card border border-border px-4 py-2.5 rounded-2xl shadow-lg shadow-text-main/5 max-sm:hidden flex flex-col gap-0.5 max-w-xs relative after:content-[''] after:absolute after:-right-2 after:top-1/2 after:-translate-y-1/2 after:border-[6px] after:border-transparent after:border-l-card dark:after:border-l-card">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wide leading-none">
          CoachOS
        </span>
        <span className="text-xs font-bold text-text-main leading-tight">
          Stuck? Ask me what to do next.
        </span>
      </div>

      {/* Button */}
      <button
        onClick={handleAction}
        className="h-12 px-4 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
      >
        <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white group-hover:rotate-12 transition-transform" />
        </div>
        <span>What should I do next?</span>
      </button>
    </div>
  );
}
