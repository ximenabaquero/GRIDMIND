// ─── Track types ────────────────────────────────────────────────────────────

export type TrackType = "habit" | "effort" | "practice";

export interface HabitConfig {
  kind: "habit";
}

export interface EffortConfig {
  kind: "effort";
  totalSquares: number; // how many effort blocks the task needs
  deadline?: string;    // ISO date string
  subject?: string;
}

export interface PracticeConfig {
  kind: "practice";
  metricLabel: string;  // e.g. "BPM", "words", "km"
  metricUnit: string;
  hasTimer: boolean;
  hasNotes: boolean;
}

export type TrackConfig = HabitConfig | EffortConfig | PracticeConfig;

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  color: string;        // hex color
  icon: string;         // emoji
  weeklyTarget: number; // how many cells appear per week
  config: TrackConfig;
  createdAt: number;    // timestamp
  archivedAt?: number;
  order: number;        // display order in grid
}

// ─── Cell types ──────────────────────────────────────────────────────────────

export type CellStatus = "empty" | "done" | "ghost";

export interface Task {
  id: string;
  text: string;
  done: boolean;
}

export interface PracticeSession {
  duration: number;        // seconds
  metricStart?: number;
  metricEnd?: number;
  note?: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface Cell {
  id: string;              // `${trackId}_${weekId}_${dayIndex}`
  trackId: string;
  weekId: string;          // "2026-W11" (ISO week)
  dayIndex: number;        // 0=Mon … 6=Sun
  status: CellStatus;
  completedAt?: number;    // timestamp
  session?: PracticeSession;
  tasks?: Task[];
}

// ─── DayMood ─────────────────────────────────────────────────────────────────

export type MoodEmoji = "🔥" | "🙂" | "😐" | "😵‍💫" | "💀";

export interface DayMood {
  date: string;            // "2026-03-14"
  mood: MoodEmoji;
}

// ─── Week helpers ─────────────────────────────────────────────────────────────

/** Returns "YYYY-Www" for a given Date */
export function getWeekId(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Returns Monday Date for a given weekId */
export function getMondayOfWeek(weekId: string): Date {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  return monday;
}

/** Returns array of 7 dates (Mon–Sun) for a weekId */
export function getWeekDates(weekId: string): Date[] {
  const monday = getMondayOfWeek(weekId);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });
}

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Returns true if weekId `a` is strictly before weekId `b` (cross-year-safe) */
export function isWeekBefore(a: string, b: string): boolean {
  return getMondayOfWeek(a).getTime() < getMondayOfWeek(b).getTime();
}

/** Offset weekId by n weeks */
export function offsetWeek(weekId: string, n: number): string {
  const monday = getMondayOfWeek(weekId);
  monday.setUTCDate(monday.getUTCDate() + n * 7);
  return getWeekId(monday);
}
