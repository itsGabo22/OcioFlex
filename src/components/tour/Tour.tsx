"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { fmt, useApp } from "@/context/AppContext";
import { Button, FlexMark, useFocusTrap } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/** Each step points at a real element (`data-tour`) and, when needed, the page it lives on. */
const STEPS: { target: string | null; route?: string }[] = [
  { target: null, route: "/" },
  { target: "nav", route: "/" },
  { target: "mood" },
  { target: "start", route: "/" },
  { target: "splitter", route: "/deep-work" },
  { target: "breaks", route: "/entertainment" },
  { target: "account" },
];

type Rect = { x: number; y: number; w: number; h: number };
const PAD = 10;

/** Home-grown coach marks: spotlight over the live UI, focus-trapped card, Esc to close. No tour library. */
export function Tour() {
  const { tourOpen, endTour, t } = useApp();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [reduced, setReduced] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const path = usePathname();
  const step = STEPS[i];
  const copy = t.tour.steps[i];

  const close = useCallback(() => {
    setI(0);
    setRect(null);
    endTour();
  }, [endTour]);
  useFocusTrap(card, tourOpen, close);

  useEffect(() => {
    const id = window.setTimeout(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), 0);
    return () => clearTimeout(id);
  }, []);

  // navigate when the step lives on another page
  useEffect(() => {
    if (!tourOpen || !step.route || step.route === path) return;
    router.push(step.route);
  }, [tourOpen, step, path, router]);

  // find the target (it may appear a moment after navigation) and keep it tracked
  useLayoutEffect(() => {
    if (!tourOpen) return;
    let raf = 0;
    let tries = 0;
    const find = () => {
      if (!step.target) {
        setRect(null);
        return;
      }
      if (step.route && step.route !== path) {
        raf = requestAnimationFrame(find);
        return;
      }
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!el) {
        if (tries++ < 90) raf = requestAnimationFrame(find);
        return;
      }
      el.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      const r = el.getBoundingClientRect();
      setRect({ x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 });
    };
    find();
    const onResize = () => find();
    window.addEventListener("resize", onResize);
    const poll = window.setInterval(find, 400); // follows layout shifts and smooth scrolling
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(poll);
      window.removeEventListener("resize", onResize);
    };
  }, [tourOpen, i, path, step, reduced]);

  if (!tourOpen) return null;

  const last = i === STEPS.length - 1;
  const W = typeof window === "undefined" ? 1280 : window.innerWidth;
  const H = typeof window === "undefined" ? 800 : window.innerHeight;
  const CW = 360;
  let pos: React.CSSProperties = { left: W / 2 - CW / 2, top: H / 2 - 130 };
  if (rect) {
    const right = rect.x + rect.w + 16;
    const below = rect.y + rect.h + 14;
    if (right + CW < W - 16) pos = { left: right, top: Math.min(Math.max(16, rect.y), H - 300) };
    else if (below + 240 < H) pos = { left: Math.min(Math.max(16, rect.x), W - CW - 16), top: below };
    else pos = { left: Math.min(Math.max(16, rect.x), W - CW - 16), top: Math.max(16, rect.y - 250) };
  }

  return (
    <div className="fixed inset-0 z-[80]" aria-live="polite">
      {/* backdrop with a spotlight hole */}
      <div
        className={cn("absolute rounded-[20px] pointer-events-none", !reduced && "transition-all duration-500 ease-[var(--ease)]")}
        style={
          rect
            ? { left: rect.x, top: rect.y, width: rect.w, height: rect.h, boxShadow: "0 0 0 9999px rgba(27,26,23,0.5), 0 0 0 2px color-mix(in srgb, var(--accent) 70%, transparent)" }
            : { left: W / 2, top: H / 2, width: 0, height: 0, boxShadow: "0 0 0 9999px rgba(27,26,23,0.5)" }
        }
        aria-hidden
      />
      <div className="absolute inset-0" onMouseDown={(e) => e.preventDefault()} aria-hidden />
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className={cn("absolute card !bg-surface p-6 shadow-[var(--shadow-3)]", !reduced && "transition-[left,top] duration-500 ease-[var(--ease)]")}
        style={{ ...pos, width: CW }}
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-ink-2">
            <FlexMark size={18} />
            {fmt(t.tour.of, { n: i + 1, m: STEPS.length })}
          </span>
          <button type="button" onClick={close} aria-label={t.tour.skip} className="h-8 w-8 -mr-2 grid place-items-center rounded-full text-ink-2 hover:bg-bg-2 hover:text-ink">
            <X size={16} aria-hidden />
          </button>
        </div>
        <h2 id="tour-title" className="display text-[24px] leading-[1.15] text-ink mt-3">{copy.title}</h2>
        <p id="tour-body" className="text-[14px] leading-[21px] text-ink-2 mt-2">{copy.body}</p>
        <div className="flex items-center gap-1.5 mt-5" aria-hidden>
          {STEPS.map((_, n) => (
            <span key={n} className={cn("h-1.5 rounded-full transition-all duration-300", n === i ? "w-6 bg-accent" : "w-1.5 bg-line-strong")} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-5">
          <Button variant="ghost" size="sm" onClick={close}>{t.tour.skip}</Button>
          <div className="ml-auto flex gap-2">
            {i > 0 && (
              <Button variant="outline" size="sm" onClick={() => setI(i - 1)} aria-label={t.tour.back}>
                <ArrowLeft size={15} aria-hidden />
              </Button>
            )}
            <Button size="sm" data-autofocus onClick={() => (last ? close() : setI(i + 1))}>
              {last ? t.tour.finish : t.tour.next}
              {!last && <ArrowRight size={15} aria-hidden />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
