"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Flame, Star, Timer } from "lucide-react";
import { fmt, useApp, useNow } from "@/context/AppContext";
import { bestDay, perDay, startOfDay, streakDays, thisWeek, todayTotals, dayKey, DAY } from "@/lib/stats";
import { coachPayload } from "@/lib/ai";
import { targetFocusPct } from "@/lib/profile";
import { Button, EmptyState, FlexMark, Skeleton } from "@/components/ui/primitives";
import { HeroOrb } from "@/components/hero/HeroOrb";
import { useAi } from "@/lib/useAi";
import { cn } from "@/lib/utils";

/** "3 h 45 min" with the unit set smaller than the number, value shown once. */
function Dur({ min, size }: { min: number; size: "hero" | "stat" | "inline" }) {
  const { t } = useApp();
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  const unit = (s: string) => (
    <span className={cn("unit", size === "hero" ? "text-[0.36em] ml-[0.08em] mr-[0.28em]" : size === "stat" ? "text-[0.5em] ml-[0.1em] mr-[0.3em]" : "ml-0.5 mr-1")}>{s}</span>
  );
  if (size === "inline") return <>{h > 0 ? `${h} ${t.common.h} ` : ""}{m} {t.common.min}</>;
  return (
    <>
      {h > 0 && (
        <>
          {h}
          {unit(t.common.h)}
        </>
      )}
      {h > 0 ? String(m).padStart(2, "0") : m}
      {unit(t.common.m)}
    </>
  );
}

function GoalRing({ value, goal }: { value: number; goal: number }) {
  const { t } = useApp();
  const p = goal > 0 ? Math.min(1, value / goal) : 0;
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90 shrink-0" role="img" aria-label={fmt(t.home.goalAria, { p: Math.round(p * 100) })}>
      <circle cx="32" cy="32" r={R} fill="none" stroke="var(--bg-2)" strokeWidth="7" />
      {p > 0 && <circle cx="32" cy="32" r={R} fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${p * C} ${C}`} style={{ transition: "stroke-dasharray 900ms var(--ease)" }} />}
    </svg>
  );
}

export function HomeScreen() {
  const { t, lang, sessions, profile } = useApp();
  const locale = lang === "es" ? "es-ES" : "en-GB";
  const now = useNow(true, 60_000);
  const hour = new Date(now).getHours();

  const stats = useMemo(() => {
    const today = todayTotals(sessions, now);
    const week = thisWeek(sessions, "focus", now);
    const map = perDay(sessions, "focus");
    const todayStart = startOfDay(now);
    const dow = (new Date(todayStart).getDay() + 6) % 7;
    const start = todayStart - dow * DAY - 11 * 7 * DAY;
    const cells = Array.from({ length: 84 }, (_, i) => {
      const ts = start + Math.floor(i / 7) * 7 * DAY + (i % 7) * DAY;
      return { ts, minutes: map.get(dayKey(ts)) ?? 0, future: ts > todayStart };
    });
    return { today, week, weekMin: week.reduce((a, d) => a + d.minutes, 0), cells, streak: streakDays(sessions, now), best: bestDay(sessions) };
  }, [sessions, now]);

  const total = stats.today.focusMin + stats.today.restMin;
  const focusShare = total === 0 ? 0.5 : stats.today.focusMin / total;
  const target = targetFocusPct(profile);
  const greeting = hour < 12 ? t.home.morning : hour < 20 ? t.home.afternoon : t.home.evening;
  const hello = profile.name ? fmt(t.home.greetName, { greeting, name: profile.name.split(" ")[0] }) : greeting;
  const dateLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now);
  const goalMin = profile.weeklyGoalH * 60;
  const empty = sessions.length === 0;
  const fp = Math.round(focusShare * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* HERO */}
      <section className="hero card relative overflow-hidden min-h-[392px] rise" style={{ ["--i" as string]: 0 }}>
        <div className="hero-light" aria-hidden />
        <HeroOrb ratio={total === 0 ? 0.5 : focusShare} />
        <div className="relative z-10 p-10 flex flex-col h-full min-h-[392px] max-w-[60%]">
          <p className="text-[14px] text-ink-2 first-letter:uppercase">{dateLabel}</p>
          <h1 className="display text-[34px] leading-[1.1] mt-2 text-ink text-balance">{hello}</h1>
          <div className="mt-5">
            <p className="display-num text-[104px] leading-[0.95] text-ink whitespace-nowrap">
              <Dur min={stats.today.focusMin} size="hero" />
            </p>
            <p className="mt-2 text-[15px] text-ink-2">{t.home.focusToday}</p>
          </div>
          <div className="mt-auto pt-8 flex items-end gap-6 flex-wrap">
            <div className="flex-1 min-w-[220px] max-w-[300px]">
              <div className="flex justify-between items-baseline text-[13px] mb-2 gap-3">
                <span className="text-ink font-semibold">{t.home.balance}</span>
                <span className="mono text-ink-2 tabular-nums">{total === 0 ? "— : —" : `${fp} : ${100 - fp}`}</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-bg-2 overflow-visible flex" role="img" aria-label={fmt(t.home.balanceAria, { f: total === 0 ? 0 : fp, l: total === 0 ? 0 : 100 - fp, t: target })}>
                {total > 0 && (
                  <>
                    <span className="h-full rounded-l-full bg-[var(--c-focus)] transition-[width] duration-700 ease-[var(--ease)]" style={{ width: `${focusShare * 100}%` }} />
                    <span className="h-full rounded-r-full bg-[var(--c-leisure)] flex-1 opacity-80" />
                  </>
                )}
                <span className="absolute -top-1 -bottom-1 w-[3px] rounded-full bg-ink" style={{ left: `calc(${target}% - 1.5px)` }} aria-hidden />
              </div>
              <p className="mt-2 text-[13px] text-ink-2 flex justify-between gap-3">
                <span><Dur min={stats.today.restMin} size="inline" /> {t.home.restToday}</span>
                <span className="shrink-0">{fmt(t.home.target, { n: target, m: 100 - target })}</span>
              </p>
            </div>
            <Link href="/deep-work" tabIndex={-1} data-tour="start">
              <Button size="lg" className="gap-3">
                {fmt(t.home.startSession, { n: profile.sessionLen })} <ArrowRight size={18} aria-hidden />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* STAT STRIP */}
      <section className="card grid grid-cols-[1.25fr_1fr_1fr_1fr] divide-x divide-line rise" style={{ ["--i" as string]: 1 }}>
        <div className="px-6 py-5 flex items-center gap-4 min-w-0">
          <GoalRing value={stats.weekMin} goal={goalMin} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink-2">{t.home.goalTitle}</p>
            <p className="display-num text-[28px] mt-0.5 text-ink whitespace-nowrap">
              <Dur min={stats.weekMin} size="stat" />
            </p>
            <p className="text-[12.5px] text-ink-2 truncate">
              {stats.weekMin >= goalMin ? t.home.goalMet : `${fmt(t.home.goalOf, { n: profile.weeklyGoalH })} · ${fmt(t.home.goalLeft, { n: `${Math.ceil((goalMin - stats.weekMin) / 60)} ${t.common.h}` })}`}
            </p>
          </div>
        </div>
        <Stat icon={Timer} label={t.home.statSessions} value={String(stats.today.focusSessions.length)} />
        <Stat icon={Flame} label={t.home.statStreak} value={String(stats.streak)} unit={fmt(stats.streak === 1 ? t.common.day : t.common.days, { n: "" }).trim()} />
        <Stat
          icon={Star}
          label={t.home.statBest}
          value={stats.best ? <Dur min={stats.best.minutes} size="stat" /> : t.home.none}
          sub={stats.best ? new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(stats.best.ts).replace(/\./g, "") : undefined}
        />
      </section>

      {empty ? (
        <section className="card rise" style={{ ["--i" as string]: 2 }}>
          <EmptyState
            title={t.home.emptyTitle}
            hint={t.home.emptyHint}
            action={
              <Link href="/deep-work" tabIndex={-1}>
                <Button variant="soft">{fmt(t.home.startSession, { n: profile.sessionLen })}</Button>
              </Link>
            }
          />
        </section>
      ) : (
        <div className="grid gap-5 grid-cols-[minmax(0,1fr)_320px]">
          <Heatmap cells={stats.cells} locale={locale} />
          <WeekChart week={stats.week} locale={locale} />
        </div>
      )}

      <CoachCard />
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit, sub }: { icon: React.ElementType; label: string; value: React.ReactNode; unit?: string; sub?: string }) {
  return (
    <div className="px-6 py-5 flex items-center gap-3.5 min-w-0">
      <span className="h-10 w-10 shrink-0 rounded-full bg-accent-soft grid place-items-center text-accent"><Icon size={18} aria-hidden /></span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink-2 truncate">{label}</p>
        <p className="display-num text-[28px] mt-0.5 text-ink whitespace-nowrap">
          {value}
          {unit && <span className="unit text-[0.5em] ml-[0.18em]">{unit}</span>}
        </p>
        {sub && <p className="text-[12.5px] text-ink-2 truncate first-letter:uppercase">{sub}</p>}
      </div>
    </div>
  );
}

const LEVELS = [0, 22, 45, 72, 100];
const level = (m: number) => (m === 0 ? 0 : m < 45 ? 1 : m < 100 ? 2 : m < 160 ? 3 : 4);
const cellBg = (l: number) => (l === 0 ? "var(--bg-2)" : `color-mix(in srgb, var(--accent) ${LEVELS[l]}%, var(--surface))`);

function Heatmap({ cells, locale }: { cells: { ts: number; minutes: number; future: boolean }[]; locale: string }) {
  const { t } = useApp();
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" });
  const wd = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const mon = new Intl.DateTimeFormat(locale, { month: "short" });
  const weeks = Array.from({ length: 12 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const months = weeks.map((wk, w) => {
    const m = new Date(wk[0].ts).getMonth();
    const prev = w > 0 ? new Date(weeks[w - 1][0].ts).getMonth() : -1;
    return m !== prev ? mon.format(wk[0].ts).replace(".", "") : "";
  });
  const label = (c: { ts: number; minutes: number }) => (c.minutes ? fmt(t.home.heatCell, { date: dayFmt.format(c.ts), n: c.minutes }) : fmt(t.home.heatEmpty, { date: dayFmt.format(c.ts) }));

  return (
    <section className="card p-7 rise relative" style={{ ["--i" as string]: 2 }}>
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h2 className="display text-[24px]">{t.home.heatTitle}</h2>
          <p className="text-[13px] text-ink-2 mt-1">{t.home.heatSub}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-ink-2 mt-1.5" aria-hidden>
          {t.home.less}
          {[0, 1, 2, 3, 4].map((l) => <span key={l} className="h-3 w-3 rounded-[3px]" style={{ background: cellBg(l) }} />)}
          {t.home.more}
        </div>
      </div>
      <div className="heat" onMouseLeave={() => setTip(null)}>
        <div />
        {months.map((m, i) => <span key={i} className="text-[11px] text-ink-2 h-4 leading-4 capitalize whitespace-nowrap">{m}</span>)}
        {Array.from({ length: 7 }, (_, d) => (
          <React.Fragment key={d}>
            <span className="text-[11px] text-ink-2 uppercase leading-none self-center pr-1.5">{d % 2 === 0 ? wd.format(cells[d].ts) : ""}</span>
            {weeks.map((wk, w) => {
              const c = wk[d];
              const l = level(c.minutes);
              return c.future ? (
                <span key={w} className="heat-cell opacity-0" aria-hidden />
              ) : (
                <span
                  key={w}
                  role="img"
                  aria-label={label(c)}
                  className="heat-cell"
                  style={{ background: cellBg(l) }}
                  onMouseEnter={(e) => {
                    const r = (e.target as HTMLElement).getBoundingClientRect();
                    const host = (e.currentTarget.closest("section") as HTMLElement).getBoundingClientRect();
                    setTip({ x: r.left - host.left + r.width / 2, y: r.top - host.top, text: label(c) });
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {tip && (
        <div className="tooltip" style={{ left: tip.x, top: tip.y }} aria-hidden>
          {tip.text}
        </div>
      )}
    </section>
  );
}

function WeekChart({ week, locale }: { week: { ts: number; minutes: number; future: boolean; today: boolean }[]; locale: string }) {
  const { t } = useApp();
  const max = Math.max(60, ...week.map((d) => d.minutes));
  const wd = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const wdLong = new Intl.DateTimeFormat(locale, { weekday: "long" });
  return (
    <section className="card p-7 flex flex-col rise" style={{ ["--i" as string]: 3 }}>
      <h2 className="display text-[24px]">{t.home.weekTitle}</h2>
      <p className="text-[13px] text-ink-2 mt-1">{t.home.weekSub}</p>
      <div className="flex-1 mt-5 grid grid-cols-7 gap-2 items-end min-h-[170px]">
        {week.map((d) => (
          <div key={d.ts} className="group flex flex-col items-center gap-2 h-full justify-end" role="img" aria-label={fmt(t.home.weekBar, { day: wdLong.format(d.ts), n: d.minutes })}>
            <span className={cn("mono text-[11px] tabular-nums transition-opacity", d.today ? "text-ink font-semibold" : "text-ink-2 opacity-0 group-hover:opacity-100")}>{d.future ? "" : d.minutes}</span>
            <div className="w-full flex-1 flex items-end">
              <div
                className={cn("w-full rounded-[7px] transition-[height] duration-700 ease-[var(--ease)]", d.today ? "bg-accent" : d.future ? "bg-transparent border border-dashed border-line-strong" : "bg-[color-mix(in_srgb,var(--accent)_32%,var(--surface))] group-hover:bg-[color-mix(in_srgb,var(--accent)_55%,var(--surface))]")}
                style={{ height: d.future ? 10 : `${Math.max(4, (d.minutes / max) * 100)}%` }}
              />
            </div>
            <span className={cn("text-[11px] font-semibold capitalize", d.today ? "text-ink" : "text-ink-2")}>{wd.format(d.ts).replace(".", "").slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CoachCard() {
  const { t, sessions, profile } = useApp();
  const ai = useAi("coach");
  const run = () => void ai.run(coachPayload(sessions, profile));

  return (
    <section className="card p-7 flex gap-6 items-start rise" style={{ ["--i" as string]: 4 }} aria-live="polite" aria-busy={ai.status === "loading"}>
      <span className="h-12 w-12 shrink-0 rounded-full bg-accent-soft grid place-items-center"><FlexMark size={30} /></span>
      <div className="flex-1 min-w-0">
        <h2 className="display text-[24px]">{t.home.coachTitle}</h2>
        <p className="text-[13px] text-ink-2 mt-1">{t.home.coachSub}</p>
        {ai.status === "loading" && (
          <div className="mt-5 flex flex-col gap-2.5 max-w-[580px]">
            <span className="sr-only">{t.flex.thinking}</span>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-[86%]" />
            <Skeleton className="h-9 w-[60%] mt-2 !rounded-full" />
          </div>
        )}
        {ai.status === "done" && ai.data && (
          <div className="mt-5 max-w-[660px]">
            <p className="text-[19px] leading-[1.5] text-ink text-pretty">{ai.data.insight}</p>
            <p className="mt-4 inline-flex items-start gap-2 rounded-[16px] bg-accent-soft px-4 py-2.5 text-[14px] leading-[20px] text-ink"><span className="font-bold text-accent shrink-0">{t.home.coachTweak}</span>{ai.data.tweak}</p>
          </div>
        )}
        {ai.status === "error" && <p className="mt-4 text-[14px] text-danger">{t.flex.error}</p>}
      </div>
      <Button variant={ai.status === "done" ? "soft" : "primary"} onClick={run} disabled={ai.status === "loading"}>
        <Compass size={16} aria-hidden />
        {ai.status === "done" ? t.common.regenerate : ai.status === "error" ? t.common.retry : t.home.coachCta}
      </Button>
    </section>
  );
}
