import { invoke, isTauri } from "./tauri";

export type Lang = "es" | "en";
export type CoachIn = { days: { date: string; focusMin: number; restMin: number }[]; todayFocusMin: number; todayRestMin: number };
export type CoachOut = { insight: string; tweak: string };
export type BreaksIn = { focusedMin: number; hour: number; mood: "tired" | "restless" | "curious" };
export type BreaksOut = { ideas: { title: string; minutes: number; why: string }[] };
export type SplitIn = { task: string; availableMin?: number };
export type SplitOut = { blocks: { title: string; minutes: number }[] };

export type AiMap = { coach: [CoachIn, CoachOut]; breaks: [BreaksIn, BreaksOut]; split: [SplitIn, SplitOut] };
export type AiFeature = keyof AiMap;
export type AiStatus = { mode: "live" | "demo"; provider: string; model: string; configured: boolean };
export type AiResult<T> = { mode: "live" | "demo"; data: T; fallback: boolean };

/**
 * All provider traffic happens in the Rust core. The webview never sees the key, the provider URL
 * or the model credentials — `ai_status` only returns a boolean `configured`.
 * Outside Tauri (plain Chrome, visual review only) a local demo shim answers instead.
 */
export async function aiStatus(): Promise<AiStatus> {
  if (isTauri()) return invoke<AiStatus>("ai_status");
  return { mode: "demo", provider: "gemini", model: "demo", configured: false };
}

export async function aiGenerate<F extends AiFeature>(feature: F, payload: AiMap[F][0], lang: Lang): Promise<AiResult<AiMap[F][1]>> {
  if (isTauri()) return invoke<AiResult<AiMap[F][1]>>("ai_generate", { feature, payload, lang });
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
  return { mode: "demo", data: demo(feature, payload, lang) as AiMap[F][1], fallback: false };
}

export async function aiSetKey(key: string): Promise<AiStatus> {
  return invoke<AiStatus>("ai_set_key", { key });
}
export async function aiClearKey(): Promise<AiStatus> {
  return invoke<AiStatus>("ai_clear_key");
}

/* ───────── browser-only demo shim (mirrors src-tauri/src/ai/demo.rs) ───────── */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function demo(feature: AiFeature, payload: unknown, lang: Lang): unknown {
  const es = lang === "es";
  const h = hash(JSON.stringify(payload));
  if (feature === "coach") {
    const p = payload as CoachIn;
    const total = p.days.reduce((a, d) => a + d.focusMin, 0);
    const hrs = (total / 60).toFixed(1);
    const tweaks = es
      ? ["Protege un bloque de 45 minutos antes de las 11:00.", "Cierra cada bloque con 10 minutos de descanso real, sin pantalla.", "Agrupa las tareas pequeñas en un solo bloque de 25 minutos."]
      : ["Protect one 45-minute block before 11:00.", "End each block with a real 10-minute break, screen off.", "Batch the small tasks into a single 25-minute block."];
    return {
      insight: es
        ? `Sumaste ${hrs} h de foco en 7 días y tu descanso acompaña bien. Tus mejores días siguen un ritmo estable de bloques de 45 minutos.`
        : `You logged ${hrs} h of focus over 7 days and your downtime keeps up. Your best days follow a steady rhythm of 45-minute blocks.`,
      tweak: tweaks[h % tweaks.length],
    };
  }
  if (feature === "breaks") {
    const p = payload as BreaksIn;
    const bank = {
      tired: es
        ? [["Siesta de potencia", 20, "Tras mucho foco, el cerebro rinde más con un descanso corto de verdad."], ["Música sin letra", 15, "Baja la carga cognitiva sin pedirte atención."], ["Estirar y agua", 10, "Recupera el cuerpo antes de volver."]]
        : [["Power nap", 20, "After deep focus the brain recovers best with a short, real rest."], ["Lyric-free music", 15, "Lowers cognitive load without asking for attention."], ["Stretch and water", 10, "Resets the body before you go back."]],
      restless: es
        ? [["Paseo rápido", 15, "Mover el cuerpo gasta la energía sobrante."], ["Un juego corto", 20, "Una partida breve canaliza la inquietud."], ["Llamar a alguien", 10, "El contacto social rompe el bucle mental."]]
        : [["Brisk walk", 15, "Moving burns off the extra energy."], ["A short game", 20, "A quick round channels the restlessness."], ["Call someone", 10, "Social contact breaks the mental loop."]],
      curious: es
        ? [["Un vídeo largo", 25, "Alimenta la curiosidad sin abrir más pestañas."], ["Un capítulo de tu libro", 20, "Lectura ligera para cambiar de modo."], ["Un podcast", 20, "Aprende algo que no tenga que ver con el trabajo."]]
        : [["A long-form video", 25, "Feeds curiosity without opening more tabs."], ["A chapter of your book", 20, "Light reading to switch modes."], ["A podcast", 20, "Learn something unrelated to work."]],
    }[p.mood];
    return { ideas: bank.map(([title, minutes, why]) => ({ title, minutes, why })) };
  }
  const p = payload as SplitIn;
  const t = p.task.trim().slice(0, 48);
  const names = es ? ["Esquema y alcance", "Primer borrador", "Revisión y pulido"] : ["Outline and scope", "First draft", "Review and polish"];
  const mins = [25, 45, 25];
  return { blocks: names.map((n, i) => ({ title: `${n}: ${t}`, minutes: mins[i] })) };
}
