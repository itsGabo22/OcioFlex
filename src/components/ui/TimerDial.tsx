"use client";

import React from "react";
import { cn } from "@/lib/utils";

/** Ring + big Fraunces digits. progress ∈ [0,1]; pass `pulse` to celebrate a finished session. */
export function TimerDial({ progress, label, digits, size = 400, pulse, children }: { progress: number; label: string; digits: string; size?: number; pulse?: boolean; children?: React.ReactNode }) {
  const stroke = 7;
  const r = size / 2 - stroke * 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  const angle = p * 2 * Math.PI - Math.PI / 2;
  return (
    <div className={cn("relative grid place-items-center rounded-full", pulse && "pulse-once")} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90 overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="dial" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent-2)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const a = (i / 12) * Math.PI * 2;
          const r1 = r + 16, r2 = r + 22;
          return <line key={i} x1={size / 2 + Math.cos(a) * r1} y1={size / 2 + Math.sin(a) * r1} x2={size / 2 + Math.cos(a) * r2} y2={size / 2 + Math.sin(a) * r2} stroke="var(--line-strong)" strokeWidth={1.5} strokeLinecap="round" />;
        })}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#dial)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      {p > 0.002 && (
        <span
          aria-hidden
          className="absolute h-4 w-4 rounded-full bg-surface border-[3px] border-accent shadow-[var(--shadow-2)]"
          style={{ left: size / 2 + Math.cos(angle) * r - 8, top: size / 2 + Math.sin(angle) * r - 8, transition: "left 1s linear, top 1s linear" }}
        />
      )}
      <div className="relative z-10 flex flex-col items-center">
        <p className="meta mb-3 text-accent">{label}</p>
        <p className="display-timer text-ink tabular-nums" style={{ fontSize: size * 0.27 }} aria-live="off">{digits}</p>
        {children}
      </div>
    </div>
  );
}
