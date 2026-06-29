export interface SubTask {
  id: string;
  title: string;
  estimatedTime: number; // in hours
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'Work' | 'Personal' | 'Health' | 'Finance' | 'Education' | 'Other';
  deadline: string; // ISO format string
  estimatedTime: number; // in hours
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  notes: string;
  createdAt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  
  // AI Generated Properties
  priorityScore: number; // 0-100
  completionRisk: 'low' | 'medium' | 'high';
  riskExplanation: string;
  suggestedSlot: string; // recommended slot, e.g., "09:00 AM - 12:00 PM"
  suggestedBreakdown: SubTask[];
}

export interface FocusSession {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  durationMinutes: number;
  completedSubtasks: string[]; // List of subtask IDs completed
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actions?: {
    label: string;
    type: 'start_focus' | 'break_steps' | 'reschedule';
    payload?: any;
  }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: string;
  read: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  calendarSyncEnabled: boolean;
  workingHoursStart: string; // "09:00"
  workingHoursEnd: string; // "17:00"
  focusPreferences: {
    workDuration: number; // in minutes (e.g. 25)
    breakDuration: number; // in minutes (e.g. 5)
  };
  aiPreferences: {
    autoSchedule: boolean;
    analysisDepth: 'standard' | 'deep';
  };
}
