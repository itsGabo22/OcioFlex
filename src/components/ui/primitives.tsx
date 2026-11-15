"use client";

import React, { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost" | "outline" | "danger"; size?: "sm" | "md" | "lg" | "icon" };

export const Button = React.forwardRef<HTMLButtonElement, BtnProps>(function Button({ variant = "primary", size = "md", className, type = "button", ...p }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      {...p}
      className={cn(
        "btn inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none",
        "transition-[transform,background-color,box-shadow,color,border-color] duration-200 ease-[var(--ease)] active:scale-[0.97]",
        size === "sm" && "h-9 px-4 text-[13px]",
        size === "md" && "h-10 px-5 text-[14px]",
        size === "lg" && "h-14 px-8 text-[16px]",
        size === "icon" && "h-11 w-11",
        variant === "primary" && "bg-accent text-on-accent shadow-[var(--shadow-2)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-3)]",
        variant === "soft" && "bg-accent-soft text-ink hover:bg-[color-mix(in_srgb,var(--accent-soft)_80%,var(--accent))]",
        variant === "ghost" && "text-ink-2 hover:bg-bg-2 hover:text-ink",
        variant === "outline" && "border border-line-strong text-ink bg-surface hover:border-ink-3",
        variant === "danger" && "bg-danger text-white hover:brightness-110 shadow-[var(--shadow-1)]",
        className,
      )}
    />
  );
});

export function Segmented<T extends string | number>({
  value, onChange, options, label, className, size = "md",
}: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; label: string; className?: string; size?: "sm" | "md" }) {
  const found = options.findIndex((o) => o.value === value);
  const idx = Math.max(0, found);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (idx + d + options.length) % options.length;
    onChange(options[n].value);
    refs.current[n]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} className={cn("relative inline-grid rounded-full bg-bg-2 p-1 border border-line", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full bg-surface shadow-[var(--shadow-1)] transition-transform duration-300 ease-[var(--ease)]"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${idx * 100}%)`, left: 4, opacity: found < 0 ? 0 : 1 }}
      />
      {options.map((o, i) => (
        <button
          key={String(o.value)}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={i === idx ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cn("relative z-10 rounded-full font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap", size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-9 px-4 text-[13px]", o.value === value ? "text-ink" : "text-ink-2 hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, className, icon: Icon, children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; icon?: React.ElementType }) {
  return (
    <button
      type="button"
      {...p}
      aria-pressed={active}
      className={cn(
        "chip h-9 px-4 rounded-full text-[13px] font-semibold border inline-flex items-center gap-2 transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97]",
        active ? "bg-accent text-on-accent border-accent" : "bg-surface border-line text-ink-2 hover:border-line-strong hover:text-ink",
        className,
      )}
    >
      {Icon && <Icon size={15} aria-hidden />}
      {children}
    </button>
  );
}

/** Flex's mark: a tiny Tide Orb with its orbit, drawn as geometry (no sparkles, no wands). */
export function FlexMark({ size = 22, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <radialGradient id={`fx${id}`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor="var(--glow)" />
          <stop offset="1" stopColor="var(--accent)" />
        </radialGradient>
      </defs>
      <g transform="rotate(-18 12 12)" fill="none" stroke="var(--accent-2)" strokeWidth="1.4" strokeLinecap="round">
        <path d="M1.6 12A10.4 3.6 0 0 1 22.4 12" opacity=".55" />
      </g>
      <circle cx="12" cy="12" r="6.6" fill={`url(#fx${id})`} />
      <g transform="rotate(-18 12 12)" fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round">
        <path d="M1.6 12A10.4 3.6 0 0 0 22.4 12" />
      </g>
    </svg>
  );
}

/** "Flex" byline used on assistant cards instead of AI badges. */
export function FlexByline({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-2", className)}>
      <FlexMark size={18} />
      Flex
    </span>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-6 mb-7 rise" style={{ ["--i" as string]: 0 }}>
      <div className="min-w-0">
        <h1 className="display text-[44px] leading-[1.04] text-ink text-balance">{title}</h1>
        {sub && <p className="mt-2.5 text-ink-2 text-[15px]">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function EmptyState({ title, hint, art, action }: { title: string; hint: string; art?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-8 px-4">
      <div className="mb-1" aria-hidden>
        {art ?? <HorizonArt />}
      </div>
      <p className="font-semibold text-ink text-[14px]">{title}</p>
      <p className="text-ink-2 text-[13px] max-w-[280px] text-pretty">{hint}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Small geometric sunrise used by empty states. */
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

export const fieldClass =
  "field w-full h-12 rounded-[14px] border border-line-strong bg-surface px-4 text-[15px] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-3 focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)] select-text";

export function Field({ label, hint, error, children, id }: { label: string; hint?: React.ReactNode; error?: string | null; children: React.ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <div className="text-[12.5px] text-ink-2">{hint}</div>}
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}

export function Checkbox({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2.5 text-[13.5px] text-ink-2 cursor-pointer select-none">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className="h-5 w-5 rounded-[6px] border-[1.5px] border-line-strong bg-surface grid place-items-center transition-colors peer-checked:bg-accent peer-checked:border-accent peer-focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_35%,transparent)]">
        <svg width="12" height="12" viewBox="0 0 12 12" className={cn("transition-opacity", checked ? "opacity-100" : "opacity-0")}>
          <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label}
    </label>
  );
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside `ref` and returns focus to where it was when the trap ends. */
export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

export function Dialog({ open, onClose, label, children, className }: { open: boolean; onClose: () => void; label: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[rgba(27,26,23,0.38)] backdrop-blur-[3px] p-6" style={{ animation: "fade-in 200ms var(--ease) both" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={label} className={cn("card !bg-surface w-full max-w-[480px] p-7 shadow-[var(--shadow-3)]", className)} style={{ animation: "pop-in 320ms var(--ease) both" }}>
        {children}
      </div>
    </div>
  );
}
