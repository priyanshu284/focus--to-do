"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Bell, Sun, Moon, Search, Sparkles, Check, Trash2 } from "lucide-react";

export default function Header() {
  const { user, notifications, dismissNotification, theme, toggleTheme } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [greeting, setGreeting] = useState("Good morning");
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update greeting based on system time
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good morning");
    else if (hours < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  if (!user) return null;

  const unreadNotifs = notifications.filter((n) => !n.read);
  const unreadCount = unreadNotifs.length;

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 z-10 shrink-0 select-none">
      {/* Greetings Block */}
      <div>
        <h2 className="text-sm font-semibold text-text-main flex items-center gap-1.5 leading-none">
          {greeting}, {user.displayName ? user.displayName.split(" ")[0] : "Champion"}
          <span className="animate-bounce inline-block text-xs">👋</span>
        </h2>
        <p className="text-[11px] text-text-secondary mt-1 font-medium">
          Let's crush your deadlines today.
        </p>
      </div>

      {/* Global search & Actions */}
      <div className="flex items-center gap-4">
        {/* Mock Search Bar */}
        <div className="relative w-64 max-md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search tasks, timeline..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-border bg-background text-xs text-text-main outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
          className="p-2 rounded-lg border border-border hover:bg-background text-text-secondary hover:text-text-main transition-colors cursor-pointer"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Dropdown Container */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg border border-border hover:bg-background text-text-secondary hover:text-text-main transition-colors cursor-pointer relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-danger text-[9px] font-bold text-white flex items-center justify-center border-2 border-card animate-pulse-subtle">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg shadow-text-main/5 py-1 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => notifications.forEach((n) => dismissNotification(n.id))}
                    className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-64 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Sparkles className="h-6 w-6 text-primary/30 mx-auto mb-2" />
                    <p className="text-[11px] font-medium text-text-secondary">
                      No notifications yet
                    </p>
                    <p className="text-[9px] text-text-secondary/70 mt-0.5">
                      AI planning updates will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 transition-colors ${notif.read ? "opacity-60 bg-transparent" : "bg-primary/5"}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[11px] font-bold text-text-main">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={() => dismissNotification(notif.id)}
                            className="p-0.5 text-text-secondary hover:text-primary rounded cursor-pointer"
                            title="Dismiss"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-text-secondary leading-relaxed mt-1">
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-text-secondary/60 mt-1 block">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Mini Profile */}
        <div className="h-8 w-8 rounded-full border border-border overflow-hidden select-none bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase cursor-pointer">
          {user.photoURL ? (
            <img src={user.photoURL} alt="User Avatar" className="h-full w-full object-cover" />
          ) : (
            <span>{user.displayName ? user.displayName[0] : user.email[0]}</span>
          )}
        </div>
      </div>
    </header>
  );
}
