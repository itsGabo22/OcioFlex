export type Occupation = "student" | "working" | "both" | "other";
export type Chronotype = "morning" | "afternoon" | "night";
export type FocusWindow = "early" | "midday" | "evening" | "late";
export type Goal = "focus" | "rest" | "balance" | "distractions" | "routine" | "burnout";
export type Obstacle = "distractions" | "procrastination" | "tiredness" | "phone" | "notifications" | "schedule";
export type Taste = "games" | "video" | "music" | "books" | "sports" | "outdoors" | "social" | "creative" | "cooking";
export type SessionLen = 25 | 45 | 60 | 90;

export const OCCUPATIONS: Occupation[] = ["student", "working", "both", "other"];
export const CHRONOTYPES: Chronotype[] = ["morning", "afternoon", "night"];
export const WINDOWS: FocusWindow[] = ["early", "midday", "evening", "late"];
export const GOALS: Goal[] = ["focus", "rest", "balance", "distractions", "routine", "burnout"];
export const OBSTACLES: Obstacle[] = ["distractions", "procrastination", "tiredness", "phone", "notifications", "schedule"];
export const TASTES: Taste[] = ["games", "video", "music", "books", "sports", "outdoors", "social", "creative", "cooking"];
export const SESSION_LENS: SessionLen[] = [25, 45, 60, 90];
export const WINDOW_START: Record<FocusWindow, number> = { early: 7, midday: 11, evening: 15, late: 20 };

export type Profile = {
  name: string;
  occupation: Occupation | null;
  focusH: number;
  leisureH: number;
  screenH: number;
  chronotype: Chronotype | null;
  window: FocusWindow | null;
  sessionLen: SessionLen;
  goals: Goal[];
  weeklyGoalH: number;
  obstacles: Obstacle[];
  tastes: Taste[];
  completed: boolean;
};

export const DEFAULT_PROFILE: Profile = {
  name: "",
  occupation: null,
  focusH: 4,
  leisureH: 3,
  screenH: 8,
  chronotype: null,
  window: null,
  sessionLen: 45,
  goals: [],
  weeklyGoalH: 20,
  obstacles: [],
  tastes: [],
  completed: false,
};

export const SAMPLE_PROFILE = (name: string): Profile => ({
  name,
  occupation: "both",
  focusH: 5,
  leisureH: 3,
  screenH: 9,
  chronotype: "morning",
  window: "early",
  sessionLen: 45,
  goals: ["balance", "distractions"],
  weeklyGoalH: 15,
  obstacles: ["phone", "notifications"],
  tastes: ["music", "games", "outdoors", "books"],
  completed: true,
});

/** Weekly goal suggested from a typical day: focus hours over five working days. */
export const suggestedWeekly = (focusH: number) => Math.max(2, Math.min(60, Math.round(focusH * 5)));

/** The focus share (%) the user is aiming for, from their typical day nudged by their goals. */
export function targetFocusPct(p: Profile): number {
  const total = p.focusH + p.leisureH;
  let pct = total > 0 ? (p.focusH / total) * 100 : 60;
  if (p.goals.includes("focus")) pct += 5;
  if (p.goals.includes("rest")) pct -= 10;
  if (p.goals.includes("burnout")) pct -= 10;
  if (p.goals.includes("balance")) pct = (pct + 60) / 2;
  return Math.round(Math.max(40, Math.min(80, pct)) / 5) * 5;
}

export function normalizeProfile(raw: unknown): Profile {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Profile>;
  const pick = <T,>(arr: readonly T[], v: unknown): T | null => (arr.includes(v as T) ? (v as T) : null);
  const many = <T,>(arr: readonly T[], v: unknown, max = 9): T[] => (Array.isArray(v) ? v.filter((x) => arr.includes(x)).slice(0, max) : []);
  const n = (v: unknown, lo: number, hi: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);
  return {
    name: typeof r.name === "string" ? r.name.slice(0, 40) : "",
    occupation: pick(OCCUPATIONS, r.occupation),
    focusH: n(r.focusH, 0, 16, DEFAULT_PROFILE.focusH),
    leisureH: n(r.leisureH, 0, 16, DEFAULT_PROFILE.leisureH),
    screenH: n(r.screenH, 0, 18, DEFAULT_PROFILE.screenH),
    chronotype: pick(CHRONOTYPES, r.chronotype),
    window: pick(WINDOWS, r.window),
    sessionLen: pick(SESSION_LENS, r.sessionLen) ?? 45,
    goals: many(GOALS, r.goals, 3),
    weeklyGoalH: n(r.weeklyGoalH, 1, 80, DEFAULT_PROFILE.weeklyGoalH),
    obstacles: many(OBSTACLES, r.obstacles),
    tastes: many(TASTES, r.tastes),
    completed: !!r.completed,
  };
}

/** Assistant context: the profile minus anything personal (the name stays on the device). */
export const profileContext = (p: Profile) => ({
  occupation: p.occupation,
  typicalDay: { focusH: p.focusH, leisureH: p.leisureH, screenH: p.screenH },
  chronotype: p.chronotype,
  focusWindow: p.window,
  sessionLen: p.sessionLen,
  goals: p.goals,
  weeklyGoalH: p.weeklyGoalH,
  obstacles: p.obstacles,
  tastes: p.tastes,
});

/** Quick-launch shortcuts seeded from leisure tastes (only the ones that open somewhere). */
export const TASTE_LINKS: Partial<Record<Taste, { kind: "game" | "video" | "music" | "book"; url: string }>> = {
  games: { kind: "game", url: "steam://nav/games" },
  video: { kind: "video", url: "https://www.youtube.com" },
  music: { kind: "music", url: "https://open.spotify.com" },
  books: { kind: "book", url: "https://openlibrary.org" },
};
