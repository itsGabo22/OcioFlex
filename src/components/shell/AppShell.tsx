"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Coffee, Focus, House, PanelLeftClose, PanelLeftOpen, Settings, Target, CircleCheck, CircleAlert, LifeBuoy, LogOut, UserRound, ChevronsUpDown } from "lucide-react";
import { elapsedMs, useApp, useNow } from "@/context/AppContext";
import { Gate } from "@/components/auth/Gate";
import { Tour } from "@/components/tour/Tour";
import { cn } from "@/lib/utils";

export function Mark({ size = 30 }: { size?: number }) {
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
      aria-label={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 min-h-11 py-2 rounded-[14px] px-3 text-[14px] font-semibold transition-colors duration-200",
        active ? "bg-accent-soft text-ink" : "text-ink-2 hover:bg-bg-2 hover:text-ink",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon size={19} aria-hidden className={cn("shrink-0 transition-colors", active ? "text-accent" : "text-ink-3 group-hover:text-ink-2")} />
      {!collapsed && <span className="leading-tight">{label}</span>}
      {active && !collapsed && <span aria-hidden className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
    </Link>
  );
}

function MoodSwitch({ collapsed }: { collapsed: boolean }) {
  const { mood, setMood, t } = useApp();
  if (collapsed) {
    return (
      <button
        data-tour="mood"
        onClick={() => setMood(mood === "foco" ? "ocio" : "foco")}
        aria-label={`${t.ctx.label}: ${mood === "foco" ? t.ctx.foco : t.ctx.ocio}`}
        title={`${t.ctx.label}: ${mood === "foco" ? t.ctx.foco : t.ctx.ocio}`}
        className="h-11 w-11 mx-auto rounded-full bg-accent text-on-accent grid place-items-center shadow-[var(--shadow-2)]"
      >
        {mood === "foco" ? <Target size={18} /> : <Coffee size={18} />}
      </button>
    );
  }
  return (
    <div data-tour="mood">
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
      <Link href={href} title={`${t.nav.running} · ${fmtClock(ms)}`} aria-label={`${t.nav.running} · ${fmtClock(ms)}`} className="h-11 w-11 mx-auto rounded-full border border-accent grid place-items-center text-accent">
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

export function Initials({ name, size = 34 }: { name: string; size?: number }) {
  const ini = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "·";
  return (
    <span
      aria-hidden
      className="shrink-0 rounded-full grid place-items-center text-white font-bold shadow-[var(--shadow-1)]"
      style={{ width: size, height: size, fontSize: size * 0.38, background: "radial-gradient(circle at 32% 28%, var(--glow) 0%, var(--accent-2) 45%, var(--accent) 100%)", textShadow: "0 1px 2px rgba(0,0,0,.25)" }}
    >
      {ini}
    </span>
  );
}

function UserChip({ collapsed }: { collapsed: boolean }) {
  const { user, profile, t, logout } = useApp();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);
  const router = useRouter();
  const name = profile.name || user?.displayName || "";

  useEffect(() => {
    if (!open) return;
    items.current[0]?.focus();
    const off = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    const list = items.current.filter(Boolean) as HTMLElement[];
    const at = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      setOpen(false);
      (box.current?.querySelector("[aria-haspopup]") as HTMLElement | null)?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      list[(at + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus();
    }
  };

  return (
    <div ref={box} className="relative" data-tour="account" onKeyDown={onKey}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t.nav.account}: ${name}`}
        onClick={() => setOpen((o) => !o)}
        className={cn("w-full flex items-center gap-3 rounded-[14px] transition-colors hover:bg-bg-2", collapsed ? "justify-center p-1.5" : "px-2 py-2")}
      >
        <Initials name={name} />
        {!collapsed && (
          <>
            <span className="min-w-0 text-left">
              <span className="block text-[13.5px] font-semibold text-ink truncate">{name}</span>
              <span className="block text-[12px] text-ink-2 truncate">{user?.sample ? t.nav.sample : user?.login}</span>
            </span>
            <ChevronsUpDown size={15} className="ml-auto text-ink-3 shrink-0" aria-hidden />
          </>
        )}
      </button>
      {open && (
        <div role="menu" aria-label={t.nav.account} className={cn("absolute bottom-full mb-2 z-50 card !bg-surface p-1.5 min-w-[200px] shadow-[var(--shadow-3)]", collapsed ? "left-0" : "left-0 right-0")} style={{ animation: "pop-in 220ms var(--ease) both" }}>
          <button
            ref={(el) => {
              items.current[0] = el;
            }}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push("/settings#profile");
            }}
            className="w-full flex items-center gap-2.5 h-10 px-3 rounded-[10px] text-[13.5px] font-semibold text-ink hover:bg-bg-2 focus-visible:bg-bg-2"
          >
            <UserRound size={16} className="text-ink-2" aria-hidden />
            {t.nav.profile}
          </button>
          <button
            ref={(el) => {
              items.current[1] = el;
            }}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="w-full flex items-center gap-2.5 h-10 px-3 rounded-[10px] text-[13.5px] font-semibold text-ink hover:bg-bg-2 focus-visible:bg-bg-2"
          >
            <LogOut size={16} className="text-ink-2" aria-hidden />
            {t.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}

function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className="pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-4 min-h-11 py-2.5 max-w-[420px] rounded-[22px] bg-ink text-bg text-[13px] leading-[18px] font-semibold shadow-[var(--shadow-3)]" style={{ animation: "toast-in 300ms var(--ease) both" }}>
          {x.tone === "success" && <CircleCheck size={16} className="text-glow shrink-0" />}
          {x.tone === "error" && <CircleAlert size={16} className="text-[#ffb4a9] shrink-0" />}
          {x.message}
        </div>
      ))}
    </div>
  );
}

/** The scrolling page; keyed by route so scroll position and the top shadow reset per page. */
function Main({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  return (
    <main className={cn("flex-1 min-w-0 h-full overflow-y-auto scroll-shadow", scrolled && "is-scrolled")} onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 4)}>
      <div className="page">{children}</div>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t, setMood, ui, setUi, startTour } = useApp();
  const path = usePathname();
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const on = () => setNarrow(window.innerWidth < 1100);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  /* each page carries its own mood */
  useEffect(() => {
    if (path.startsWith("/deep-work")) setMood("foco");
    else if (path.startsWith("/entertainment")) setMood("ocio");
  }, [path, setMood]);

  const collapsed = ui.rail ?? narrow;

  return (
    <div className="h-screen flex app-enter">
      <aside className={cn("shrink-0 h-full flex flex-col border-r border-line bg-[color-mix(in_srgb,var(--surface-2)_82%,transparent)] backdrop-blur-md transition-[width] duration-300 ease-[var(--ease)]", collapsed ? "w-[76px] px-3" : "w-[236px] px-4")}>
        <div className={cn("flex items-center h-[76px] shrink-0", collapsed ? "justify-center" : "gap-3 px-1")}>
          <Mark />
          {!collapsed && <span className="wordmark text-[25px] text-ink">OcioFlex</span>}
        </div>
        <nav aria-label={t.nav.main} className="flex flex-col gap-1 mt-1" data-tour="nav">
          <NavItem href="/" icon={House} label={t.nav.home} collapsed={collapsed} />
          <NavItem href="/deep-work" icon={Focus} label={t.nav.focus} collapsed={collapsed} />
          <NavItem href="/entertainment" icon={Coffee} label={t.nav.rest} collapsed={collapsed} />
          <NavItem href="/settings" icon={Settings} label={t.nav.settings} collapsed={collapsed} />
        </nav>
        <div className="mt-auto flex flex-col gap-3 pb-4">
          <RunningCard collapsed={collapsed} />
          <MoodSwitch collapsed={collapsed} />
          <div className="h-px bg-line my-1" aria-hidden />
          <UserChip collapsed={collapsed} />
          <div className={cn("flex items-center", collapsed ? "flex-col gap-1" : "gap-1")}>
            <button
              onClick={startTour}
              aria-label={t.nav.help}
              title={t.nav.help}
              className={cn("h-9 rounded-full text-ink-2 hover:text-ink hover:bg-bg-2 flex items-center transition-colors", collapsed ? "w-11 justify-center" : "px-3 gap-2 text-[13px] font-semibold")}
            >
              <LifeBuoy size={17} aria-hidden />
              {!collapsed && t.nav.help}
            </button>
            <button
              onClick={() => setUi({ ...ui, rail: !collapsed })}
              aria-label={collapsed ? t.nav.expand : t.nav.collapse}
              title={collapsed ? t.nav.expand : t.nav.collapse}
              className={cn("h-9 rounded-full text-ink-2 hover:text-ink hover:bg-bg-2 flex items-center justify-center transition-colors", collapsed ? "w-11" : "w-9 ml-auto")}
            >
              {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>
        </div>
      </aside>
      <Main key={path}>{children}</Main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { prefsReady } = useApp();
  return (
    <>
      <div className="canvas-layer canvas-foco" aria-hidden />
      <div className="canvas-layer canvas-ocio" aria-hidden />
      <div className="grain" aria-hidden />
      {prefsReady && (
        <Gate>
          <Shell>{children}</Shell>
          <Tour />
        </Gate>
      )}
      <Toasts />
    </>
  );
}
