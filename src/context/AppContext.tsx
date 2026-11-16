"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { en, type Dict } from "@/locales/en";
import { es } from "@/locales/es";
import { loadPrefs, loadUserData, savePref, saveUserData } from "@/lib/data";
import { lockDownWebview, showWindow } from "@/lib/tauri";
import { makeSeed, type Session } from "@/lib/stats";
import { aiStatus, type AiStatus, type Lang } from "@/lib/ai";
import { authChangePassword, authDeleteAccount, authLogin, authLogout, authRegister, authSampleProfile, authSession, type User } from "@/lib/auth";
import { DEFAULT_PROFILE, SAMPLE_PROFILE, TASTE_LINKS, normalizeProfile, type Profile } from "@/lib/profile";

export type Mood = "foco" | "ocio";
export type MediaKind = "game" | "video" | "music" | "book" | "other";
export type MediaItem = { id: string; kind: MediaKind; name: string; url: string };
export type ActiveTimer = { kind: "focus" | "rest"; startedAt: number; plannedMin: number; task: string; pausedAt: number | null; pausedTotal: number };
export type Toast = { id: number; message: string; tone: "default" | "success" | "error" };
export type AuthState = "checking" | "out" | "in";

const DICTS: Record<Lang, Dict> = { en, es };

/** Shortcuts seeded from leisure tastes; a sensible trio when none of the tastes opens anywhere. */
export function mediaFromTastes(p: Profile, t: Dict): MediaItem[] {
  const out: MediaItem[] = [];
  for (const taste of p.tastes) {
    const link = TASTE_LINKS[taste];
    if (link) out.push({ id: `m-${taste}`, kind: link.kind, name: t.rest.defaults[link.kind], url: link.url });
  }
  if (out.length) return out;
  return (["music", "video", "book"] as const).map((k) => ({ id: `m-${k}`, kind: k, name: t.rest.defaults[k], url: TASTE_LINKS[k === "book" ? "books" : k]!.url }));
}

export const elapsedMs = (t: ActiveTimer, now: number) => Math.max(0, (t.pausedAt ?? now) - t.startedAt - t.pausedTotal);
export const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

interface Ctx {
  prefsReady: boolean;
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
  mood: Mood;
  setMood: (m: Mood) => void;
  savedMood: Mood;

  auth: AuthState;
  user: User | null;
  dataReady: boolean;
  register: (login: string, name: string, password: string, remember: boolean) => Promise<User>;
  login: (login: string, password: string, remember: boolean) => Promise<User>;
  enterSample: () => Promise<User>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;

  profile: Profile;
  saveProfile: (p: Profile) => void;
  completeOnboarding: (p: Profile) => void;
  redoOnboarding: () => void;
  tutorialDone: boolean;
  tourOpen: boolean;
  startTour: () => void;
  endTour: () => void;
  ui: { rail?: boolean };
  setUi: (u: { rail?: boolean }) => void;

  sessions: Session[];
  media: MediaItem[];
  saveMedia: (m: MediaItem) => void;
  removeMedia: (id: string) => void;
  seedData: () => void;
  clearData: () => void;
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
  const [prefsReady, setPrefsReady] = useState(false);
  const [lang, setLangState] = useState<Lang>("en");
  const [mood, setMoodState] = useState<Mood>("foco");
  const [savedMood, setSavedMood] = useState<Mood>("foco");
  const [auth, setAuth] = useState<AuthState>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [tutorialDone, setTutorialDone] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [ui, setUiState] = useState<{ rail?: boolean }>({});
  const [sessions, setSessions] = useState<Session[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [justCompleted, setJustCompleted] = useState(0);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const t = DICTS[lang];
  const tRef = useRef(t);
  const timerRef = useRef<ActiveTimer | null>(null);
  useEffect(() => {
    timerRef.current = timer;
    tRef.current = t;
  }, [timer, t]);

  const refreshAi = useCallback(() => {
    aiStatus().then(setAi).catch(() => setAi({ mode: "local", provider: "gemini", model: "gemini-flash-latest", configured: false }));
  }, []);

  /** Load one user's namespace into state. */
  async function adopt(u: User, init?: { sampleFresh?: boolean }) {
    setDataReady(false);
    let doc = await loadUserData();
    const tt = tRef.current;
    if (init?.sampleFresh || (u.sample && !doc.seeded)) {
      const p = SAMPLE_PROFILE(u.displayName);
      doc = { sessions: makeSeed(tt.settings.data.seedTasks.split("|")), profile: p, media: mediaFromTastes(p, tt), tutorial: { done: false }, seeded: true, timer: null };
      await saveUserData(doc);
    }
    const prof = normalizeProfile(doc.profile);
    setProfile(prof.name ? prof : { ...prof, name: u.displayName });
    setSessions(Array.isArray(doc.sessions) ? (doc.sessions as Session[]) : []);
    setMedia(Array.isArray(doc.media) ? (doc.media as MediaItem[]) : []);
    setTimer((doc.timer as ActiveTimer | null) ?? null);
    setTutorialDone(!!(doc.tutorial as { done?: boolean } | undefined)?.done);
    setUiState((doc.ui as { rail?: boolean }) ?? {});
    setUser(u);
    setAuth("in");
    setDataReady(true);
  }

  /* device prefs + remembered session, in parallel with the splash */
  useEffect(() => {
    let alive = true;
    lockDownWebview();
    (async () => {
      const p = await loadPrefs();
      if (!alive) return;
      const l: Lang = p.lang === "es" || p.lang === "en" ? p.lang : navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
      const m: Mood = p.mood === "ocio" ? "ocio" : "foco";
      setLangState(l);
      setMoodState(m);
      setSavedMood(m);
      setPrefsReady(true);
      try {
        const u = await authSession();
        if (!alive) return;
        if (u) await adopt(u);
        else setAuth("out");
      } catch {
        if (alive) setAuth("out");
      }
    })();
    refreshAi();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearUserState = () => {
    setUser(null);
    setAuth("out");
    setDataReady(false);
    setSessions([]);
    setMedia([]);
    setTimer(null);
    setProfile(DEFAULT_PROFILE);
    setTutorialDone(false);
    setTourOpen(false);
  };

  /* html attributes: lang + mood */
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.ctx = mood;
  }, [mood]);

  /* reveal the native window after the first painted frame (the splash covers boot) */
  useEffect(() => {
    if (!prefsReady) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => void showWindow()));
    return () => cancelAnimationFrame(id);
  }, [prefsReady]);

  const toast = useCallback((message: string, tone: Toast["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3600);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    void savePref("lang", l);
  }, []);
  const setMood = useCallback((m: Mood) => {
    setMoodState(m);
    setSavedMood(m);
    void savePref("mood", m);
  }, []);

  const persistTimer = (next: ActiveTimer | null) => {
    setTimer(next);
    void saveUserData({ timer: next });
  };

  const pushSession = useCallback((s: Session) => {
    setSessions((prev) => {
      const next = [...prev, s];
      void saveUserData({ sessions: next });
      return next;
    });
  }, []);

  const finishWith = useCallback(
    (tm: ActiveTimer, now: number) => {
      const end = tm.pausedAt ?? now;
      const worked = elapsedMs(tm, now);
      if (worked >= 15_000) {
        pushSession({ id: `s-${now}`, kind: tm.kind, start: end - worked, end, task: tm.task, plannedMin: tm.plannedMin });
        toast(tm.kind === "focus" ? tRef.current.toast.sessionSaved : tRef.current.toast.restSaved, "success");
      }
      setTimer(null);
      void saveUserData({ timer: null });
      setJustCompleted(now);
    },
    [pushSession, toast],
  );

  /* auto-finish the focus countdown */
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
      prefsReady, lang, t, setLang, mood, setMood, savedMood,
      auth, user, dataReady,
      register: async (l, name, pw, remember) => {
        const u = await authRegister(l, name, pw, remember);
        await adopt(u);
        return u;
      },
      login: async (l, pw, remember) => {
        const u = await authLogin(l, pw, remember);
        await adopt(u);
        return u;
      },
      enterSample: async () => {
        const { user: u, fresh } = await authSampleProfile(t.auth.sampleName);
        await adopt(u, { sampleFresh: fresh });
        return u;
      },
      logout: async () => {
        await authLogout();
        clearUserState();
        toast(t.toast.signedOut);
      },
      deleteAccount: async () => {
        await authDeleteAccount();
        clearUserState();
        toast(t.toast.accountDeleted);
      },
      changePassword: (c, n) => authChangePassword(c, n),

      profile,
      saveProfile: (p) => {
        setProfile(p);
        void saveUserData({ profile: p });
      },
      completeOnboarding: (p) => {
        const done = { ...p, completed: true };
        setProfile(done);
        const patch: Record<string, unknown> = { profile: done };
        if (media.length === 0) {
          const m = mediaFromTastes(done, t);
          setMedia(m);
          patch.media = m;
        }
        void saveUserData(patch);
      },
      redoOnboarding: () => {
        const p = { ...profile, completed: false };
        setProfile(p);
        void saveUserData({ profile: p });
      },
      tutorialDone, tourOpen,
      startTour: () => setTourOpen(true),
      endTour: () => {
        setTourOpen(false);
        setTutorialDone(true);
        void saveUserData({ tutorial: { done: true } });
      },
      ui,
      setUi: (u) => {
        setUiState(u);
        void saveUserData({ ui: u });
      },

      sessions, media,
      saveMedia: (m) =>
        setMedia((prev) => {
          const next = prev.some((x) => x.id === m.id) ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m];
          void saveUserData({ media: next });
          return next;
        }),
      removeMedia: (id) =>
        setMedia((prev) => {
          const next = prev.filter((x) => x.id !== id);
          void saveUserData({ media: next });
          return next;
        }),
      seedData: () => {
        const real = sessions.filter((s) => !s.seed);
        const next = [...real, ...makeSeed(t.settings.data.seedTasks.split("|"))].sort((a, b) => a.start - b.start);
        setSessions(next);
        void saveUserData({ sessions: next, seeded: true });
        toast(t.toast.dataSeeded, "success");
      },
      clearData: () => {
        setSessions([]);
        persistTimer(null);
        void saveUserData({ sessions: [] });
        toast(t.toast.dataCleared, "success");
      },
      timer,
      startTimer: (kind, plannedMin, task) => persistTimer({ kind, startedAt: Date.now(), plannedMin, task, pausedAt: null, pausedTotal: 0 }),
      pauseTimer: () => timer && !timer.pausedAt && persistTimer({ ...timer, pausedAt: Date.now() }),
      resumeTimer: () => timer?.pausedAt && persistTimer({ ...timer, pausedTotal: timer.pausedTotal + (Date.now() - timer.pausedAt), pausedAt: null }),
      finishTimer: () => timer && finishWith(timer, Date.now()),
      discardTimer: () => persistTimer(null),
      justCompleted, toasts, toast, ai, refreshAi,
    }),
    [prefsReady, lang, t, mood, savedMood, auth, user, dataReady, profile, tutorialDone, tourOpen, ui, sessions, media, timer, justCompleted, toasts, ai, setLang, setMood, toast, finishWith, refreshAi],
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
