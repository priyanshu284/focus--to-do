import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Task, FocusSession, UserSettings, UserProfile } from "./types";

// Firebase Config Template from Environment Variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if variables are valid Firebase configs (not undefined, empty, or placeholder)
const isFirebaseEnabled = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "" &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.includes("placeholder")
  );
};

let app;
let auth: any;
let firestore: any;

const isClient = typeof window !== "undefined";

if (isClient) {
  if (isFirebaseEnabled()) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      firestore = getFirestore(app);
      console.log("DeadlineOS: Connected to production Firebase cloud backend.");
    } catch (e) {
      console.warn("Failed to initialize Firebase, falling back to LocalStorage Database:", e);
      auth = null;
      firestore = null;
    }
  } else {
    console.log("DeadlineOS: Firebase keys missing. Operating in LocalStorage Sandbox mode.");
  }
}

// ----------------------------------------------------
// DEFAULT SETTINGS
// ----------------------------------------------------
const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  notificationsEnabled: true,
  calendarSyncEnabled: false,
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  focusPreferences: {
    workDuration: 25,
    breakDuration: 5,
  },
  aiPreferences: {
    autoSchedule: true,
    analysisDepth: "standard",
  },
};

// ----------------------------------------------------
// LOCALSTORAGE DATABASE FALLBACK ENGINE
// ----------------------------------------------------
const localDb = {
  getTasks: (): Task[] => {
    if (!isClient) return [];
    const data = localStorage.getItem("deadlineos_tasks");
    return data ? JSON.parse(data) : [];
  },
  saveTasks: (tasks: Task[]) => {
    if (!isClient) return;
    localStorage.setItem("deadlineos_tasks", JSON.stringify(tasks));
  },
  getSessions: (): FocusSession[] => {
    if (!isClient) return [];
    const data = localStorage.getItem("deadlineos_sessions");
    return data ? JSON.parse(data) : [];
  },
  saveSessions: (sessions: FocusSession[]) => {
    if (!isClient) return;
    localStorage.setItem("deadlineos_sessions", JSON.stringify(sessions));
  },
  getSettings: (): UserSettings => {
    if (!isClient) return DEFAULT_SETTINGS;
    const data = localStorage.getItem("deadlineos_settings");
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: UserSettings) => {
    if (!isClient) return;
    localStorage.setItem("deadlineos_settings", JSON.stringify(settings));
  },
  getUser: (): UserProfile | null => {
    if (!isClient) return null;
    const data = localStorage.getItem("deadlineos_user");
    return data ? JSON.parse(data) : null;
  },
  saveUser: (user: UserProfile | null) => {
    if (!isClient) return;
    if (user) {
      localStorage.setItem("deadlineos_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("deadlineos_user");
    }
  },
};

// ----------------------------------------------------
// PUBLIC AUTHENTICATION WRAPPER
// ----------------------------------------------------
export const loginWithGoogle = async (): Promise<UserProfile> => {
  if (auth && isFirebaseEnabled()) {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const profile: UserProfile = {
      uid: result.user.uid,
      email: result.user.email || "",
      displayName: result.user.displayName || "User",
      photoURL: result.user.photoURL || undefined,
    };
    return profile;
  } else {
    // Simulated Sandbox Login
    const sandboxUser: UserProfile = {
      uid: "sandbox-user-id",
      email: "sandbox@deadlineos.ai",
      displayName: "Productivity Champion",
      photoURL: undefined,
    };
    localDb.saveUser(sandboxUser);
    return sandboxUser;
  }
};

export const logout = async (): Promise<void> => {
  if (auth && isFirebaseEnabled()) {
    await signOut(auth);
  } else {
    localDb.saveUser(null);
  }
};

export const subscribeToAuth = (callback: (user: UserProfile | null) => void) => {
  if (!isClient) return () => {};

  if (auth && isFirebaseEnabled()) {
    return onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "User",
          photoURL: firebaseUser.photoURL || undefined,
        });
      } else {
        callback(null);
      }
    });
  } else {
    // Local Sandbox subscriber (runs on mount/change)
    const user = localDb.getUser();
    callback(user);
    // Return empty unsubscribe function
    return () => {};
  }
};

// ----------------------------------------------------
// PUBLIC FIRESTORE / LOCAL STORAGE DATABASE API
// ----------------------------------------------------

export const fetchTasks = async (userId: string): Promise<Task[]> => {
  if (firestore && isFirebaseEnabled()) {
    try {
      const colRef = collection(firestore, "users", userId, "tasks");
      const snap = await getDocs(colRef);
      const tasksList: Task[] = [];
      snap.forEach((docSnap) => {
        tasksList.push({ id: docSnap.id, ...docSnap.data() } as Task);
      });
      // Sort tasks by deadline ascending
      return tasksList.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } catch (e) {
      console.error("Firebase error, using local fallback: ", e);
      return localDb.getTasks();
    }
  } else {
    return localDb.getTasks();
  }
};

export const saveTask = async (userId: string, task: Task): Promise<void> => {
  if (firestore && isFirebaseEnabled()) {
    try {
      const docRef = doc(firestore, "users", userId, "tasks", task.id);
      await setDoc(docRef, task);
    } catch (e) {
      console.error("Firebase error, writing locally: ", e);
      const tasks = localDb.getTasks();
      const index = tasks.findIndex((t) => t.id === task.id);
      if (index > -1) {
        tasks[index] = task;
      } else {
        tasks.push(task);
      }
      localDb.saveTasks(tasks);
    }
  } else {
    const tasks = localDb.getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index > -1) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    localDb.saveTasks(tasks);
  }
};

export const updateTask = async (userId: string, taskId: string, updates: Partial<Task>): Promise<void> => {
  if (firestore && isFirebaseEnabled()) {
    try {
      const docRef = doc(firestore, "users", userId, "tasks", taskId);
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Firebase error, updating locally: ", e);
      const tasks = localDb.getTasks();
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index > -1) {
        tasks[index] = { ...tasks[index], ...updates };
        localDb.saveTasks(tasks);
      }
    }
  } else {
    const tasks = localDb.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index > -1) {
      tasks[index] = { ...tasks[index], ...updates };
      localDb.saveTasks(tasks);
    }
  }
};

export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  if (firestore && isFirebaseEnabled()) {
    try {
      const docRef = doc(firestore, "users", userId, "tasks", taskId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Firebase error, deleting locally: ", e);
      const tasks = localDb.getTasks().filter((t) => t.id !== taskId);
      localDb.saveTasks(tasks);
    }
  } else {
    const tasks = localDb.getTasks().filter((t) => t.id !== taskId);
    localDb.saveTasks(tasks);
  }
};

export const fetchFocusSessions = async (userId: string): Promise<FocusSession[]> => {
  if (firestore && isFirebaseEnabled()) {
    try {
      const colRef = collection(firestore, "users", userId, "sessions");
      const snap = await getDocs(colRef);
      const sessionsList: FocusSession[] = [];
      snap.forEach((docSnap) => {
        sessionsList.push({ id: docSnap.id, ...docSnap.data() } as FocusSession);
      });
      return sessionsList;
    } catch (e) {
      console.error("Firebase error, fetching sessions locally: ", e);
      return localDb.getSessions();
    }
  } else {
    return localDb.getSessions();
  }
};

export const saveFocusSession = async (userId: string, session: FocusSession): Promise<void> => {
  if (firestore && isFirebaseEnabled()) {
    try {
      const docRef = doc(firestore, "users", userId, "sessions", session.id);
      await setDoc(docRef, session);
    } catch (e) {
      console.error("Firebase error, writing session locally: ", e);
      const sessions = localDb.getSessions();
      sessions.push(session);
      localDb.saveSessions(sessions);
    }
  } else {
    const sessions = localDb.getSessions();
    sessions.push(session);
    localDb.saveSessions(sessions);
  }
};

export const fetchSettings = async (userId: string): Promise<UserSettings> => {
  if (firestore && isFirebaseEnabled()) {
    try {
      const docRef = doc(firestore, "users", userId, "config", "settings");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserSettings;
      } else {
        await setDoc(docRef, DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (e) {
      console.error("Firebase error, fetching settings locally: ", e);
      return localDb.getSettings();
    }
  } else {
    return localDb.getSettings();
  }
};

export const saveSettings = async (userId: string, settings: UserSettings): Promise<void> => {
  if (firestore && isFirebaseEnabled()) {
    try {
      const docRef = doc(firestore, "users", userId, "config", "settings");
      await setDoc(docRef, settings);
    } catch (e) {
      console.error("Firebase error, saving settings locally: ", e);
      localDb.saveSettings(settings);
    }
  } else {
    localDb.saveSettings(settings);
  }
};
