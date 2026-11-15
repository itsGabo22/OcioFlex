"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";
import { hasWebGL, prefersReducedMotion } from "@/lib/stage";
import { GlBoundary } from "@/components/auth/StageCanvas";

// same chunk as the login stage: one lazy three.js bundle for the whole app
const HeroScene = dynamic(() => import("@/components/three").then((m) => m.HeroScene), { ssr: false });

export function OrbFallback({ ratio }: { ratio: number }) {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="relative h-[280px] w-[280px]">
        <div className="blob h-full w-full" />
        <div className="orbit-ring" style={{ ["--ratio" as string]: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}

/** Home hero: lazy WebGL orb whose ring shows today's focus:leisure balance, with a CSS twin as fallback. */
export function HeroOrb({ ratio }: { ratio: number }) {
  const { mood, t } = useApp();
  const host = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "webgl" | "css">("pending");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion() || !hasWebGL()) {
      const id = window.setTimeout(() => setMode("css"), 0);
      return () => clearTimeout(id);
    }
    const id = window.setTimeout(() => setMode("webgl"), 60);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    const vis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return (
    <div ref={host} role="img" aria-label={t.home.heroAlt} className="absolute inset-y-0 right-0 w-[52%] min-w-[340px]">
      {mode === "css" && <OrbFallback ratio={ratio} />}
      {mode === "webgl" && (
        <GlBoundary onError={() => setMode("css")}>
          <HeroScene palette={mood} ratio={ratio} running={visible} onLost={() => setMode("css")} />
        </GlBoundary>
      )}
    </div>
  );
}
