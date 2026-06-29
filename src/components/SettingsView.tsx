"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { UserSettings } from "../lib/types";
import { Settings as SettingsIcon, Bell, Calendar, Clock, Sparkles, Moon, Sun } from "lucide-react";

export default function SettingsView() {
  const { settings, updateSettings, theme, toggleTheme } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(settings.calendarSyncEnabled);
  const [workDuration, setWorkDuration] = useState(settings.focusPreferences.workDuration.toString());
  const [breakDuration, setBreakDuration] = useState(settings.focusPreferences.breakDuration.toString());
  const [workingHoursStart, setWorkingHoursStart] = useState(settings.workingHoursStart);
  const [workingHoursEnd, setWorkingHoursEnd] = useState(settings.workingHoursEnd);
  const [autoSchedule, setAutoSchedule] = useState(settings.aiPreferences.autoSchedule);
  const [analysisDepth, setAnalysisDepth] = useState(settings.aiPreferences.analysisDepth);

  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updated: UserSettings = {
      theme,
      notificationsEnabled,
      calendarSyncEnabled,
      workingHoursStart,
      workingHoursEnd,
      focusPreferences: {
        workDuration: parseInt(workDuration) || 25,
        breakDuration: parseInt(breakDuration) || 5,
      },
      aiPreferences: {
        autoSchedule,
        analysisDepth
      }
    };

    setTimeout(async () => {
      await updateSettings(updated);
      setSaving(false);
    }, 500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 select-none">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-text-main flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            System Settings
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Configure system themes, notifications, calendars, and AI engines.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Preferences */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5 border-b border-border/40 pb-3">
              <Sun className="h-4 w-4" /> Personalization & Sync
            </h3>

            {/* Theme Toggle */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="text-xs font-bold text-text-main block">Theme Mode</span>
                <span className="text-[10px] text-text-secondary">Switch between dark and light screens</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-4 py-2 rounded-xl border border-border bg-background text-xs font-bold text-text-main hover:bg-card transition-all flex items-center gap-2 cursor-pointer"
              >
                {theme === "dark" ? (
                  <>
                    <Moon className="h-3.5 w-3.5 text-primary" /> Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5 text-warning" /> Light Mode
                  </>
                )}
              </button>
            </div>

            {/* Notifications */}
            <div className="flex justify-between items-center py-2 border-t border-border/40">
              <div>
                <span className="text-xs font-bold text-text-main block">Push Notifications</span>
                <span className="text-[10px] text-text-secondary">Get alert recommendations and schedule warning blocks</span>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-card cursor-pointer"
              />
            </div>

            {/* Google Calendar */}
            <div className="flex justify-between items-center py-2 border-t border-border/40">
              <div>
                <span className="text-xs font-bold text-text-main block">Google Calendar Integration</span>
                <span className="text-[10px] text-text-secondary">Sync AI daily schedules directly into your calendar</span>
              </div>
              <input
                type="checkbox"
                checked={calendarSyncEnabled}
                onChange={(e) => setCalendarSyncEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-card cursor-pointer"
              />
            </div>
          </div>

          {/* Working Hour & focus parameters */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5 border-b border-border/40 pb-3">
              <Clock className="h-4 w-4" /> Focus & Core Hours
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Pomodoro Focus session */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                  Focus Interval (Min)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                />
              </div>

              {/* Break duration */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                  Break Interval (Min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                />
              </div>

              {/* Working Hours start */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                  Working Hours Start
                </label>
                <input
                  type="time"
                  value={workingHoursStart}
                  onChange={(e) => setWorkingHoursStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                />
              </div>

              {/* Working Hours end */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                  Working Hours End
                </label>
                <input
                  type="time"
                  value={workingHoursEnd}
                  onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5 border-b border-border/40 pb-3">
              <Sparkles className="h-4 w-4" /> AI Coach Options
            </h3>

            {/* Auto Schedule */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="text-xs font-bold text-text-main block">Auto-reschedule Assist</span>
                <span className="text-[10px] text-text-secondary">Let CoachOS auto-adjust schedules when deadlines are missed</span>
              </div>
              <input
                type="checkbox"
                checked={autoSchedule}
                onChange={(e) => setAutoSchedule(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-card cursor-pointer"
              />
            </div>

            {/* Analysis Depth */}
            <div className="flex justify-between items-center py-2 border-t border-border/40">
              <div>
                <span className="text-xs font-bold text-text-main block">AI Breakdown Depth</span>
                <span className="text-[10px] text-text-secondary">Depth of subtasks breakdown generation</span>
              </div>
              <select
                value={analysisDepth}
                onChange={(e) => setAnalysisDepth(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 transition-all font-semibold cursor-pointer"
              >
                <option value="standard">Standard (4-6 steps)</option>
                <option value="deep">Deep (8-12 steps)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
