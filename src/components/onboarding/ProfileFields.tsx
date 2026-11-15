"use client";

import React, { useId } from "react";
import {
  BatteryCharging, BatteryLow, Bell, BellOff, BookOpen, BriefcaseBusiness, CalendarX, CookingPot, Dumbbell, Gamepad2, GraduationCap, Hourglass, Layers,
  Minus, MonitorPlay, MoonStar, Music, Palette, Plus, Repeat, Scale, Shapes, Shuffle, Smartphone, Sun, Sunrise, Target, Coffee, Trees, Users,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { stage } from "@/lib/stage";
import {
  CHRONOTYPES, GOALS, OBSTACLES, OCCUPATIONS, SESSION_LENS, TASTES, WINDOWS, suggestedWeekly,
  type Chronotype, type Goal, type Obstacle, type Occupation, type Profile, type Taste,
} from "@/lib/profile";
import { Segmented, fieldClass } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Set = (patch: Partial<Profile>) => void;
const bump = () => stage.pulse();

const OCC_ICON: Record<Occupation, React.ElementType> = { student: GraduationCap, working: BriefcaseBusiness, both: Layers, other: Shapes };
const CHRONO_ICON: Record<Chronotype, React.ElementType> = { morning: Sunrise, afternoon: Sun, night: MoonStar };
const GOAL_ICON: Record<Goal, React.ElementType> = { focus: Target, rest: Coffee, balance: Scale, distractions: BellOff, routine: Repeat, burnout: BatteryCharging };
const OBST_ICON: Record<Obstacle, React.ElementType> = { distractions: Shuffle, procrastination: Hourglass, tiredness: BatteryLow, phone: Smartphone, notifications: Bell, schedule: CalendarX };
export const TASTE_ICON: Record<Taste, React.ElementType> = { games: Gamepad2, video: MonitorPlay, music: Music, books: BookOpen, sports: Dumbbell, outdoors: Trees, social: Users, creative: Palette, cooking: CookingPot };

/** Large selectable tile (radio or checkbox semantics). */
function Tile({ icon: Icon, label, selected, onClick, role, compact }: { icon: React.ElementType; label: string; selected: boolean; onClick: () => void; role: "radio" | "checkbox"; compact?: boolean }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={() => {
        onClick();
        bump();
      }}
      className={cn(
        "tile group w-full flex items-center gap-3 rounded-[16px] border text-left transition-[border-color,background-color,box-shadow,transform] duration-200 active:scale-[0.98]",
        compact ? "px-3.5 py-2.5 min-h-[50px]" : "px-4 py-3.5 min-h-[60px]",
        selected ? "border-accent bg-accent-soft shadow-[var(--shadow-1)]" : "border-line bg-surface hover:border-line-strong",
      )}
    >
      <span className={cn("grid place-items-center rounded-full shrink-0 transition-colors", compact ? "h-8 w-8" : "h-9 w-9", selected ? "bg-accent text-on-accent" : "bg-bg-2 text-ink-2 group-hover:text-ink")}>
        <Icon size={compact ? 16 : 18} aria-hidden />
      </span>
      <span className="text-[14px] font-semibold text-ink leading-tight">{label}</span>
    </button>
  );
}

export function NameField({ p, set, big }: { p: Profile; set: Set; big?: boolean }) {
  const { t } = useApp();
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">{t.onboarding.steps.name.title}</label>
      <input
        id={id}
        data-autofocus
        value={p.name}
        onChange={(e) => set({ name: e.target.value.slice(0, 40) })}
        onKeyDown={() => stage.pulse()}
        placeholder={t.auth.namePh}
        autoComplete="nickname"
        className={big ? "display w-full bg-transparent border-0 border-b-2 border-line-strong focus:border-accent outline-none pb-2 text-[34px] text-ink placeholder:text-ink-3 transition-colors" : fieldClass}
        style={big ? { fontWeight: 420, letterSpacing: "-0.01em" } : undefined}
      />
    </div>
  );
}

export function LanguageField() {
  const { t, lang, setLang } = useApp();
  return (
    <div className="flex items-center gap-4">
      <span className="text-[13px] font-semibold text-ink">{t.onboarding.steps.name.lang}</span>
      <Segmented label={t.onboarding.steps.name.lang} value={lang} onChange={setLang} options={[{ value: "es", label: t.settings.spanish }, { value: "en", label: t.settings.english }]} />
    </div>
  );
}

export function OccupationField({ p, set, compact }: { p: Profile; set: Set; compact?: boolean }) {
  const { t } = useApp();
  return (
    <div role="radiogroup" aria-label={t.onboarding.steps.occupation.title} className="grid grid-cols-2 gap-3">
      {OCCUPATIONS.map((o) => (
        <Tile key={o} role="radio" compact={compact} icon={OCC_ICON[o]} label={t.profile.occupation[o]} selected={p.occupation === o} onClick={() => set({ occupation: o })} />
      ))}
    </div>
  );
}

function Slider({ label, value, max, onChange, tone }: { label: string; value: number; max: number; onChange: (v: number) => void; tone: "focus" | "leisure" | "screen" }) {
  const id = useId();
  const { t } = useApp();
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label htmlFor={id} className="text-[13.5px] font-semibold text-ink flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", tone === "focus" ? "bg-[var(--c-focus)]" : tone === "leisure" ? "bg-[var(--c-leisure)]" : "bg-ink-3")} aria-hidden />
          {label}
        </label>
        <span className="mono text-[13px] text-ink tabular-nums whitespace-nowrap shrink-0 pl-3">{t.common.hours.replace("{n}", String(value))}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
          bump();
        }}
        className={cn("range w-full", `range-${tone}`)}
        style={{ ["--p" as string]: `${(value / max) * 100}%` }}
        aria-valuetext={t.common.hours.replace("{n}", String(value))}
      />
    </div>
  );
}

/** 24-hour ring that fills as the sliders move. */
function DayRing({ p }: { p: Profile }) {
  const { t } = useApp();
  const R = 74;
  const C = 2 * Math.PI * R;
  const f = Math.min(24, p.focusH) / 24;
  const l = Math.min(24 - p.focusH, p.leisureH) / 24;
  const r2 = 56;
  const C2 = 2 * Math.PI * r2;
  const s = Math.min(24, p.screenH) / 24;
  return (
    <figure className="relative h-[196px] w-[196px] shrink-0" aria-label={t.onboarding.steps.day.ring}>
      <svg viewBox="0 0 196 196" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="98" cy="98" r={R} fill="none" stroke="var(--bg-2)" strokeWidth="16" />
        <circle cx="98" cy="98" r={R} fill="none" stroke="var(--c-focus)" strokeWidth="16" strokeDasharray={`${f * C} ${C}`} className="ring-seg" />
        <circle cx="98" cy="98" r={R} fill="none" stroke="var(--c-leisure)" strokeWidth="16" strokeDasharray={`${l * C} ${C}`} strokeDashoffset={-f * C} className="ring-seg" />
        <circle cx="98" cy="98" r={r2} fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle cx="98" cy="98" r={r2} fill="none" stroke="var(--ink-3)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${s * C2} ${C2}`} className="ring-seg" />
      </svg>
      <figcaption className="absolute inset-0 grid place-items-center text-center">
        <span>
          <span className="display block text-[30px] text-ink">24 h</span>
          <span className="meta block mt-1">{t.onboarding.steps.day.ring}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function DayFields({ p, set, compact }: { p: Profile; set: Set; compact?: boolean }) {
  const { t } = useApp();
  const S = t.onboarding.steps.day;
  return (
    <div className={cn("flex gap-8 items-center", compact && "gap-6")}>
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        <Slider tone="focus" label={S.focus} value={p.focusH} max={16} onChange={(v) => set({ focusH: v, leisureH: Math.min(p.leisureH, 24 - v), weeklyGoalH: p.completed ? p.weeklyGoalH : suggestedWeekly(v) })} />
        <Slider tone="leisure" label={S.leisure} value={p.leisureH} max={16} onChange={(v) => set({ leisureH: Math.min(v, 24 - p.focusH) })} />
        <Slider tone="screen" label={S.screen} value={p.screenH} max={18} onChange={(v) => set({ screenH: v })} />
      </div>
      {!compact && <DayRing p={p} />}
    </div>
  );
}

export function RhythmFields({ p, set, compact }: { p: Profile; set: Set; compact?: boolean }) {
  const { t } = useApp();
  const S = t.onboarding.steps.rhythm;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[13px] font-semibold text-ink mb-2.5">{S.type}</p>
        <div role="radiogroup" aria-label={S.type} className="grid grid-cols-3 gap-3">
          {CHRONOTYPES.map((c) => (
            <Tile key={c} role="radio" compact={compact} icon={CHRONO_ICON[c]} label={t.profile.chronotype[c]} selected={p.chronotype === c} onClick={() => set({ chronotype: c })} />
          ))}
        </div>
      </div>
      <div className={cn("grid gap-6", compact ? "grid-cols-2" : "grid-cols-1")}>
        <div>
          <p className="text-[13px] font-semibold text-ink mb-2.5">{S.window}</p>
          <Segmented label={S.window} value={p.window ?? ("none" as never)} onChange={(v) => { set({ window: v }); bump(); }} options={WINDOWS.map((w) => ({ value: w, label: t.profile.window[w] }))} className="w-full" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-ink mb-2.5">{S.length}</p>
          <Segmented label={S.length} value={p.sessionLen} onChange={(v) => { set({ sessionLen: v }); bump(); }} options={SESSION_LENS.map((m) => ({ value: m, label: `${m} min` }))} className="w-full" />
        </div>
      </div>
    </div>
  );
}

export function GoalsField({ p, set, compact }: { p: Profile; set: Set; compact?: boolean }) {
  const { t } = useApp();
  const S = t.onboarding.steps.goals;
  const full = p.goals.length >= 3;
  const toggle = (g: Goal) => set({ goals: p.goals.includes(g) ? p.goals.filter((x) => x !== g) : full ? p.goals : [...p.goals, g] });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div role="group" aria-label={S.max} className={cn("grid gap-3", compact ? "grid-cols-3" : "grid-cols-2")}>
          {GOALS.map((g) => {
            const on = p.goals.includes(g);
            return (
              <div key={g} className={cn(!on && full && "opacity-55")}>
                <Tile role="checkbox" compact={compact} icon={GOAL_ICON[g]} label={t.profile.goals[g]} selected={on} onClick={() => toggle(g)} />
              </div>
            );
          })}
        </div>
        <p className="text-[12.5px] text-ink-2 mt-2.5" aria-live="polite">{S.max} · {p.goals.length}/3</p>
      </div>
      <WeeklyGoal p={p} set={set} />
    </div>
  );
}

export function WeeklyGoal({ p, set }: { p: Profile; set: Set }) {
  const { t } = useApp();
  const S = t.onboarding.steps.goals;
  const id = useId();
  const step = (d: number) => {
    set({ weeklyGoalH: Math.max(1, Math.min(80, p.weeklyGoalH + d)) });
    bump();
  };
  return (
    <div className="flex items-center justify-between gap-6 rounded-[18px] border border-line bg-surface-2 px-5 py-4">
      <div>
        <p id={id} className="text-[14px] font-semibold text-ink">{S.weekly}</p>
        <p className="text-[12.5px] text-ink-2 mt-0.5">{S.weeklyHint}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0" role="group" aria-labelledby={id}>
        <button type="button" onClick={() => step(-1)} aria-label="−1 h" className="h-10 w-10 rounded-full border border-line-strong bg-surface grid place-items-center text-ink hover:border-ink-3 transition-colors"><Minus size={16} aria-hidden /></button>
        <output className="display text-[30px] w-[86px] text-center text-ink tabular-nums" aria-live="polite">{p.weeklyGoalH}<span className="text-[15px] font-sans text-ink-2 ml-1" style={{ fontVariationSettings: "normal" }}>h</span></output>
        <button type="button" onClick={() => step(1)} aria-label="+1 h" className="h-10 w-10 rounded-full border border-line-strong bg-surface grid place-items-center text-ink hover:border-ink-3 transition-colors"><Plus size={16} aria-hidden /></button>
      </div>
    </div>
  );
}

export function ObstaclesField({ p, set, compact }: { p: Profile; set: Set; compact?: boolean }) {
  const { t } = useApp();
  return (
    <div role="group" aria-label={t.onboarding.steps.obstacles.title} className={cn("grid gap-3", compact ? "grid-cols-3" : "grid-cols-2")}>
      {OBSTACLES.map((o) => (
        <Tile key={o} role="checkbox" compact={compact} icon={OBST_ICON[o]} label={t.profile.obstacles[o]} selected={p.obstacles.includes(o)} onClick={() => set({ obstacles: p.obstacles.includes(o) ? p.obstacles.filter((x) => x !== o) : [...p.obstacles, o] })} />
      ))}
    </div>
  );
}

export function TastesField({ p, set, compact }: { p: Profile; set: Set; compact?: boolean }) {
  const { t } = useApp();
  return (
    <div role="group" aria-label={t.onboarding.steps.tastes.title} className="grid grid-cols-3 gap-3">
      {TASTES.map((x) => (
        <Tile key={x} role="checkbox" compact={compact} icon={TASTE_ICON[x]} label={t.profile.tastes[x]} selected={p.tastes.includes(x)} onClick={() => set({ tastes: p.tastes.includes(x) ? p.tastes.filter((y) => y !== x) : [...p.tastes, x] })} />
      ))}
    </div>
  );
}
