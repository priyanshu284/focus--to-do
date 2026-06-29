"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginView() {
  const { signIn } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLocal, setLoadingLocal] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoadingLocal(true);
    // Simulate standard credentials verification
    setTimeout(async () => {
      await signIn();
      setLoadingLocal(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative select-none">
      {/* Background light glow decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 z-10 flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md mx-auto font-bold text-lg mb-4">
            D
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">
            DeadlineOS
          </h1>
          <p className="text-xs text-text-secondary mt-1.5 font-medium">
            Don't remind me. <span className="text-primary font-semibold">Help me finish it.</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loadingLocal}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loadingLocal ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                Continue with Email
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-border flex-1" />
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none">
            Or sandbox access
          </span>
          <div className="h-px bg-border flex-1" />
        </div>

        {/* Google SSO button */}
        <button
          onClick={signIn}
          className="w-full py-2.5 rounded-xl border border-border hover:bg-background text-text-main text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {/* Custom SVG Google Icon */}
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.72 5.72 0 0 1 8.24 12.87a5.72 5.72 0 0 1 5.751-5.73c1.554 0 2.955.57 4.053 1.503l3.076-3.076A10.02 10.02 0 0 0 13.991 2.74c-5.59 0-10.12 4.53-10.12 10.13 0 5.6 4.53 10.13 10.12 10.13 5.3 0 9.87-3.8 9.87-10.13a9.05 9.05 0 0 0-.17-1.74l-11.45.015z"
            />
          </svg>
          Quick Sandbox Sign-In
        </button>
      </div>

      {/* Footer copyright notes */}
      <p className="text-[10px] text-text-secondary mt-8 font-medium">
        DeadlineOS — Secure authentication sandbox. Works completely offline.
      </p>
    </div>
  );
}
