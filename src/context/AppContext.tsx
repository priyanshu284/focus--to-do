"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task, FocusSession, UserSettings, UserProfile, Notification } from "../lib/types";
import {
  subscribeToAuth,
  loginWithGoogle,
  logout,
  fetchTasks,
  saveTask,
  updateTask,
  deleteTask,
  fetchSettings,
  saveSettings,
  saveFocusSession
} from "../lib/db";

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  tasks: Task[];
  notifications: Notification[];
  settings: UserSettings;
  activeTab: string; // 'dashboard' | 'tasks' | 'coach' | 'timeline' | 'analytics' | 'settings' | 'focus' | 'login'
  theme: "light" | "dark";
  activeFocusTask: Task | null;
  isFocusMode: boolean;
  
  // Auth Functions
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  
  // Navigation
  navigateTo: (tab: string) => void;
  
  // Task Functions
  createTask: (taskData: Omit<Task, "id" | "createdAt" | "status" | "priorityScore" | "completionRisk" | "riskExplanation" | "suggestedSlot" | "suggestedBreakdown">, aiData: any) => Promise<void>;
  updateTaskDetails: (taskId: string, updates: Partial<Task>) => Promise<void>;
  toggleSubtaskStatus: (taskId: string, subtaskId: string) => Promise<void>;
  deleteTaskById: (taskId: string) => Promise<void>;
  
  // Session Functions
  logFocusSession: (session: Omit<FocusSession, "id">) => Promise<void>;
  
  // Notification Functions
  triggerNotification: (title: string, message: string, type: Notification["type"]) => void;
  dismissNotification: (id: string) => void;
  
  // Settings & Theme
  updateSettings: (newSettings: UserSettings) => Promise<void>;
  toggleTheme: () => void;
  
  // Focus Triggers
  startFocusSession: (task: Task) => void;
  endFocusSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    theme: "light",
    notificationsEnabled: true,
    calendarSyncEnabled: false,
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    focusPreferences: { workDuration: 25, breakDuration: 5 },
    aiPreferences: { autoSchedule: true, analysisDepth: "standard" },
  });
  const [activeTab, setActiveTab] = useState<string>("login");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // ----------------------------------------------------
  // AUTH SUBSCRIPTION
  // ----------------------------------------------------
  useEffect(() => {
    const unsubscribe = subscribeToAuth((profile) => {
      setUser(profile);
      if (profile) {
        // Load data for verified user
        loadUserData(profile.uid);
        setActiveTab("dashboard");
      } else {
        setTasks([]);
        setActiveTab("login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------
  // DATA LOADING
  // ----------------------------------------------------
  const loadUserData = async (uid: string) => {
    try {
      const userSettings = await fetchSettings(uid);
      setSettings(userSettings);
      setTheme(userSettings.theme);
      
      const userTasks = await fetchTasks(uid);
      setTasks(userTasks);
    } catch (e) {
      console.error("Failed to load user records:", e);
    }
  };

  // Sync HTML class lists to match active theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  // ----------------------------------------------------
  // AUTHENTICATION CONTROLS
  // ----------------------------------------------------
  const signIn = async () => {
    try {
      setLoading(true);
      const profile = await loginWithGoogle();
      setUser(profile);
      await loadUserData(profile.uid);
      triggerNotification("Welcome back!", `Signed in successfully as ${profile.displayName}.`, "success");
      setActiveTab("dashboard");
    } catch (error: any) {
      console.error("Google login failed:", error);
      triggerNotification("Authentication Failed", error.message || "Failed to complete sign-in.", "warning");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await logout();
      setUser(null);
      setTasks([]);
      setActiveTab("login");
      triggerNotification("Signed Out", "Successfully signed out of your account.", "info");
    } catch (e) {
      console.error("Failed to sign out:", e);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // NAVIGATION CONTROLS
  // ----------------------------------------------------
  const navigateTo = (tab: string) => {
    if (tab === "focus") {
      setIsFocusMode(true);
    } else {
      setIsFocusMode(false);
      setActiveTab(tab);
    }
  };

  // ----------------------------------------------------
  // NOTIFICATIONS ENGINE
  // ----------------------------------------------------
  const triggerNotification = (title: string, message: string, type: Notification["type"]) => {
    if (!settings.notificationsEnabled && type !== "warning") return;
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]); // Cap at 10 items
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // ----------------------------------------------------
  // SETTINGS & THEME
  // ----------------------------------------------------
  const updateSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    setSettings(newSettings);
    setTheme(newSettings.theme);
    await saveSettings(user.uid, newSettings);
    triggerNotification("Settings Updated", "Your preferences were saved successfully.", "success");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    const updated: UserSettings = { ...settings, theme: nextTheme };
    setSettings(updated);
    if (user) {
      saveSettings(user.uid, updated);
    }
  };

  // ----------------------------------------------------
  // TASK CONTROLS
  // ----------------------------------------------------
  const createTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "status" | "priorityScore" | "completionRisk" | "riskExplanation" | "suggestedSlot" | "suggestedBreakdown">,
    aiData: any
  ) => {
    if (!user) return;
    
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      priorityScore: aiData.priorityScore,
      completionRisk: aiData.completionRisk,
      riskExplanation: aiData.riskExplanation,
      suggestedSlot: aiData.suggestedSlot,
      suggestedBreakdown: aiData.suggestedBreakdown,
    };

    setTasks((prev) => {
      const updated = [newTask, ...prev];
      return updated.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    });

    await saveTask(user.uid, newTask);
    triggerNotification(
      "Task Created",
      `"${newTask.title}" added to your backlog with AI priority ${newTask.priorityScore}/100.`,
      "success"
    );
  };

  const updateTaskDetails = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    await updateTask(user.uid, taskId, updates);
  };

  const toggleSubtaskStatus = async (taskId: string, subtaskId: string) => {
    if (!user) return;

    let targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const updatedBreakdown = targetTask.suggestedBreakdown.map((st) =>
      st.id === subtaskId
        ? { ...st, status: (st.status === "pending" ? "completed" : "pending") as "pending" | "completed" }
        : st
    );

    // Calculate progress fraction
    const completedCount = updatedBreakdown.filter((st) => st.status === "completed").length;
    const isCompleted = completedCount === updatedBreakdown.length;
    const nextStatus = isCompleted
      ? "completed"
      : completedCount > 0
      ? "in_progress"
      : "pending";

    const updates: Partial<Task> = {
      suggestedBreakdown: updatedBreakdown,
      status: nextStatus as Task["status"],
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    
    await updateTask(user.uid, taskId, updates);

    // Trigger completion sounds or success notices
    if (isCompleted && targetTask.status !== "completed") {
      triggerNotification("Task Finished!", `Awesome execution. "${targetTask.title}" is complete.`, "success");
    }
  };

  const deleteTaskById = async (taskId: string) => {
    if (!user) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await deleteTask(user.uid, taskId);
    triggerNotification("Task Deleted", "Task removed from database.", "info");
    
    if (activeFocusTask?.id === taskId) {
      endFocusSession();
    }
  };

  // ----------------------------------------------------
  // FOCUS TIMER CONTROLS
  // ----------------------------------------------------
  const startFocusSession = (task: Task) => {
    setActiveFocusTask(task);
    setIsFocusMode(true);
    triggerNotification("Focus Mode Started", `Tackling "${task.title}". Avoid distractions!`, "info");
  };

  const endFocusSession = () => {
    setActiveFocusTask(null);
    setIsFocusMode(false);
  };

  const logFocusSession = async (session: Omit<FocusSession, "id">) => {
    if (!user) return;
    const newSession: FocusSession = {
      ...session,
      id: `session-${Date.now()}`,
    };
    await saveFocusSession(user.uid, newSession);
    triggerNotification("Focus Logged", `Logged ${session.durationMinutes} minutes of focus time.`, "success");
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        tasks,
        notifications,
        settings,
        activeTab,
        theme,
        activeFocusTask,
        isFocusMode,
        signIn,
        signOut,
        navigateTo,
        createTask,
        updateTaskDetails,
        toggleSubtaskStatus,
        deleteTaskById,
        logFocusSession,
        triggerNotification,
        dismissNotification,
        updateSettings,
        toggleTheme,
        startFocusSession,
        endFocusSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
