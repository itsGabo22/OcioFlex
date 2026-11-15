import { invoke, isTauri } from "./tauri";
import { localGenerate } from "./engine";
import { bestHour, lastDays, startOfWeek, streakDays, thisWeek, todayTotals, DAY, type Session } from "./stats";
import { profileContext, targetFocusPct, type Profile } from "./profile";

export type Lang = "es" | "en";
export type BreakMood = "tired" | "restless" | "curious";
export type CoachOut = { insight: string; tweak: string };
export type BreaksOut = { ideas: { title: string; minutes: number; why: string }[] };
export type SplitOut = { blocks: { title: string; minutes: number }[] };

export type AiMap = { coach: CoachOut; breaks: BreaksOut; split: SplitOut };
export type AiFeature = keyof AiMap;
export type AiStatus = { mode: "live" | "local"; provider: string; model: string; configured: boolean };
export type AiErrorCode = "bad_request" | "key" | "model" | "rate_limited" | "server" | "timeout" | "network" | "shape" | "no_key" | "invalid_key" | "io";
export type AiResult<T> = { mode: "live" | "local"; data: T; fallback: boolean; error?: AiErrorCode };

/**
 * Flex. All provider traffic happens in the Rust core: the webview never sees the key, and
 * `ai_status` only returns a boolean `configured`. Outside Tauri (plain Chrome, review only)
 * the local engine is answered by its TypeScript port.
 */
export async function aiStatus(): Promise<AiStatus> {
  if (isTauri()) return invoke<AiStatus>("ai_status");
  return { mode: "local", provider: "gemini", model: "gemini-flash-latest", configured: false };
}

export async function aiGenerate<F extends AiFeature>(feature: F, payload: Record<string, unknown>, lang: Lang): Promise<AiResult<AiMap[F]>> {
  if (isTauri()) return invoke<AiResult<AiMap[F]>>("ai_generate", { feature, payload, lang });
  await new Promise((r) => setTimeout(r, 420));
  return { mode: "local", data: localGenerate(feature, payload, lang) as AiMap[F], fallback: false };
}

export const aiSetKey = (key: string) => invoke<AiStatus>("ai_set_key", { key });
export const aiClearKey = () => invoke<AiStatus>("ai_clear_key");
export const aiTest = () => invoke<AiStatus>("ai_test");

/* ───────── payloads: aggregated numbers + profile context, never names or logins ───────── */

export function coachPayload(sessions: Session[], profile: Profile, now = Date.now()) {
  const f = lastDays(sessions, "focus", 7, now);
  const r = lastDays(sessions, "rest", 7, now);
  const today = todayTotals(sessions, now);
  const week = thisWeek(sessions, "focus", now);
  const daysLeft = 7 - Math.round((now - startOfWeek(now)) / DAY - 0.5);
  return {
    days: f.map((d, i) => ({ date: new Date(d.ts).toISOString().slice(0, 10), focusMin: d.minutes, restMin: r[i].minutes })),
    todayFocusMin: today.focusMin,
    todayRestMin: today.restMin,
    weekFocusMin: week.reduce((a, d) => a + d.minutes, 0),
    daysLeftInWeek: Math.max(0, daysLeft),
    goalWeeklyMin: Math.round(profile.weeklyGoalH * 60),
    targetFocusPct: targetFocusPct(profile),
    streak: streakDays(sessions, now),
    bestHour: bestHour(sessions, now),
    sessionLen: profile.sessionLen,
    goals: profile.goals,
    obstacles: profile.obstacles,
    profile: profileContext(profile),
  };
}

export function breaksPayload(sessions: Session[], profile: Profile, mood: BreakMood, now = Date.now()) {
  const last = [...sessions].filter((s) => s.kind === "focus" && s.end > now - 6 * 3_600_000).sort((a, b) => b.end - a.end)[0];
  return {
    mood,
    hour: new Date(now).getHours(),
    focusedMin: last ? Math.round((last.end - last.start) / 60000) : 0,
    minutesFocusedToday: todayTotals(sessions, now).focusMin,
    tastes: profile.tastes,
    profile: profileContext(profile),
  };
}

export const splitPayload = (task: string, profile: Profile) => ({ task: task.trim().slice(0, 160), sessionLen: profile.sessionLen, profile: profileContext(profile) });
