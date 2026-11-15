"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";

const OrbScene = dynamic(() => import("./OrbScene"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class Boundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function OrbFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <div className="blob h-[300px] w-[300px]" />
    </div>
  );
}

/** Home hero: lazy WebGL orb with a CSS twin for reduced-motion / no WebGL / lost context. */
export function HeroOrb({ ratio }: { ratio: number }) {
  const { mood, t } = useApp();
  const host = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "webgl" | "css">("pending");
  const [visible, setVisible] = useState(true);
  const [tabOn, setTabOn] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !hasWebGL()) {
      const id = window.setTimeout(() => setMode("css"), 0);
      return () => clearTimeout(id);
    }
    // mount the heavy chunk after first paint
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const id = idle ? idle(() => setMode("webgl")) : window.setTimeout(() => setMode("webgl"), 120);
    return () => {
      if (!idle) clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    const vis = () => setTabOn(!document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return (
    <div ref={host} role="img" aria-label={t.home.heroAlt} className="absolute inset-y-0 right-0 w-[56%] min-w-[340px]">
      {mode === "css" && <OrbFallback />}
      {mode === "webgl" && (
        <Boundary fallback={<OrbFallback />}>
          <OrbScene mood={mood} ratio={ratio} running={visible && tabOn} onLost={() => setMode("css")} />
        </Boundary>
      )}
    </div>
  );
}
