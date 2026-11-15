export type SessionKind = "focus" | "rest";
export type Session = { id: string; kind: SessionKind; start: number; end: number; task: string; plannedMin: number; seed?: boolean };

export const DAY = 86_400_000;

export const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
/** Monday 00:00 of the week containing `ts`. */
export const startOfWeek = (ts: number) => {
  const s = startOfDay(ts);
  return s - ((new Date(s).getDay() + 6) % 7) * DAY;
};
export const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
export const minutesOf = (s: Session) => Math.max(0, Math.round((s.end - s.start) / 60000));

export function perDay(sessions: Session[], kind: SessionKind): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.kind !== kind) continue;
    const k = dayKey(s.start);
    map.set(k, (map.get(k) ?? 0) + minutesOf(s));
  }
  return map;
}

export function lastDays(sessions: Session[], kind: SessionKind, n: number, now = Date.now()) {
  const map = perDay(sessions, kind);
  const base = startOfDay(now);
  return Array.from({ length: n }, (_, i) => {
    const ts = base - (n - 1 - i) * DAY;
    return { ts, minutes: map.get(dayKey(ts)) ?? 0 };
  });
}

/** Monday→Sunday of the current week, future days flagged. */
export function thisWeek(sessions: Session[], kind: SessionKind, now = Date.now()) {
  const map = perDay(sessions, kind);
  const mon = startOfWeek(now);
  const today = startOfDay(now);
  return Array.from({ length: 7 }, (_, i) => {
    const ts = mon + i * DAY;
    return { ts, minutes: map.get(dayKey(ts)) ?? 0, future: ts > today, today: ts === today };
  });
}

export function todayTotals(sessions: Session[], now = Date.now()) {
  const k = dayKey(now);
  const list = sessions.filter((s) => dayKey(s.start) === k);
  const focus = list.filter((s) => s.kind === "focus");
  return {
    focusMin: focus.reduce((a, s) => a + minutesOf(s), 0),
    restMin: list.filter((s) => s.kind === "rest").reduce((a, s) => a + minutesOf(s), 0),
    focusSessions: focus.sort((a, b) => a.start - b.start),
  };
}

export function streakDays(sessions: Session[], now = Date.now()) {
  const map = perDay(sessions, "focus");
  let n = 0;
  let ts = startOfDay(now);
  if (!(map.get(dayKey(ts)) ?? 0)) ts -= DAY; // today may still be empty
  while ((map.get(dayKey(ts)) ?? 0) > 0) {
    n++;
    ts -= DAY;
  }
  return n;
}

export function bestDay(sessions: Session[]) {
  let best: { ts: number; minutes: number } | null = null;
  const seen = new Map<string, number>();
  for (const s of sessions) if (s.kind === "focus") seen.set(dayKey(s.start), startOfDay(s.start));
  const map = perDay(sessions, "focus");
  for (const [k, ts] of seen) {
    const minutes = map.get(k) ?? 0;
    if (!best || minutes > best.minutes) best = { ts, minutes };
  }
  return best;
}

/** Hour of day with the most focus minutes over the last 28 days, or null with no data. */
export function bestHour(sessions: Session[], now = Date.now()): number | null {
  const from = startOfDay(now) - 27 * DAY;
  const byHour = new Array(24).fill(0);
  for (const s of sessions) if (s.kind === "focus" && s.start >= from) byHour[new Date(s.start).getHours()] += minutesOf(s);
  const max = Math.max(...byHour);
  return max > 0 ? byHour.indexOf(max) : null;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 14 days of believable history for the example profile ONLY (flagged `seed: true`).
 * Real accounts start empty. Deterministic per calendar day.
 */
export function makeSeed(tasks: string[], now = Date.now(), days = 14): Session[] {
  const out: Session[] = [];
  const base = startOfDay(now);
  for (let back = days - 1; back >= 1; back--) {
    const dayTs = base - back * DAY;
    const rnd = mulberry32(Math.floor(dayTs / DAY) * 7919);
    const dow = new Date(dayTs).getDay();
    const weekend = dow === 0 || dow === 6;
    const count = weekend ? (rnd() < 0.5 ? 1 : 0) : 1 + Math.floor(rnd() * 3.4);
    let cursor = dayTs + (8 + Math.floor(rnd() * 3)) * 3_600_000 + Math.floor(rnd() * 4) * 15 * 60_000;
    for (let i = 0; i < count; i++) {
      const mins = [25, 45, 45, 60, 90][Math.floor(rnd() * 5)];
      const start = cursor;
      const end = start + mins * 60_000;
      out.push({ id: `seed-f-${dayTs}-${i}`, kind: "focus", start, end, task: tasks[Math.floor(rnd() * tasks.length)], plannedMin: mins, seed: true });
      const rest = [10, 15, 20, 30][Math.floor(rnd() * 4)];
      out.push({ id: `seed-r-${dayTs}-${i}`, kind: "rest", start: end + 5 * 60_000, end: end + (5 + rest) * 60_000, task: "", plannedMin: 0, seed: true });
      cursor = end + (rest + 40) * 60_000;
    }
  }
  // today: two finished blocks before now, so the example never opens on an empty day
  const tEnd1 = now - 25 * 60_000;
  const tEnd0 = tEnd1 - 75 * 60_000;
  const mk = (end: number, mins: number, i: number): Session => ({ id: `seed-t-${i}`, kind: "focus", start: end - mins * 60_000, end, task: tasks[(i * 3 + 1) % tasks.length], plannedMin: mins, seed: true });
  const todayBlocks = [mk(tEnd0, 45, 0), mk(tEnd1, 45, 1)].filter((s) => s.start >= base);
  const restBlock: Session = { id: "seed-t-r", kind: "rest", start: tEnd1 + 5 * 60_000, end: tEnd1 + 20 * 60_000, task: "", plannedMin: 0, seed: true };
  return [...out, ...todayBlocks, ...(todayBlocks.length ? [restBlock] : [])];
}
