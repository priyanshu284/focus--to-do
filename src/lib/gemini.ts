import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task, SubTask, ChatMessage } from "./types";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const isGeminiEnabled = () => {
  return !!(geminiApiKey && geminiApiKey !== "" && !geminiApiKey.includes("placeholder"));
};

let genAI: any = null;

if (isGeminiEnabled()) {
  try {
    genAI = new GoogleGenerativeAI(geminiApiKey!);
  } catch (e) {
    console.error("Failed to initialize GoogleGenerativeAI:", e);
  }
}

// ----------------------------------------------------
// LOCAL RULE-BASED SMART PRODUCTIVITY ENGINE (FALLBACK)
// ----------------------------------------------------

// Generate custom subtasks based on task title and category
const generateLocalSubtasks = (title: string, category: string): SubTask[] => {
  const t = title.toLowerCase();
  const cat = category.toLowerCase();
  
  let subtaskTitles: string[] = [];
  
  if (t.includes("build") || t.includes("develop") || t.includes("create") || t.includes("code") || t.includes("hackathon")) {
    subtaskTitles = [
      "Requirements & Architecture Plan",
      "UI/UX Design Mockup",
      "Database Schema & Backend Setup",
      "Frontend Core Interface Development",
      "Feature Integration & Core Logic",
      "Testing, Debugging & QA Checks",
      "Deployment & Hosting Setup",
      "Final Project Presentation & Documentation"
    ];
  } else if (t.includes("write") || t.includes("essay") || t.includes("report") || t.includes("paper") || t.includes("blog")) {
    subtaskTitles = [
      "Source Research & Information Gathering",
      "Outline Key Sections & Arguments",
      "Draft Introduction & Background",
      "Write Core Body Paragraphs",
      "Draft Summary & Future Outlook",
      "Self-Review & Proofreading",
      "Add References & Bibliography",
      "Format Check & Export Draft"
    ];
  } else if (t.includes("study") || t.includes("exam") || t.includes("test") || t.includes("learn") || t.includes("prepare")) {
    subtaskTitles = [
      "Gather Syllabus & Lecture Notes",
      "Summarize Key Chapters & Formulas",
      "Create Flashcards for Active Recall",
      "Solve Practice Problems & Mock Exams",
      "Review Incorrect Answers & Hard Concepts",
      "Group Discussion or Peer Teaching Session",
      "Final Quick Study Sheet Review",
      "Mental Readiness & Rest Preparation"
    ];
  } else if (cat === "health" || t.includes("workout") || t.includes("run") || t.includes("gym")) {
    subtaskTitles = [
      "Define Fitness Goal & Duration",
      "Prepare Gear, Hydration & Nutrition",
      "Warm-up & Joint Mobility Drills",
      "Execute Core Workout Session",
      "Cool-down & Core Stretching",
      "Log Session Metrics & Feel Check"
    ];
  } else if (cat === "finance" || t.includes("tax") || t.includes("budget") || t.includes("invoice")) {
    subtaskTitles = [
      "Collect Invoices, Receipts & Bank Statements",
      "Categorize Expenditures & Income Sources",
      "Cross-Reference Items against Budget Goals",
      "Calculate Net Balances / Tax Obligations",
      "Finalize Reports & Schedule Payments",
      "Archive Records safely for compliance"
    ];
  } else {
    // Generic fallback breakdown
    subtaskTitles = [
      "Define Project Scope & Checklist Items",
      "Gather Required Files & References",
      "Execute Initial Working Phase",
      "Execute Intermediate Working Phase",
      "Review Work & Correct Discrepancies",
      "Finalize Work & Submit/Complete"
    ];
  }

  // Build SubTask array with estimated times proportional to the main task
  return subtaskTitles.map((stTitle, index) => {
    let subTaskPriority: "low" | "medium" | "high" = "medium";
    if (index === 0 || index === subtaskTitles.length - 1) subTaskPriority = "low";
    if (index >= 2 && index <= 4) subTaskPriority = "high";

    return {
      id: `subtask-${Date.now()}-${index}`,
      title: stTitle,
      estimatedTime: 0.25, // placeholder fraction of hours
      status: "pending",
      priority: subTaskPriority
    };
  });
};

// Calculate priority score (0-100) based on deadline and initial priority
const calculateLocalPriorityScore = (
  deadlineStr: string,
  priority: "low" | "medium" | "high" | "urgent",
  estimatedTime: number
): { score: number; risk: "low" | "medium" | "high"; explanation: string; suggestedSlot: string } => {
  const now = new Date();
  const deadline = new Date(deadlineStr);
  const timeDiffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  let baseScore = 20;
  if (priority === "medium") baseScore = 45;
  if (priority === "high") baseScore = 70;
  if (priority === "urgent") baseScore = 90;

  // Urgency multiplier based on remaining time
  let urgencyBonus = 0;
  if (timeDiffHours <= 0) {
    urgencyBonus = 30; // Overdue
  } else if (timeDiffHours <= 12) {
    urgencyBonus = 25;
  } else if (timeDiffHours <= 24) {
    urgencyBonus = 20;
  } else if (timeDiffHours <= 48) {
    urgencyBonus = 12;
  } else if (timeDiffHours <= 168) {
    urgencyBonus = 5; // within 1 week
  }

  // Workload complexity adjustment
  const complexityBonus = Math.min(10, Math.floor(estimatedTime / 2));

  const totalScore = Math.min(100, Math.max(5, baseScore + urgencyBonus + complexityBonus));

  // Risk calculation
  let risk: "low" | "medium" | "high" = "low";
  let explanation = "";
  
  if (timeDiffHours <= 0) {
    risk = "high";
    explanation = "Task deadline has already passed. Immediate completion is required to mitigate delay impact.";
  } else if (estimatedTime > timeDiffHours) {
    risk = "high";
    explanation = `High risk! This task requires an estimated ${estimatedTime} hours of active work, but there are only ${Math.round(timeDiffHours)} hours remaining before the deadline.`;
  } else if (estimatedTime > timeDiffHours * 0.5) {
    risk = "high";
    explanation = `High risk! You need ${estimatedTime} hours of work. Considering sleeping, breaks, and daily routines, you do not have enough productive hours left before the deadline.`;
  } else if (estimatedTime > timeDiffHours * 0.2) {
    risk = "medium";
    explanation = `Medium risk. The deadline is close (in ${Math.round(timeDiffHours)} hours). You have enough time if you initiate work soon and avoid distractions.`;
  } else {
    risk = "low";
    explanation = `Low risk. The deadline is comfortable (${Math.round(timeDiffHours / 24)} days away). You have ample buffer time to complete the work.`;
  }

  // Suggested scheduling time slots
  let suggestedSlot = "09:00 AM - 11:00 AM";
  const deadlineHour = deadline.getHours();
  if (deadlineHour < 12) {
    suggestedSlot = "08:00 AM - 10:00 AM (Early morning focus)";
  } else if (deadlineHour >= 12 && deadlineHour < 17) {
    suggestedSlot = "10:30 AM - 01:00 PM (Mid-day session)";
  } else {
    suggestedSlot = "02:00 PM - 04:30 PM (Peak afternoon focus)";
  }

  return {
    score: totalScore,
    risk,
    explanation,
    suggestedSlot
  };
};

// ----------------------------------------------------
// DYNAMIC AI COACH LOGIC (LOCAL CONTEXT ENGINE)
// ----------------------------------------------------
export const getLocalCoachResponse = (message: string, currentTasks: Task[]): ChatMessage => {
  const m = message.toLowerCase();
  const pendingTasks = currentTasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  
  // Sort pending tasks by priority score descending
  const sortedTasks = [...pendingTasks].sort((a, b) => b.priorityScore - a.priorityScore);

  let text = "";
  let actions: any[] = [];

  if (pendingTasks.length === 0) {
    text = "Great job! You have no pending tasks on your plate right now. You are fully caught up. Use this time to rest, or plan your next major milestones. If you want to start a new project, let me know!";
    return {
      id: `ai-msg-${Date.now()}`,
      sender: "ai",
      text,
      timestamp: new Date().toISOString()
    };
  }

  const topTask = sortedTasks[0];

  if (m.includes("what should i do next") || m.includes("suggest") || m.includes("recommend") || m.includes("next task")) {
    const timeDiffHours = (new Date(topTask.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    const deadlineText = timeDiffHours <= 24 ? "tomorrow" : `on ${new Date(topTask.deadline).toLocaleDateString()}`;

    text = `Based on your current workload, I highly recommend starting **"${topTask.title}"** next.
    
**Why this task?**
- **Priority Score**: ${topTask.priorityScore}/100 (Highest in your backlog)
- **Time Required**: ~${topTask.estimatedTime} hours
- **Deadline**: Due ${deadlineText}
- **Status Assessment**: ${topTask.riskExplanation}

Let's boot up Focus Mode to tackle the first subtask immediately.`;

    actions = [
      { label: "Start Focus Session", type: "start_focus", payload: { taskId: topTask.id } },
      { label: "Break Task Into Steps", type: "break_steps", payload: { taskId: topTask.id } }
    ];
  } else if (m.includes("break") || m.includes("subtask") || m.includes("steps")) {
    // Break down top or specific task
    const matchedTask = sortedTasks.find(t => m.includes(t.title.toLowerCase())) || topTask;
    
    text = `Sure, here is the AI-recommended breakdown to conquer **"${matchedTask.title}"** without feeling overwhelmed:
    
${matchedTask.suggestedBreakdown.map((st, idx) => `${idx + 1}. **${st.title}** (${st.priority} priority)`).join("\n")}

By focusing on one single piece at a time, we build positive momentum. Which step should we focus on first?`;

    actions = [
      { label: "Start Focus Session", type: "start_focus", payload: { taskId: matchedTask.id } }
    ];
  } else if (m.includes("cannot finish") || m.includes("delay") || m.includes("overwhelmed") || m.includes("postpone") || m.includes("reschedule")) {
    // Rescheduling advice
    text = `I understand. Productivity is about sustainable focus, not burning out. Let's optimize your schedule.
    
Looking at your queue:
1. I suggest moving low-priority tasks (like those marked 'low' or with distant deadlines) to later in the week.
2. We can split **"${topTask.title}"** into two shorter sessions: one focusing on design/setup today, and implementation tomorrow.
3. This creates a buffer of ${Math.round(topTask.estimatedTime * 0.5)} hours in your schedule today.

Would you like me to adjust the suggested time slots for your active tasks?`;

    actions = [
      { label: "Reschedule My Work", type: "reschedule", payload: { taskId: topTask.id } }
    ];
  } else {
    // Generic friendly productivity response
    text = `Hello! I'm your DeadlineOS AI Coach. I specialize in analyzing your active task list and helping you execute them.
    
Right now, you have **${pendingTasks.length} pending tasks** with an estimated focus budget of **${pendingTasks.reduce((sum, t) => sum + t.estimatedTime, 0)} hours**.
Your highest-urgency item is **"${topTask.title}"** (${topTask.priorityScore}/100 priority).

Ask me questions like:
- *"What should I do next?"*
- *"Help me break down my work"*
- *"I'm running out of time, what do I do?"*`;

    actions = [
      { label: "What should I do next?", type: "start_focus", payload: { taskId: topTask.id } }
    ];
  }

  return {
    id: `ai-msg-${Date.now()}`,
    sender: "ai",
    text,
    timestamp: new Date().toISOString(),
    actions
  };
};

// ----------------------------------------------------
// MAIN DYNAMIC GENERATION WRAPPER
// ----------------------------------------------------
export const analyzeTaskWithAI = async (
  title: string,
  description: string,
  category: "Work" | "Personal" | "Health" | "Finance" | "Education" | "Other",
  deadline: string,
  estimatedTime: number,
  priority: "low" | "medium" | "high" | "urgent"
): Promise<{
  priorityScore: number;
  completionRisk: "low" | "medium" | "high";
  riskExplanation: string;
  suggestedSlot: string;
  suggestedBreakdown: SubTask[];
}> => {
  // If Gemini SDK is initialized, run remote LLM calls
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are the AI engine of DeadlineOS, a premium productivity SaaS.
Analyze this newly created task and output a STRICT JSON object.

Task Details:
- Title: "${title}"
- Description: "${description}"
- Category: "${category}"
- Deadline: "${deadline}"
- Active Work Hours Needed: ${estimatedTime} hours
- Priority Level: "${priority}"
- Current Date/Time: "${new Date().toISOString()}"

Calculate:
1. priorityScore: A number from 0-100 reflecting urgency and importance.
2. completionRisk: "low", "medium", or "high". High risk means work time exceeds remaining hours or is very tight.
3. riskExplanation: A clear 1-2 sentence explanation of why the risk is rated this way based on available time.
4. suggestedSlot: Recommended work slot (e.g. "09:00 AM - 11:30 AM (Peak focus)").
5. suggestedBreakdown: An array of 4-8 subtasks. Each subtask MUST have fields: "title" (string), "estimatedTime" (number in hours), "priority" ("low" | "medium" | "high").

Format output strictly as this JSON structure:
{
  "priorityScore": number,
  "completionRisk": "low" | "medium" | "high",
  "riskExplanation": "explanation text",
  "suggestedSlot": "time text",
  "suggestedBreakdown": [
    { "title": "subtask title", "estimatedTime": number, "priority": "low" | "medium" | "high" }
  ]
}

DO NOT wrap JSON in backticks, markdown code blocks, or additional text. Return raw JSON.`;

      const response = await model.generateContent(prompt);
      const resText = response.response.text().trim();
      
      // Clean potential JSON markdown wraps
      const cleanJson = resText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const aiData = JSON.parse(cleanJson);
      
      // Transform subtasks to include IDs and pending status
      const suggestedBreakdown = aiData.suggestedBreakdown.map((st: any, index: number) => ({
        id: `subtask-${Date.now()}-${index}`,
        title: st.title,
        estimatedTime: st.estimatedTime || 0.5,
        status: "pending",
        priority: st.priority || "medium"
      }));

      return {
        priorityScore: aiData.priorityScore || 50,
        completionRisk: aiData.completionRisk || "low",
        riskExplanation: aiData.riskExplanation || "Standard queue priority.",
        suggestedSlot: aiData.suggestedSlot || "10:00 AM - 12:00 PM",
        suggestedBreakdown
      };
    } catch (error) {
      console.warn("Gemini API call failed or parsed incorrectly, executing local algorithm fallback: ", error);
    }
  }

  // Fallback to local deterministic algorithm
  const localAnalysis = calculateLocalPriorityScore(deadline, priority, estimatedTime);
  const localSubtasks = generateLocalSubtasks(title, category);
  
  // Adjust subtask durations relative to total estimated time
  const subtaskTimeSlice = estimatedTime / localSubtasks.length;
  const calibratedSubtasks = localSubtasks.map(st => ({
    ...st,
    estimatedTime: Number(subtaskTimeSlice.toFixed(2))
  }));

  // Simulate short delay for premium AI feel
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    priorityScore: localAnalysis.score,
    completionRisk: localAnalysis.risk,
    riskExplanation: localAnalysis.explanation,
    suggestedSlot: localAnalysis.suggestedSlot,
    suggestedBreakdown: calibratedSubtasks
  };
};

export const getCoachResponse = async (
  message: string,
  currentTasks: Task[]
): Promise<ChatMessage> => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const activeTasksStr = currentTasks
        .filter((t) => t.status === "pending" || t.status === "in_progress")
        .map((t) => `- Title: "${t.title}", Score: ${t.priorityScore}, Deadline: ${t.deadline}, Work Needed: ${t.estimatedTime}h, Risk: ${t.completionRisk}`)
        .join("\n");

      const prompt = `You are the AI Productivity Coach for DeadlineOS. Your name is CoachOS.
You help users complete their work before deadlines.
You are NOT a general chatbot. You ONLY talk about the user's tasks and helping them optimize schedule, beat procrastination, and do focused work.
Be concise, clear, and highly encouraging, using professional, modern tone (like Linear or Vercel style).

Active Task Backlog:
${activeTasksStr || "No pending tasks."}

User message: "${message}"

Formulate a response. If appropriate, suggest 1 or 2 actions.
Output a STRICT JSON object in this format:
{
  "text": "Your markdown formatted advice. Keep it to 2-3 short paragraphs, bullet points are great.",
  "actions": [
    { "label": "Start Focus Session", "type": "start_focus", "payload": { "taskId": "ID of task to focus on" } }
  ]
}

Available Action Types: "start_focus" (starts focus timer), "break_steps" (shows subtasks breakdown), "reschedule" (proposes rescheduling).
Ensure "payload" contains "taskId" pointing to a valid task from the backlog if referencing a specific task.
DO NOT wrap in backticks or markdown, return raw JSON.`;

      const response = await model.generateContent(prompt);
      const resText = response.response.text().trim();
      const cleanJson = resText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        id: `ai-msg-${Date.now()}`,
        sender: "ai",
        text: parsed.text,
        timestamp: new Date().toISOString(),
        actions: parsed.actions || []
      };
    } catch (e) {
      console.warn("Gemini Chat failed, executing local chat handler:", e);
    }
  }

  // Local fallback
  return getLocalCoachResponse(message, currentTasks);
};
