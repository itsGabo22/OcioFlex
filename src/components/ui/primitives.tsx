"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { Sparkles } from "lucide-react";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost"; size?: "md" | "lg" | "icon" };

export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(function Button({ variant = "primary", size = "md", className, ...p }, ref) {
  return (
    <button
      ref={ref}
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none",
        "transition-[transform,background-color,box-shadow,color] duration-200 ease-[var(--ease)] active:scale-[0.97]",
        "disabled:opacity-50 disabled:pointer-events-none",
        size === "md" && "h-10 px-5 text-[14px]",
        size === "lg" && "h-14 px-8 text-[16px]",
        size === "icon" && "h-11 w-11",
        variant === "primary" && "bg-accent text-on-accent shadow-[var(--shadow-2)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-3)]",
        variant === "soft" && "bg-accent-soft text-ink hover:bg-[color-mix(in_srgb,var(--accent-soft)_80%,var(--accent))]",
        variant === "ghost" && "text-ink-2 hover:bg-bg-2 hover:text-ink",
        className,
      )}
    />
  );
});

export function Segmented<T extends string | number>({
  value, onChange, options, label, className,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; label: string; className?: string }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div role="radiogroup" aria-label={label} className={cn("relative inline-grid rounded-full bg-bg-2 p-1 border border-line", className)} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full bg-surface shadow-[var(--shadow-1)] transition-transform duration-300 ease-[var(--ease)]"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${idx * 100}%)`, left: 4 }}
      />
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn("relative z-10 h-9 px-4 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors", o.value === value ? "text-ink" : "text-ink-2 hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...p}
      aria-pressed={active}
      className={cn(
        "h-9 px-4 rounded-full text-[13px] font-semibold border transition-all duration-200",
        active ? "bg-accent text-on-accent border-accent" : "bg-surface border-line text-ink-2 hover:border-line-strong hover:text-ink",
        className,
      )}
    />
  );
}

export function AiBadge({ className }: { className?: string }) {
  const { ai, t } = useApp();
  const live = ai?.mode === "live";
  return (
    <span
      title={live ? t.ai.liveTip : t.ai.demoTip}
      className={cn("inline-flex items-center gap-1.5 h-6 pl-2 pr-2.5 rounded-full text-[11px] font-bold tracking-[0.08em] uppercase border", live ? "bg-accent-soft text-ink border-transparent" : "bg-surface-2 text-ink-2 border-line-strong border-dashed", className)}
    >
      <Sparkles size={12} aria-hidden className={live ? "text-accent" : "text-ink-3"} />
      {live ? t.ai.live : t.ai.demo}
    </span>
  );
}

export function PageHeader({ eyebrow, title, sub, right }: { eyebrow: string; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-6 mb-8 rise" style={{ ["--i" as string]: 0 }}>
      <div className="min-w-0">
        <p className="meta mb-3 text-accent">{eyebrow}</p>
        <h1 className="display text-[44px] leading-[1.02] text-ink text-balance">{title}</h1>
        {sub && <p className="mt-3 text-ink-2 text-[15px]">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function EmptyState({ title, hint, art }: { title: string; hint: string; art?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-8 px-4">
      <div className="mb-1" aria-hidden>
        {art ?? <HorizonArt />}
      </div>
      <p className="font-semibold text-ink text-[14px]">{title}</p>
      <p className="text-ink-2 text-[13px] max-w-[240px]">{hint}</p>
    </div>
  );
}

/** Small SVG sunrise used by empty states. */
export function HorizonArt({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 84 52" fill="none">
      <circle cx="42" cy="34" r="18" fill="var(--accent-soft)" />
      <circle cx="42" cy="34" r="10" fill="var(--accent-2)" opacity=".85" />
      <path d="M4 40h76" stroke="var(--line-strong)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 46h48" stroke="var(--line)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 8v-4M20 14l-3-3M64 14l3-3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}
