"use client";

import React, { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Split, Square, CornerDownLeft } from "lucide-react";
import { elapsedMs, fmt, useApp, useNow } from "@/context/AppContext";
import { fmtClock } from "@/components/shell/AppShell";
import { TimerDial } from "@/components/ui/TimerDial";
import { Button, EmptyState, FlexByline, PageHeader, Segmented, Skeleton } from "@/components/ui/primitives";
import { todayTotals, minutesOf } from "@/lib/stats";
import { splitPayload } from "@/lib/ai";
import { SESSION_LENS } from "@/lib/profile";
import { useAi } from "@/lib/useAi";
import { cn } from "@/lib/utils";

export function FocusScreen() {
  const { t, lang, timer, startTimer, pauseTimer, resumeTimer, finishTimer, discardTimer, justCompleted, sessions, profile } = useApp();
  const focusTimer = timer?.kind === "focus" ? timer : null;
  const [minutes, setMinutes] = useState<number>(() => focusTimer?.plannedMin ?? profile.sessionLen);
  const [task, setTask] = useState(() => focusTimer?.task ?? "");
  const split = useAi("split");
  const now = useNow(!!focusTimer && !focusTimer.pausedAt, 250);
  const [done, setDone] = useState(false);

  // "complete" only right after a session ends, until the user resets or starts again
  useEffect(() => {
    if (!justCompleted) return;
    const id = window.setTimeout(() => setDone(Date.now() - justCompleted < 120_000), 0);
    return () => clearTimeout(id);
  }, [justCompleted]);
  const recent = done && !timer;

  const planned = (focusTimer?.plannedMin ?? minutes) * 60_000;
  const elapsed = focusTimer ? elapsedMs(focusTimer, now) : 0;
  const remaining = Math.max(0, planned - elapsed);
  const status = focusTimer ? (focusTimer.pausedAt ? t.focus.paused : t.focus.running) : recent ? t.focus.done : t.focus.ready;
  const today = todayTotals(sessions);
  const timeFmt = new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  const options = (SESSION_LENS as readonly number[]).includes(minutes) ? [...SESSION_LENS] : [...SESSION_LENS, minutes].sort((a, b) => a - b);

  const begin = () => {
    if (timer && timer.kind !== "focus") finishTimer();
    setDone(false);
    startTimer("focus", minutes, task.trim());
  };

  const splitDisabled = !task.trim() || split.status === "loading" || !!focusTimer;

  return (
    <div>
      <PageHeader title={t.focus.title} />
      <div className="grid gap-5 grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="card px-8 py-7 flex flex-col items-center rise" style={{ ["--i" as string]: 1 }}>
          <label className="w-full">
            <span className="text-[13px] font-semibold text-ink-2 block mb-1.5">{t.focus.taskLabel}</span>
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              disabled={!!focusTimer}
              placeholder={t.focus.taskPlaceholder}
              maxLength={90}
              className="display w-full bg-transparent border-0 border-b-2 border-line-strong focus:border-accent outline-none pb-2 text-[26px] placeholder:text-ink-3 transition-colors disabled:text-ink-2 disabled:border-line"
              style={{ fontWeight: 420, letterSpacing: "-0.005em" }}
            />
          </label>
          <div className="my-6">
            <TimerDial size={300} progress={focusTimer ? elapsed / planned : recent ? 1 : 0} label={status} digits={fmtClock(focusTimer ? remaining : planned)} pulse={recent}>
              <p className="mt-3 text-[13px] text-ink-2 h-5">{focusTimer ? fmt(t.focus.minutesLeft, { n: Math.ceil(remaining / 60_000) }) : fmt(t.focus.planned, { n: minutes })}</p>
            </TimerDial>
          </div>
          <div className="flex items-center gap-3">
            {!focusTimer ? (
              <Button size="lg" onClick={begin} className="min-w-[180px]"><Play size={18} aria-hidden fill="currentColor" />{t.common.start}</Button>
            ) : focusTimer.pausedAt ? (
              <Button size="lg" onClick={resumeTimer} className="min-w-[180px]"><Play size={18} aria-hidden fill="currentColor" />{t.common.resume}</Button>
            ) : (
              <Button size="lg" onClick={pauseTimer} className="min-w-[180px]"><Pause size={18} aria-hidden fill="currentColor" />{t.common.pause}</Button>
            )}
            {focusTimer && (
              <>
                <Button variant="soft" size="icon" onClick={finishTimer} aria-label={t.common.stop} title={t.common.stop}><Square size={16} fill="currentColor" aria-hidden /></Button>
                <Button variant="ghost" size="icon" onClick={discardTimer} aria-label={t.common.reset} title={t.common.reset}><RotateCcw size={17} aria-hidden /></Button>
              </>
            )}
            {recent && (
              <Button variant="ghost" size="icon" onClick={() => setDone(false)} aria-label={t.common.reset} title={t.common.reset}><RotateCcw size={17} aria-hidden /></Button>
            )}
          </div>
          <div className={cn("mt-5 flex items-center gap-3 transition-opacity", focusTimer && "opacity-50 pointer-events-none")} aria-disabled={!!focusTimer}>
            <span className="text-[13px] font-semibold text-ink-2">{t.focus.presets}</span>
            <Segmented size="sm" label={t.focus.presets} value={minutes} onChange={(v) => { setMinutes(v); setDone(false); }} options={options.map((m) => ({ value: m, label: `${m}′` }))} />
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <section className="card p-6 rise" style={{ ["--i" as string]: 2 }} aria-live="polite" aria-busy={split.status === "loading"} data-tour="splitter">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="display text-[22px]">{t.focus.splitTitle}</h2>
                <p className="text-[13px] text-ink-2 mt-1">{t.focus.splitSub}</p>
              </div>
              <FlexByline className="mt-1 shrink-0" />
            </div>
            <Button variant="soft" className="mt-4 w-full" disabled={splitDisabled} onClick={() => void split.run(splitPayload(task, profile))}>
              <Split size={16} aria-hidden className={cn(split.status === "loading" && "animate-pulse")} />
              {split.status === "loading" ? t.focus.splitting : t.focus.split}
            </Button>
            {split.status !== "loading" && splitDisabled && (
              <p className="text-[12.5px] text-ink-2 mt-2.5 text-center">{focusTimer ? t.focus.splitBusy : t.focus.splitNeedTask}</p>
            )}
            {split.status === "loading" && <div className="mt-4 flex flex-col gap-2"><span className="sr-only">{t.flex.thinking}</span><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
            {split.status === "error" && <p className="mt-3 text-[13px] text-danger">{t.flex.error}</p>}
            {split.status === "done" && split.data && (
              <ol className="mt-4 flex flex-col gap-2">
                {split.data.blocks.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-2 pl-3 pr-2 py-2 rise" style={{ ["--i" as string]: i }}>
                    <span className="mono text-[12px] text-accent font-semibold w-5">{i + 1}</span>
                    <span className="flex-1 min-w-0 text-[13px] leading-[18px] text-ink">{b.title}</span>
                    <button
                      type="button"
                      disabled={!!focusTimer}
                      onClick={() => { setMinutes(Math.max(5, Math.min(180, Math.round(b.minutes)))); setTask(b.title.slice(0, 90)); setDone(false); }}
                      className="shrink-0 h-8 px-3 rounded-full bg-accent-soft text-ink text-[12px] font-bold inline-flex items-center gap-1.5 hover:bg-accent hover:text-on-accent transition-colors disabled:opacity-50"
                      aria-label={`${t.focus.useBlock}: ${b.title}, ${b.minutes} ${t.common.min}`}
                    >
                      {b.minutes}′ · {t.focus.useBlock}
                      <CornerDownLeft size={12} aria-hidden />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card p-6 flex-1 rise" style={{ ["--i" as string]: 3 }}>
            <div className="flex items-baseline justify-between">
              <h2 className="display text-[22px]">{t.focus.todayTitle}</h2>
              {today.focusSessions.length > 0 && <span className="mono text-[12px] text-ink-2">{today.focusMin} {t.common.min}</span>}
            </div>
            {today.focusSessions.length === 0 ? (
              <EmptyState title={t.focus.todayEmpty} hint={t.focus.todayEmptyHint} />
            ) : (
              <ol className="mt-5 relative flex flex-col gap-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-line-strong">
                {today.focusSessions.map((s) => (
                  <li key={s.id} className="relative pl-6">
                    <span className="absolute left-0 top-[7px] h-[11px] w-[11px] rounded-full bg-surface border-2 border-accent" />
                    <p className="mono text-[11px] text-ink-2">{timeFmt.format(s.start)} · {minutesOf(s)} {t.common.min}</p>
                    <p className="text-[14px] font-semibold text-ink mt-0.5 truncate">{s.task || t.nav.focus}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
