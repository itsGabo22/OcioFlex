"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { stage, hasWebGL, prefersReducedMotion } from "@/lib/stage";
import { Segmented } from "@/components/ui/primitives";
import { StageScene, GlBoundary } from "./StageCanvas";
import { AuthCard } from "./AuthCard";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { cn } from "@/lib/utils";

type View = "splash" | "auth" | "onboarding" | "leaving" | "app";
type Geo = { a: { x: number; y: number; d: number }; w: { x: number; y: number; s: number; center: boolean } };

const SPLASH_MS = { palette: 1000, word: 1250, tag: 1800, decide: 2200, skipAfter: 800 };

/**
 * Launch → splash → (remembered session → Home) | sign in / create account → (first time) questionnaire → Home (+ tour).
 * Nothing protected renders until a user is signed in and their data is loaded, so deep links never flash data.
 */
export function Gate({ children }: { children: React.ReactNode }) {
  const { prefsReady, auth, dataReady, profile, savedMood, tutorialDone, startTour, lang, setLang, t } = useApp();
  const [view, setView] = useState<View>("splash");
  const [introDone, setIntroDone] = useState(false);
  const [phase, setPhase] = useState(0); // 0 dark · 1 particles · 2 wordmark · 3 tagline/landed
  const [gl, setGl] = useState<"pending" | "webgl" | "css">("pending");
  const [reduced, setReduced] = useState(false);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [leftFrom, setLeftFrom] = useState<View | null>(null);
  const timers = useRef<number[]>([]);
  const t0 = useRef(0);
  const slotRef = useRef<HTMLDivElement>(null);
  const brandSlotRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const path = usePathname();

  const later = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const setPalette = (p: "foco" | "ocio") => {
    stage.palette = p;
    document.documentElement.dataset.ctx = p;
  };

  /* ── splash timeline ── */
  const startTimeline = useCallback(() => {
    if (t0.current) return;
    t0.current = performance.now();
    setPhase(1);
    later(SPLASH_MS.palette, () => setPalette("ocio"));
    later(SPLASH_MS.word, () => setPhase(2));
    later(SPLASH_MS.tag, () => setPhase(3));
    later(SPLASH_MS.decide, () => {
      setPalette(stage.saved);
      setIntroDone(true);
    });
  }, []);
  useEffect(() => {
    stage.saved = savedMood;
  }, [savedMood]);

  useEffect(() => {
    stage.reset();
    setPalette("foco");
    const red = prefersReducedMotion();
    const id = window.setTimeout(() => {
      setReduced(red);
      if (red) {
        setGl("css");
        t0.current = performance.now();
        setPhase(3);
        later(650, () => {
          setPalette(stage.saved);
          setIntroDone(true);
        });
        return;
      }
      if (!hasWebGL()) {
        setGl("css");
        startTimeline();
        return;
      }
      setGl("webgl");
      const onReady = () => startTimeline();
      stage.readyListeners.add(onReady);
      if (stage.ready) startTimeline();
      later(2200, () => {
        if (!t0.current) {
          setGl("css");
          startTimeline();
        }
      });
    }, 0);
    const list = timers.current;
    return () => {
      clearTimeout(id);
      list.forEach(clearTimeout);
      stage.readyListeners.clear();
    };
  }, [startTimeline]);

  /* skip: click / Esc / any key after 0.8 s */
  useEffect(() => {
    if (view !== "splash" || introDone) return;
    const skip = () => {
      if (!t0.current || performance.now() - t0.current < SPLASH_MS.skipAfter) return;
      timers.current.forEach(clearTimeout);
      stage.skip = true;
      setPhase(3);
      setPalette(stage.saved);
      setIntroDone(true);
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [view, introDone]);

  /* ── flow ── */
  const leave = useCallback(() => {
    stage.burst();
    setLeftFrom(view);
    setView("leaving");
    if (path !== "/") router.replace("/");
    later(reduced ? 300 : 1000, () => setView("app"));
  }, [path, router, reduced, view]);

  useEffect(() => {
    if (!introDone || auth === "checking") return;
    const id = window.setTimeout(() => {
      if (auth === "out") {
        if (view !== "auth") {
          if (view === "app") {
            stage.reset();
            stage.skip = true;
            stage.mode = "stage";
            setPhase(3);
          }
          setView("auth");
        }
        return;
      }
      if (!dataReady) return;
      if (!profile.completed) {
        if (view !== "onboarding") {
          if (view === "app") {
            stage.reset();
            stage.skip = true;
            setPhase(3);
          }
          stage.mode = "stage";
          setView("onboarding");
        }
        return;
      }
      if (view === "splash" || view === "auth" || view === "onboarding") leave();
    }, 0);
    return () => clearTimeout(id);
  }, [introDone, auth, dataReady, profile.completed, view, leave]);

  /* first visit after the questionnaire: the tour */
  useEffect(() => {
    if (view !== "app" || tutorialDone || !profile.completed) return;
    const id = window.setTimeout(startTour, 650);
    return () => clearTimeout(id);
  }, [view, tutorialDone, profile.completed, startTour]);

  /* ── geometry: where the orb and the wordmark sit ── */
  const measure = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const brand = brandRef.current;
    const slotBrand = brandSlotRef.current;
    const slot = slotRef.current;
    if (!brand || !slotBrand || !slot) return;
    const bw = slotBrand.offsetWidth;
    const bh = slotBrand.offsetHeight;
    let a: Geo["a"];
    let w: Geo["w"];
    if (view === "splash" && !introDone) {
      const d = Math.min(H * 0.34, 300);
      a = { x: W / 2, y: H * 0.42, d };
      const s = W >= 1100 ? 1.12 : 1.4;
      w = { x: W / 2 - (bw * s) / 2, y: a.y + d / 2 + 34, s, center: true };
    } else {
      const r = slot.getBoundingClientRect();
      a = { x: r.left + r.width / 2, y: r.top + r.height / 2, d: r.width };
      const b = slotBrand.getBoundingClientRect();
      w = { x: b.left, y: b.top, s: 1, center: W >= 1100 };
    }
    void bh;
    stage.anchor = a;
    if (view !== "splash" || introDone) stage.mode = view === "leaving" ? "exit" : "stage";
    setGeo({ a, w });
  }, [view, introDone]);

  useLayoutEffect(() => {
    if (view === "app") return;
    measure();
    const ro = new ResizeObserver(measure);
    if (slotRef.current) ro.observe(slotRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, view, prefsReady, lang]);

  const showStage = view !== "app";
  const showApp = view === "app" || view === "leaving";
  const landed = view !== "splash" || introDone;

  return (
    <>
      {showApp && children}
      {showStage && (
        <div className={cn("stage-root fixed inset-0 z-[60] overflow-hidden", view === "leaving" && "stage-leaving")} data-view={view} data-landed={landed} aria-busy={view === "splash"}>
          <div className="canvas-layer canvas-foco !absolute" aria-hidden />
          <div className="canvas-layer canvas-ocio !absolute" aria-hidden />

          {gl === "webgl" && (
            <GlBoundary onError={() => setGl("css")}>
              <StageScene onLost={() => setGl("css")} />
            </GlBoundary>
          )}
          {gl === "css" && geo && <CssOrb geo={geo} phase={phase} reduced={reduced} />}
          <div className="grain !absolute" aria-hidden />

          <div className="stage-grid absolute inset-0">
            <section className="stage-left">
              <div ref={slotRef} className="orb-slot" aria-hidden />
              <div ref={brandSlotRef} className="brand invisible" aria-hidden>
                <p className="wordmark">OcioFlex</p>
                <p className="brand-tag">{t.auth.tagline}</p>
              </div>
            </section>
            <section className="stage-right" aria-hidden={!landed}>
              {(view === "auth" || (view === "leaving" && leftFrom === "auth")) && (
                <div className="stage-card-wrap">
                  <AuthCard />
                  <p className="mt-5 flex items-start gap-2.5 px-2 text-[12.5px] leading-[18px] text-ink-2">
                    <LockKeyhole size={14} aria-hidden className="shrink-0 mt-0.5 text-accent" />
                    {t.auth.localNote}
                  </p>
                </div>
              )}
              {(view === "onboarding" || (view === "leaving" && leftFrom === "onboarding")) && (
                <div className="stage-card-wrap wide">
                  <Onboarding />
                </div>
              )}
            </section>
          </div>

          {/* the floating brand: centred under the orb during the splash, then it settles into the stage */}
          <div
            ref={brandRef}
            className={cn("brand brand-float", phase >= 2 && "show-word", phase >= 3 && "show-tag", geo?.w.center ? "text-center" : "text-left")}
            style={geo ? { transform: `translate(${geo.w.x}px, ${geo.w.y}px) scale(${geo.w.s})` } : { opacity: 0 }}
          >
            <h1 className="wordmark" aria-label="OcioFlex">
              {"OcioFlex".split("").map((ch, i) => (
                <span key={i} aria-hidden style={{ ["--i" as string]: i }}>
                  {ch}
                </span>
              ))}
            </h1>
            <p className="brand-tag">{t.auth.tagline}</p>
          </div>

          {view === "splash" && !introDone && phase >= 1 && (
            <p className="splash-hint" aria-hidden>
              {t.auth.skipHint}
            </p>
          )}

          {landed && view !== "leaving" && (
            <div className="absolute top-5 left-6 z-20 stage-fade">
              <Segmented size="sm" label={t.auth.language} value={lang} onChange={setLang} options={[{ value: "es", label: "ES" }, { value: "en", label: "EN" }]} />
            </div>
          )}
          <p className="sr-only" role="status">{view === "splash" ? "OcioFlex" : ""}</p>
        </div>
      )}
    </>
  );
}

/** No WebGL (or reduced motion): soft blobs converge into a CSS orb that follows the same anchor. */
function CssOrb({ geo, phase, reduced }: { geo: Geo; phase: number; reduced: boolean }) {
  const { a } = geo;
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {!reduced && phase >= 1 && phase < 3 && (
        <div className="absolute" style={{ left: a.x, top: a.y }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span key={i} className="converge-blob" style={{ ["--a" as string]: `${i * 51}deg`, ["--i" as string]: i }} />
          ))}
        </div>
      )}
      <div
        className={cn("css-orb absolute rounded-full", reduced ? "css-orb-fade" : "css-orb-in")}
        style={{ width: a.d, height: a.d, transform: `translate(${a.x - a.d / 2}px, ${a.y - a.d / 2}px)` }}
      >
        <div className="blob h-full w-full" />
      </div>
    </div>
  );
}
