"use client";

import React, { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Sparkles, Square, Wand2 } from "lucide-react";
import { elapsedMs, fmt, useApp, useNow } from "@/context/AppContext";
import { fmtClock } from "@/components/shell/AppShell";
import { TimerDial } from "@/components/ui/TimerDial";
import { AiBadge, Button, EmptyState, PageHeader, Segmented, Skeleton } from "@/components/ui/primitives";
import { todayTotals, minutesOf } from "@/lib/stats";
import { useAi } from "@/lib/useAi";
import { cn } from "@/lib/utils";

const PRESETS = [25, 45, 60];

export function FocusScreen() {
  const { t, lang, timer, startTimer, pauseTimer, resumeTimer, finishTimer, discardTimer, justCompleted, sessions } = useApp();
  const focusTimer = timer?.kind === "focus" ? timer : null;
  const [minutes, setMinutes] = useState(() => focusTimer?.plannedMin ?? 45);
  const [task, setTask] = useState(() => focusTimer?.task ?? "");
  const split = useAi("split");
  const now = useNow(!!focusTimer && !focusTimer.pausedAt, 250);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!justCompleted) return;
    const a = setTimeout(() => setFlash(true), 0);
    const b = setTimeout(() => setFlash(false), 8000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [justCompleted]);
  const recent = flash && !timer;

  const planned = (focusTimer?.plannedMin ?? minutes) * 60_000;
  const elapsed = focusTimer ? elapsedMs(focusTimer, now) : 0;
  const remaining = Math.max(0, planned - elapsed);
  const status = focusTimer ? (focusTimer.pausedAt ? t.focus.paused : t.focus.running) : recent ? t.focus.done : t.focus.ready;
  const today = todayTotals(sessions);
  const timeFmt = new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-US", { hour: "2-digit", minute: "2-digit" });
  const options = PRESETS.includes(minutes) ? PRESETS : [...PRESETS, minutes].sort((a, b) => a - b);

  const begin = () => {
    if (timer && timer.kind !== "focus") finishTimer();
    startTimer("focus", minutes, task.trim());
  };

  return (
    <div>
      <PageHeader eyebrow={t.focus.eyebrow} title={t.focus.title} />
      <div className="grid gap-5 grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="card px-8 py-7 flex flex-col items-center rise" style={{ ["--i" as string]: 1 }}>
          <label className="w-full">
            <span className="meta block mb-2">{t.focus.taskLabel}</span>
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              disabled={!!focusTimer}
              placeholder={t.focus.taskPlaceholder}
              maxLength={90}
              className="display w-full bg-transparent border-0 border-b-2 border-line focus:border-accent outline-none pb-2 text-[26px] italic placeholder:text-ink-3 placeholder:opacity-70 transition-colors disabled:opacity-80"
              style={{ fontWeight: 400, letterSpacing: "-0.01em" }}
            />
          </label>
          <div className="my-6">
            <TimerDial size={320} progress={focusTimer ? elapsed / planned : 0} label={status} digits={fmtClock(focusTimer ? remaining : planned)} pulse={recent}>
              <p className="mt-4 text-[13px] text-ink-2 h-5">{focusTimer ? fmt(t.focus.minutesLeft, { n: Math.ceil(remaining / 60_000) }) : fmt(t.focus.planned, { n: minutes })}</p>
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
          </div>
          <div className={cn("mt-5 flex items-center gap-3 transition-opacity", focusTimer && "opacity-40 pointer-events-none")}>
            <span className="meta">{t.focus.presets}</span>
            <Segmented label={t.focus.presets} value={minutes} onChange={setMinutes} options={options.map((m) => ({ value: m, label: `${m}′` }))} />
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <section className="card p-6 rise" style={{ ["--i" as string]: 2 }} aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="display text-[22px]">{t.focus.splitTitle}</h2>
                <p className="text-[13px] text-ink-2 mt-1">{t.focus.splitSub}</p>
              </div>
              <AiBadge />
            </div>
            <Button variant="soft" className="mt-4 w-full" disabled={!task.trim() || split.status === "loading" || !!focusTimer} onClick={() => void split.run({ task: task.trim() })}>
              {split.status === "loading" ? <><Sparkles size={16} className="animate-pulse" aria-hidden />{t.focus.splitting}</> : <><Wand2 size={16} aria-hidden />{t.focus.split}</>}
            </Button>
            {!task.trim() && split.status === "idle" && <p className="text-[12px] text-ink-3 mt-2.5 text-center">{t.focus.splitNeedTask}</p>}
            {split.status === "loading" && <div className="mt-4 flex flex-col gap-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
            {split.status === "error" && <p className="mt-3 text-[13px] text-danger">{t.ai.error}</p>}
            {split.status === "done" && split.data && (
              <ol className="mt-4 flex flex-col gap-2">
                {split.data.blocks.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-2 pl-3 pr-2 py-2">
                    <span className="mono text-[12px] text-accent font-semibold w-5">{i + 1}</span>
                    <span className="flex-1 min-w-0 text-[13px] leading-[18px] text-ink">{b.title}</span>
                    <button onClick={() => { setMinutes(Math.max(5, Math.min(180, Math.round(b.minutes)))); setTask(b.title.slice(0, 90)); }} className="shrink-0 h-8 px-3 rounded-full bg-accent-soft text-ink text-[12px] font-bold hover:bg-accent hover:text-on-accent transition-colors">
                      {b.minutes}′ · {t.focus.useBlock}
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
                    <p className="text-[14px] font-semibold text-ink mt-0.5 truncate">{s.task || t.focus.eyebrow}</p>
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
