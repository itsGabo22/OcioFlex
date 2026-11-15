/**
 * A tiny mutable bus between the DOM (splash, login form, onboarding) and the lazily loaded 3D scene.
 * Plain object on purpose: the form can poke it without importing three.js or re-rendering React.
 */
export type StageMode = "splash" | "stage" | "exit";
export type Palette = "foco" | "ocio";

export const stage = {
  /** where the orb should sit, in CSS px (centre) and its diameter */
  anchor: { x: 0, y: 0, d: 280 },
  mode: "splash" as StageMode,
  palette: "foco" as Palette,
  /** the mood the user last chose; the splash lands on it */
  saved: "foco" as Palette,
  /** fast-forward the intro */
  skip: false,
  /** direction of the focused field, -1..1 */
  lean: { x: 0, y: 0 },
  pointer: { x: 0, y: 0 },
  pulseAt: 0,
  burstAt: 0,
  /** onboarding step, makes the orb breathe a little differently per question */
  step: 0,
  ready: false,
  readyListeners: new Set<() => void>(),
  reset() {
    this.mode = "splash";
    this.skip = false;
    this.burstAt = 0;
    this.pulseAt = 0;
    this.lean = { x: 0, y: 0 };
  },
  markReady() {
    if (this.ready) return;
    this.ready = true;
    this.readyListeners.forEach((f) => f());
  },
  pulse() {
    this.pulseAt = performance.now();
  },
  burst() {
    this.burstAt = performance.now();
    this.mode = "exit";
  },
};

/** dev-only QA switches: ?nogl forces the CSS fallback, ?reduced simulates prefers-reduced-motion */
const devFlag = (k: string) => process.env.NODE_ENV !== "production" && typeof location !== "undefined" && new URLSearchParams(location.search).has(k);

export function hasWebGL() {
  if (devFlag("nogl")) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** dev-only: ?t=1.2 pins the splash at that second so single frames can be reviewed */
export const splashFreeze = (): number | null => {
  if (process.env.NODE_ENV === "production" || typeof location === "undefined") return null;
  const v = new URLSearchParams(location.search).get("t");
  return v ? Number(v) : null;
};

export const prefersReducedMotion = () => typeof window !== "undefined" && (devFlag("reduced") || window.matchMedia("(prefers-reduced-motion: reduce)").matches);

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") (window as unknown as { __stage?: typeof stage }).__stage = stage;
