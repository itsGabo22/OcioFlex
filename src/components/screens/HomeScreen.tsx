"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles, Star, Timer } from "lucide-react";
import { fmt, useApp, useNow } from "@/context/AppContext";
import { bestDay, lastDays, minutesOf, startOfDay, streakDays, todayTotals, perDay, dayKey } from "@/lib/stats";
import { Button, AiBadge, Skeleton } from "@/components/ui/primitives";
import { HeroOrb } from "@/components/hero/HeroOrb";
import { useAi } from "@/lib/useAi";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;

function Dur({ min, big }: { min: number; big?: boolean }) {
  const { t } = useApp();
  const h = Math.floor(min / 60);
  const m = min % 60;
  const unit = (s: string) => <span className={cn("text-accent font-normal ml-1 mr-2", big ? "text-[40px]" : "text-[18px]")}>{s}</span>;
  return (
    <>
      {h > 0 && (
        <>
          {h}
          {unit(t.common.h)}
        </>
      )}
      {String(m).padStart(h > 0 ? 2 : 1, "0")}
      {unit(t.common.m)}
    </>
  );
}

function HeatCell({ minutes, label, empty }: { minutes: number; label: string; empty?: boolean }) {
  const level = minutes === 0 ? 0 : minutes < 45 ? 1 : minutes < 100 ? 2 : minutes < 160 ? 3 : 4;
  const pct = [0, 22, 45, 72, 100][level];
  return (
    <div
      title={empty ? undefined : label}
      className={cn("aspect-square rounded-[7px] transition-transform duration-200", !empty && "hover:scale-125")}
      style={{ background: empty ? "transparent" : level === 0 ? "var(--bg-2)" : `color-mix(in srgb, var(--accent) ${pct}%, var(--surface))` }}
    />
  );
}

export function HomeScreen() {
  const { t, lang, sessions, mood } = useApp();
  const locale = lang === "es" ? "es-ES" : "en-US";
  const now = useNow(true, 60_000);
  const hour = new Date(now).getHours();

  const stats = useMemo(() => {
    const today = todayTotals(sessions, now);
    const week = lastDays(sessions, "focus", 7, now);
    const weekRest = lastDays(sessions, "rest", 7, now);
    const map = perDay(sessions, "focus");
    const todayStart = startOfDay(now);
    const dow = (new Date(todayStart).getDay() + 6) % 7;
    const start = todayStart - dow * DAY - 11 * 7 * DAY;
    const cells = Array.from({ length: 84 }, (_, i) => {
      const ts = start + Math.floor(i / 7) * 7 * DAY + (i % 7) * DAY;
      return { ts, minutes: map.get(dayKey(ts)) ?? 0, future: ts > todayStart };
    });
    return { today, week, weekRest, cells, streak: streakDays(sessions, now), best: bestDay(sessions) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  const total = stats.today.focusMin + stats.today.restMin;
  const focusShare = total === 0 ? 0.5 : stats.today.focusMin / total;
  const greeting = hour < 12 ? t.home.morning : hour < 19 ? t.home.afternoon : t.home.evening;
  const dateLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now);
  const weekMax = Math.max(60, ...stats.week.map((d) => d.minutes));

  return (
    <div className="flex flex-col gap-5">
      {/* HERO */}
      <section className="card relative overflow-hidden min-h-[400px] rise" style={{ ["--i" as string]: 0, background: "radial-gradient(60% 80% at 80% 40%, color-mix(in srgb, var(--glow) 38%, transparent) 0%, transparent 70%), color-mix(in srgb, var(--surface) 90%, transparent)", borderRadius: "var(--radius-xl)" }}>
        <HeroOrb ratio={focusShare} />
        <div className="relative z-10 p-10 flex flex-col h-full min-h-[400px] max-w-[62%]">
          <p className="meta">{dateLabel}</p>
          <h1 className="display text-[34px] mt-3 text-ink-2">{greeting}</h1>
          <div className="mt-6">
            <p className="display text-[112px] leading-[0.95] text-ink whitespace-nowrap">
              <Dur min={stats.today.focusMin} big />
            </p>
            <p className="mt-3 text-[15px] text-ink-2">{t.home.focusToday}</p>
          </div>
          <div className="mt-auto pt-8 flex items-end gap-6">
            <div className="flex-1 max-w-[300px]">
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-ink font-semibold">{t.home.balance}</span>
                <span className="mono text-ink-2">{Math.round(focusShare * 100)} : {Math.round((1 - focusShare) * 100)}</span>
              </div>
              <div className="h-2 rounded-full bg-bg-2 overflow-hidden flex" role="img" aria-label={`${t.home.balance} ${t.home.balanceHint}`}>
                <span className="h-full bg-accent transition-[width] duration-700 ease-[var(--ease)]" style={{ width: `${focusShare * 100}%` }} />
                <span className="h-full bg-accent-2 flex-1" />
              </div>
              <p className="mt-2 text-[13px] text-ink-2"><Dur min={stats.today.restMin} /> {t.home.restToday}</p>
            </div>
            <Link href="/deep-work" tabIndex={-1}>
              <Button size="lg" className="gap-3">
                {t.home.startSession} <ArrowRight size={18} aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* STAT STRIP */}
      <section className="card grid grid-cols-3 divide-x divide-line rise" style={{ ["--i" as string]: 1 }}>
        {[
          { icon: Timer, label: t.home.statSessions, value: String(stats.today.focusSessions.length), sub: fmt(stats.today.focusSessions.length === 1 ? t.common.session : t.common.sessions, { n: stats.today.focusSessions.length }) },
          { icon: Flame, label: t.home.statStreak, value: String(stats.streak), sub: fmt(stats.streak === 1 ? t.common.day : t.common.days, { n: stats.streak }) },
          { icon: Star, label: t.home.statBest, value: stats.best ? `${Math.floor(stats.best.minutes / 60)}${t.common.h} ${String(stats.best.minutes % 60).padStart(2, "0")}${t.common.m}` : "—", sub: stats.best ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(stats.best.ts) : "" },
        ].map((s) => (
          <div key={s.label} className="px-7 py-5 flex items-center gap-4 min-w-0">
            <span className="h-11 w-11 shrink-0 rounded-full bg-accent-soft grid place-items-center text-accent"><s.icon size={19} aria-hidden /></span>
            <div className="min-w-0">
              <p className="meta truncate">{s.label}</p>
              <p className="display text-[30px] mt-1 text-ink whitespace-nowrap">{s.value}<span className="text-[13px] font-sans text-ink-2 ml-2 tracking-normal" style={{ fontVariationSettings: "normal" }}>{s.value === "—" ? "" : s.sub}</span></p>
            </div>
          </div>
        ))}
      </section>

      {/* HEATMAP + WEEK */}
      <div className="grid gap-5 grid-cols-[1fr_300px]">
        <section className="card p-7 rise" style={{ ["--i" as string]: 2 }}>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="display text-[24px]">{t.home.heatTitle}</h2>
              <p className="text-[13px] text-ink-2 mt-1.5">{t.home.heatSub}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-ink-2" aria-hidden>
              {t.home.less}
              {[0, 22, 45, 72, 100].map((p) => <span key={p} className="h-3 w-3 rounded-[4px]" style={{ background: p === 0 ? "var(--bg-2)" : `color-mix(in srgb, var(--accent) ${p}%, var(--surface))` }} />)}
              {t.home.more}
            </div>
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-[6px]" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
            {stats.cells.map((c) => (
              <HeatCell key={c.ts} minutes={c.minutes} empty={c.future} label={`${new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(c.ts)} · ${c.minutes} ${t.common.min}`} />
            ))}
          </div>
        </section>

        <section className="card p-7 flex flex-col rise" style={{ ["--i" as string]: 3 }}>
          <h2 className="display text-[24px]">{t.home.weekTitle}</h2>
          <p className="text-[13px] text-ink-2 mt-1.5">{t.home.weekSub}</p>
          <div className="flex-1 mt-6 flex items-end gap-2.5 min-h-[150px]">
            {stats.week.map((d, i) => {
              const last = i === stats.week.length - 1;
              return (
                <div key={d.ts} className="flex-1 flex flex-col items-center gap-2 h-full justify-end" title={`${d.minutes} ${t.common.min}`}>
                  <div className={cn("w-full rounded-[8px] transition-[height] duration-700 ease-[var(--ease)]", last ? "bg-accent" : "bg-accent-soft")} style={{ height: `${Math.max(6, (d.minutes / weekMax) * 130)}px` }} />
                  <span className={cn("text-[11px] font-semibold uppercase", last ? "text-ink" : "text-ink-3")}>{new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(d.ts)}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <CoachCard sessions={sessions} moodKey={mood} />
    </div>
  );
}

function CoachCard({ sessions }: { sessions: ReturnType<typeof useApp>["sessions"]; moodKey: string }) {
  const { t, lang } = useApp();
  const ai = useAi("coach");
  const run = () => {
    const now = Date.now();
    const f = lastDays(sessions, "focus", 7, now);
    const r = lastDays(sessions, "rest", 7, now);
    const today = todayTotals(sessions, now);
    void ai.run({
      days: f.map((d, i) => ({ date: new Date(d.ts).toISOString().slice(0, 10), focusMin: d.minutes, restMin: r[i].minutes })),
      todayFocusMin: today.focusMin,
      todayRestMin: today.restMin,
    });
  };
  void lang;
  void minutesOf;

  return (
    <section className="card p-7 flex gap-6 items-start rise" style={{ ["--i" as string]: 4 }} aria-live="polite">
      <span className="h-12 w-12 shrink-0 rounded-full bg-accent-soft grid place-items-center text-accent"><Sparkles size={22} aria-hidden /></span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="display text-[24px]">{t.home.coachTitle}</h2>
          <AiBadge />
        </div>
        <p className="text-[13px] text-ink-2 mt-1.5">{t.home.coachSub}</p>
        {ai.status === "loading" && (
          <div className="mt-5 flex flex-col gap-2.5 max-w-[560px]"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-[86%]" /><Skeleton className="h-9 w-[60%] mt-2 !rounded-full" /></div>
        )}
        {ai.status === "done" && ai.data && (
          <div className="mt-5 max-w-[640px]">
            <p className="display text-[22px] leading-[1.35] text-ink" style={{ fontWeight: 400, letterSpacing: "-0.01em" }}>{ai.data.insight}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-[14px] text-ink"><span className="font-bold text-accent">{t.home.coachTweak}</span>{ai.data.tweak}</p>
          </div>
        )}
        {ai.status === "error" && <p className="mt-4 text-[14px] text-danger">{t.ai.error}</p>}
      </div>
      <Button variant={ai.status === "done" ? "soft" : "primary"} onClick={run} disabled={ai.status === "loading"}>
        {ai.status === "done" ? t.common.regenerate : ai.status === "error" ? t.common.retry : t.home.coachCta}
      </Button>
    </section>
  );
}
