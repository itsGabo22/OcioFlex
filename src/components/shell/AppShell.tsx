"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, Focus, House, PanelLeftClose, PanelLeftOpen, Settings, Target, CircleCheck, CircleAlert } from "lucide-react";
import { elapsedMs, useApp, useNow } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { AiBadge } from "@/components/ui/primitives";

function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <radialGradient id="mk" cx="32%" cy="28%" r="80%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".3" stopColor="var(--glow)" />
          <stop offset=".65" stopColor="var(--accent-2)" />
          <stop offset="1" stopColor="var(--accent)" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#mk)" />
    </svg>
  );
}

export const fmtClock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function NavItem({ href, icon: Icon, label, collapsed }: { href: string; icon: React.ElementType; label: string; collapsed: boolean }) {
  const path = usePathname();
  const active = href === "/" ? path === "/" : path.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 h-11 rounded-[14px] px-3 text-[14px] font-semibold transition-colors duration-200",
        active ? "bg-accent-soft text-ink" : "text-ink-2 hover:bg-bg-2 hover:text-ink",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon size={19} aria-hidden className={cn("shrink-0 transition-colors", active ? "text-accent" : "text-ink-3 group-hover:text-ink-2")} />
      {!collapsed && <span className="leading-tight">{label}</span>}
      {active && !collapsed && <span aria-hidden className="absolute right-3 h-1.5 w-1.5 rounded-full bg-accent" />}
    </Link>
  );
}

function MoodSwitch({ collapsed }: { collapsed: boolean }) {
  const { mood, setMood, t } = useApp();
  if (collapsed) {
    return (
      <button
        onClick={() => setMood(mood === "foco" ? "ocio" : "foco")}
        aria-label={`${t.ctx.label}: ${mood === "foco" ? t.ctx.foco : t.ctx.ocio}`}
        className="h-11 w-11 mx-auto rounded-full bg-accent text-on-accent grid place-items-center shadow-[var(--shadow-2)]"
      >
        {mood === "foco" ? <Target size={18} /> : <Coffee size={18} />}
      </button>
    );
  }
  return (
    <div>
      <p className="meta mb-2 px-1">{t.ctx.label}</p>
      <div role="radiogroup" aria-label={t.ctx.label} className="relative grid grid-cols-2 rounded-full bg-bg-2 border border-line p-1">
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-accent shadow-[var(--shadow-2)] transition-transform duration-500 ease-[var(--ease)]"
          style={{ transform: mood === "ocio" ? "translateX(100%)" : "none" }}
        />
        {(["foco", "ocio"] as const).map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={mood === m}
            onClick={() => setMood(m)}
            className={cn("relative z-10 h-9 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors duration-300", mood === m ? "text-on-accent" : "text-ink-2 hover:text-ink")}
          >
            {m === "foco" ? <Target size={14} aria-hidden /> : <Coffee size={14} aria-hidden />}
            {m === "foco" ? t.ctx.foco : t.ctx.ocio}
          </button>
        ))}
      </div>
    </div>
  );
}

function RunningCard({ collapsed }: { collapsed: boolean }) {
  const { timer, t } = useApp();
  const now = useNow(!!timer && !timer.pausedAt, 500);
  if (!timer) return null;
  const ms = timer.kind === "focus" ? Math.max(0, timer.plannedMin * 60_000 - elapsedMs(timer, now)) : elapsedMs(timer, now);
  const href = timer.kind === "focus" ? "/deep-work" : "/entertainment";
  if (collapsed) {
    return (
      <Link href={href} title={t.nav.running} className="h-11 w-11 mx-auto rounded-full border border-accent grid place-items-center text-accent">
        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
      </Link>
    );
  }
  return (
    <Link href={href} className="block rounded-[14px] border border-line bg-surface px-3.5 py-3 hover:border-line-strong transition-colors">
      <p className="meta flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full bg-accent", !timer.pausedAt && "animate-pulse")} />
        {t.nav.running}
      </p>
      <p className="mono text-[22px] font-medium mt-1 text-ink tabular-nums">{fmtClock(ms)}</p>
      {timer.task && <p className="text-[12px] text-ink-2 truncate mt-0.5">{timer.task}</p>}
    </Link>
  );
}

function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className="pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-4 h-11 rounded-full bg-ink text-bg text-[13px] font-semibold shadow-[var(--shadow-3)]" style={{ animation: "toast-in 300ms var(--ease) both" }}>
          {x.tone === "success" && <CircleCheck size={16} className="text-glow" />}
          {x.tone === "error" && <CircleAlert size={16} className="text-[#ffb4a9]" />}
          {x.message}
        </div>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, t, setMood } = useApp();
  const path = usePathname();
  const [manual, setManual] = useState<boolean | null>(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 1100);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  /* each page carries its own mood */
  useEffect(() => {
    if (!ready) return;
    if (path.startsWith("/deep-work")) setMood("foco");
    else if (path.startsWith("/entertainment")) setMood("ocio");
  }, [path, ready, setMood]);

  const collapsed = manual ?? narrow;

  return (
    <>
      <div className="canvas-layer canvas-foco" aria-hidden />
      <div className="canvas-layer canvas-ocio" aria-hidden />
      <div className="grain" aria-hidden />
      {ready && (
        <div className="h-screen flex">
          <aside
            className={cn("shrink-0 h-full flex flex-col border-r border-line bg-[color-mix(in_srgb,var(--surface-2)_82%,transparent)] backdrop-blur-md transition-[width] duration-300 ease-[var(--ease)]", collapsed ? "w-[76px] px-3" : "w-[236px] px-4")}
          >
            <div className={cn("flex items-center h-[72px] shrink-0", collapsed ? "justify-center" : "gap-3 px-1")}>
              <Mark />
              {!collapsed && <span className="display text-[24px] text-ink">OcioFlex</span>}
            </div>
            <nav aria-label={t.nav.main} className="flex flex-col gap-1 mt-2">
              <NavItem href="/" icon={House} label={t.nav.home} collapsed={collapsed} />
              <NavItem href="/deep-work" icon={Focus} label={t.nav.focus} collapsed={collapsed} />
              <NavItem href="/entertainment" icon={Coffee} label={t.nav.rest} collapsed={collapsed} />
              <NavItem href="/settings" icon={Settings} label={t.nav.settings} collapsed={collapsed} />
            </nav>
            <div className="mt-auto flex flex-col gap-4 pb-5">
              <RunningCard collapsed={collapsed} />
              {!collapsed && <AiBadge className="self-start" />}
              <MoodSwitch collapsed={collapsed} />
              <button
                onClick={() => setManual(!collapsed)}
                aria-label={collapsed ? t.nav.expand : t.nav.collapse}
                title={collapsed ? t.nav.expand : t.nav.collapse}
                className={cn("h-9 rounded-full text-ink-3 hover:text-ink hover:bg-bg-2 flex items-center transition-colors", collapsed ? "justify-center" : "px-3 gap-2 text-[13px] font-semibold")}
              >
                {collapsed ? <PanelLeftOpen size={17} /> : <><PanelLeftClose size={17} />{t.nav.collapse}</>}
              </button>
            </div>
          </aside>
          <main key={path} className="flex-1 min-w-0 h-full overflow-y-auto">
            <div className="mx-auto w-full max-w-[1120px] px-10 py-10 pb-16">{children}</div>
          </main>
        </div>
      )}
      <Toasts />
    </>
  );
}
