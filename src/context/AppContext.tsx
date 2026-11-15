"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { en, type Dict } from "@/locales/en";
import { es } from "@/locales/es";
import { loadValue, saveValue } from "@/lib/storage";
import { showWindow } from "@/lib/tauri";
import { makeSeed, type Session } from "@/lib/stats";
import { aiStatus, type AiStatus, type Lang } from "@/lib/ai";

export type Mood = "foco" | "ocio";
export type MediaKind = "game" | "video" | "music" | "book" | "other";
export type MediaItem = { id: string; kind: MediaKind; name: string; url: string };
export type ActiveTimer = { kind: "focus" | "rest"; startedAt: number; plannedMin: number; task: string; pausedAt: number | null; pausedTotal: number };
export type Toast = { id: number; message: string; tone: "default" | "success" | "error" };

const DICTS: Record<Lang, Dict> = { en, es: es as Dict };

const DEFAULT_MEDIA = (t: Dict): MediaItem[] => [
  { id: "m-game", kind: "game", name: t.rest.defaults.game, url: "steam://nav/games" },
  { id: "m-video", kind: "video", name: t.rest.defaults.video, url: "https://www.youtube.com" },
  { id: "m-music", kind: "music", name: t.rest.defaults.music, url: "https://open.spotify.com" },
  { id: "m-book", kind: "book", name: t.rest.defaults.book, url: "https://read.amazon.com" },
];

export const elapsedMs = (t: ActiveTimer, now: number) => Math.max(0, (t.pausedAt ?? now) - t.startedAt - t.pausedTotal);
export const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

interface Ctx {
  ready: boolean;
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
  mood: Mood;
  setMood: (m: Mood) => void;
  sessions: Session[];
  media: MediaItem[];
  saveMedia: (m: MediaItem) => void;
  removeMedia: (id: string) => void;
  resetDemoData: () => void;
  timer: ActiveTimer | null;
  startTimer: (kind: "focus" | "rest", plannedMin: number, task: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  finishTimer: () => void;
  discardTimer: () => void;
  justCompleted: number;
  toasts: Toast[];
  toast: (message: string, tone?: Toast["tone"]) => void;
  ai: AiStatus | null;
  refreshAi: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lang, setLangState] = useState<Lang>("en");
  const [mood, setMoodState] = useState<Mood>("foco");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [justCompleted, setJustCompleted] = useState(0);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const t = DICTS[lang];
  const timerRef = useRef<ActiveTimer | null>(null);
  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  const refreshAi = useCallback(() => {
    aiStatus().then(setAi).catch(() => setAi({ mode: "demo", provider: "gemini", model: "demo", configured: false }));
  }, []);

  /* hydrate from storage once */
  useEffect(() => {
    let alive = true;
    (async () => {
      const storedLang = await loadValue<Lang>("lang");
      const l: Lang = storedLang === "es" || storedLang === "en" ? storedLang : navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
      const m = (await loadValue<Mood>("mood")) ?? "foco";
      let s = await loadValue<Session[]>("sessions");
      if (!s) {
        s = makeSeed(DICTS[l].settings.data.seedTasks.split("|"));
        await saveValue("sessions", s);
      }
      const md = (await loadValue<MediaItem[]>("media")) ?? DEFAULT_MEDIA(DICTS[l]);
      const tm = (await loadValue<ActiveTimer | null>("timer")) ?? null;
      if (!alive) return;
      setLangState(l);
      setMoodState(m === "ocio" ? "ocio" : "foco");
      setSessions(s);
      setMedia(md);
      setTimer(tm);
      setReady(true);
    })();
    refreshAi();
    return () => {
      alive = false;
    };
  }, [refreshAi]);

  /* html attributes: lang + mood */
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.ctx = mood;
  }, [mood]);

  /* reveal the native window after first paint */
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => void showWindow()));
    return () => cancelAnimationFrame(id);
  }, [ready]);

  const toast = useCallback((message: string, tone: Toast["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, tone }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    void saveValue("lang", l);
  }, []);
  const setMood = useCallback((m: Mood) => {
    setMoodState(m);
    void saveValue("mood", m);
  }, []);

  const persistTimer = (next: ActiveTimer | null) => {
    setTimer(next);
    void saveValue("timer", next);
  };

  const pushSession = useCallback(
    (s: Session) => {
      setSessions((prev) => {
        const next = [...prev, s];
        void saveValue("sessions", next);
        return next;
      });
    },
    [],
  );

  const finishWith = useCallback(
    (tm: ActiveTimer, now: number) => {
      const end = tm.pausedAt ?? now;
      const worked = elapsedMs(tm, now);
      if (worked >= 15_000) {
        pushSession({ id: `s-${now}`, kind: tm.kind, start: end - worked, end, task: tm.task, plannedMin: tm.plannedMin });
        toast(tm.kind === "focus" ? DICTS[lang].toast.sessionSaved : DICTS[lang].toast.restSaved, "success");
      }
      setTimer(null);
      void saveValue("timer", null);
      setJustCompleted(now);
    },
    [lang, pushSession, toast],
  );

  /* auto-finish focus countdown */
  useEffect(() => {
    const id = setInterval(() => {
      const tm = timerRef.current;
      if (!tm || tm.kind !== "focus" || tm.pausedAt) return;
      if (elapsedMs(tm, Date.now()) >= tm.plannedMin * 60_000) {
        const capped = { ...tm, pausedAt: tm.startedAt + tm.pausedTotal + tm.plannedMin * 60_000 };
        finishWith(capped, Date.now());
      }
    }, 500);
    return () => clearInterval(id);
  }, [finishWith]);

  const value = useMemo<Ctx>(
    () => ({
      ready, lang, t, setLang, mood, setMood, sessions, media,
      saveMedia: (m) =>
        setMedia((prev) => {
          const next = prev.some((x) => x.id === m.id) ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m];
          void saveValue("media", next);
          return next;
        }),
      removeMedia: (id) =>
        setMedia((prev) => {
          const next = prev.filter((x) => x.id !== id);
          void saveValue("media", next);
          return next;
        }),
      resetDemoData: () => {
        const s = makeSeed(t.settings.data.seedTasks.split("|"));
        setSessions(s);
        void saveValue("sessions", s);
        persistTimer(null);
        toast(t.toast.dataReset, "success");
      },
      timer,
      startTimer: (kind, plannedMin, task) => persistTimer({ kind, startedAt: Date.now(), plannedMin, task, pausedAt: null, pausedTotal: 0 }),
      pauseTimer: () => timer && !timer.pausedAt && persistTimer({ ...timer, pausedAt: Date.now() }),
      resumeTimer: () => timer?.pausedAt && persistTimer({ ...timer, pausedTotal: timer.pausedTotal + (Date.now() - timer.pausedAt), pausedAt: null }),
      finishTimer: () => timer && finishWith(timer, Date.now()),
      discardTimer: () => persistTimer(null),
      justCompleted, toasts, toast, ai, refreshAi,
    }),
    [ready, lang, t, mood, sessions, media, timer, justCompleted, toasts, ai, setLang, setMood, toast, finishWith, refreshAi],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}

/** Re-renders at `ms` intervals while `active`; returns Date.now(). */
export function useNow(active: boolean, ms = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return now;
}
