/**
 * BROWSER-REVIEW SHIM ONLY. A faithful port of Flex's local engine (`src-tauri/src/ai/local.rs`),
 * so the assistant can be reviewed in plain Chrome. Inside the app, Rust answers.
 */
type P = Record<string, unknown>;
type Out = Record<string, unknown>;

const MASK = BigInt("0xffffffffffffffff");
export function hash(s: string) {
  let h = BigInt("0xcbf29ce484222325");
  for (const b of new TextEncoder().encode(s)) {
    h ^= BigInt(b);
    h = (h * BigInt("0x100000001b3")) & MASK;
  }
  return h;
}
const num = (p: P, k: string) => (typeof p[k] === "number" ? (p[k] as number) : 0);
const strs = (p: P, k: string) => (Array.isArray(p[k]) ? (p[k] as unknown[]).filter((x): x is string => typeof x === "string") : []);
const round5 = (x: number) => Math.max(5, Math.round(x / 5) * 5);
export function dur(min: number) {
  const m = Math.round(Math.max(0, min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h === 0 ? `${r} min` : r === 0 ? `${h} h` : `${h} h ${r} min`;
}
const sessionLen = (p: P) => {
  const v = Math.trunc(num(p, "sessionLen"));
  return v >= 15 && v <= 120 ? v : 45;
};
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const at = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function localGenerate(feature: "coach" | "breaks" | "split", p: P, lang: string): Out {
  const es = lang === "es";
  return feature === "coach" ? coach(p, es) : feature === "breaks" ? breaks(p, es) : split(p, es);
}

function coach(p: P, es: boolean): Out {
  const days = Array.isArray(p.days) ? (p.days as P[]) : [];
  const focus = days.reduce((a, d) => a + num(d, "focusMin"), 0);
  const rest = days.reduce((a, d) => a + num(d, "restMin"), 0);
  const len = sessionLen(p);
  const bh = typeof p.bestHour === "number" ? (p.bestHour as number) : null;
  const streak = Math.trunc(num(p, "streak"));
  const goal = num(p, "goalWeeklyMin");
  const week = num(p, "weekFocusMin");
  const daysLeft = Math.max(0, Math.trunc(num(p, "daysLeftInWeek")));
  const target = Math.min(90, Math.max(30, typeof p.targetFocusPct === "number" ? (p.targetFocusPct as number) : 65));
  const obstacles = strs(p, "obstacles");
  const h = hash(JSON.stringify(p));

  if (focus <= 0) {
    return {
      insight: es
        ? `Aún no hay sesiones de foco en los últimos 7 días, así que todavía no hay patrón que leer. Tu perfil apunta a bloques de ${len} min.`
        : `There are no focus sessions in the last 7 days yet, so there is no pattern to read. Your profile points to ${len}-minute blocks.`,
      tweak:
        bh !== null
          ? es ? `Empieza hoy con un único bloque de ${len} min hacia las ${at(bh)}.` : `Start today with a single ${len}-minute block around ${at(bh)}.`
          : es ? `Empieza hoy con un único bloque de ${len} min; lo demás vendrá solo.` : `Start today with a single ${len}-minute block; the rest follows.`,
    };
  }
  const fp = Math.round((focus / (focus + rest)) * 100);
  const tp = Math.round(target);
  let s = es
    ? `En 7 días sumaste ${dur(focus)} de foco y ${dur(rest)} de ocio: un ${fp}:${100 - fp} frente a tu objetivo ${tp}:${100 - tp}.`
    : `Over 7 days you logged ${dur(focus)} of focus and ${dur(rest)} of leisure: ${fp}:${100 - fp} against your ${tp}:${100 - tp} target.`;
  if (goal > 0) {
    const pct = Math.round((week / goal) * 100);
    s += " " + (pct >= 100
      ? es ? `Ya cumpliste tu meta semanal de ${dur(goal)} (${pct} %).` : `You have already met your weekly goal of ${dur(goal)} (${pct}%).`
      : es ? `Llevas el ${pct} % de tu meta semanal de ${dur(goal)}; faltan ${dur(goal - week)}.` : `You are at ${pct}% of your weekly goal of ${dur(goal)}; ${dur(goal - week)} to go.`);
  } else if (streak >= 2) {
    s += " " + (es ? `Llevas ${streak} días seguidos con foco.` : `That is ${streak} days in a row with focus.`);
  }
  if (bh !== null) s += " " + (es ? `Tu franja más productiva empieza hacia las ${at(bh)}.` : `Your most productive window starts around ${at(bh)}.`);

  const restLen = Math.min(20, Math.max(5, round5(len / 4)));
  let tweak: string;
  if (fp > target + 10) {
    tweak = es ? `Tu ratio pide más ocio: cierra cada bloque largo con ${restLen} min de descanso de verdad.` : `Your ratio asks for more leisure: close each long block with a real ${restLen}-minute break.`;
  } else if (goal > 0 && week < goal && daysLeft > 0) {
    const blocks = Math.ceil((goal - week) / len);
    const perDay = Math.ceil(blocks / daysLeft);
    tweak = es ? `Para llegar a tu meta te bastan ${blocks} bloques de ${len} min; unos ${perDay} al día hasta el domingo.` : `${blocks} blocks of ${len} min get you to your goal; about ${perDay} a day until Sunday.`;
  } else if (fp < target - 10) {
    tweak = bh !== null
      ? es ? `Reserva un bloque de ${len} min a las ${at(bh)} durante los próximos 3 días.` : `Book a ${len}-minute block at ${at(bh)} for the next 3 days.`
      : es ? `Reserva un bloque de ${len} min a la misma hora durante los próximos 3 días.` : `Book a ${len}-minute block at the same time for the next 3 days.`;
  } else if (obstacles.length) {
    tweak = obstacleTip(obstacles[Number(h % BigInt(obstacles.length))], len, bh, es);
  } else if (streak === 0) {
    const m = Math.max(15, round5(len / 2));
    tweak = es ? `Recupera la racha hoy con un bloque corto de ${m} min.` : `Restart your streak today with a short ${m}-minute block.`;
  } else {
    tweak = es ? `Mantén el ritmo: bloques de ${len} min con ${restLen} min de pausa entre ellos.` : `Keep the rhythm: ${len}-minute blocks with ${restLen}-minute pauses in between.`;
  }
  return { insight: s, tweak };
}

function obstacleTip(o: string, len: number, bh: number | null, es: boolean) {
  const a = bh !== null ? at(bh) : null;
  const T: Record<string, [string, string]> = {
    phone: ["Deja el móvil en otra habitación durante el próximo bloque.", "Leave your phone in another room for the next block."],
    notifications: [`Silencia las notificaciones durante cada bloque de ${len} min.`, `Mute notifications for each ${len}-minute block.`],
    procrastination: ["Empieza con solo 10 minutos; si sigues, conviértelo en un bloque completo.", "Start with just 10 minutes; if you keep going, turn it into a full block."],
    tiredness: a ? [`Coloca tu tarea más exigente a las ${a}, cuando más rindes.`, `Put your hardest task at ${a}, when you perform best.`] : ["Coloca tu tarea más exigente al principio del día.", "Put your hardest task at the start of the day."],
    distractions: ["Escribe la tarea antes de empezar y deja una sola pestaña abierta.", "Write the task down before you start and keep a single tab open."],
  };
  const pair = T[o] ?? ["Fija la misma hora de inicio tres días seguidos.", "Set the same start time three days in a row."];
  return es ? pair[0] : pair[1];
}

type Idea = { taste: string; moods: string[]; nightOk: boolean; base: number; es: [string, string]; en: [string, string] };
const IDEAS: Idea[] = [
  { taste: "games", moods: ["restless", "curious"], nightOk: true, base: 20, es: ["Una partida corta", "una ronda breve canaliza la inquietud sin engancharte."], en: ["One short match", "a quick round channels restlessness without hooking you."] },
  { taste: "games", moods: ["tired"], nightOk: true, base: 15, es: ["Un juego tranquilo", "un puzle o un juego relajado descansa sin exigir."], en: ["A cosy game", "a puzzle or relaxed game rests you without demanding much."] },
  { taste: "video", moods: ["curious"], nightOk: true, base: 25, es: ["Un vídeo que te interese", "aprender algo ajeno al trabajo cambia de canal mental."], en: ["A video you care about", "learning something unrelated to work switches channels."] },
  { taste: "video", moods: ["tired"], nightOk: true, base: 20, es: ["Un episodio corto", "algo ligero y con final claro, para no encadenar otro."], en: ["One short episode", "something light with a clear end, so you don't chain another."] },
  { taste: "music", moods: ["tired", "curious"], nightOk: true, base: 15, es: ["Música sin letra", "baja la carga mental sin pedirte atención."], en: ["Lyric-free music", "lowers mental load without asking for attention."] },
  { taste: "music", moods: ["restless"], nightOk: false, base: 10, es: ["Tres canciones a todo volumen", "subir el ánimo y soltar tensión en poco tiempo."], en: ["Three loud songs", "lifts your mood and releases tension fast."] },
  { taste: "books", moods: ["tired", "curious"], nightOk: true, base: 20, es: ["Un capítulo de tu libro", "leer en papel descansa la vista de la pantalla."], en: ["A chapter of your book", "reading on paper rests your eyes from the screen."] },
  { taste: "sports", moods: ["restless"], nightOk: false, base: 20, es: ["Entrenamiento breve", "gastar energía ahora te deja más centrado después."], en: ["A short workout", "burning energy now leaves you calmer afterwards."] },
  { taste: "sports", moods: ["tired"], nightOk: true, base: 10, es: ["Estiramientos suaves", "soltar cuello y espalda recupera el cuerpo antes de volver."], en: ["Gentle stretching", "loosening neck and back resets the body before you go back."] },
  { taste: "outdoors", moods: ["restless", "tired"], nightOk: false, base: 15, es: ["Paseo al aire libre", "luz natural y movimiento despejan la cabeza."], en: ["A walk outside", "daylight and movement clear your head."] },
  { taste: "outdoors", moods: ["curious"], nightOk: false, base: 20, es: ["Ruta sin destino", "dejarte llevar por la calle alimenta la curiosidad."], en: ["A walk with no destination", "wandering feeds curiosity."] },
  { taste: "social", moods: ["restless", "curious"], nightOk: true, base: 15, es: ["Llamar a alguien", "una charla rompe el bucle mental del trabajo."], en: ["Call someone", "a chat breaks the work loop in your head."] },
  { taste: "creative", moods: ["curious", "restless"], nightOk: true, base: 20, es: ["Dibujar o escribir sin objetivo", "crear sin presión usa otra parte de la mente."], en: ["Doodle or free-write", "making things without pressure uses another part of your mind."] },
  { taste: "cooking", moods: ["tired", "curious"], nightOk: true, base: 25, es: ["Preparar algo rico", "cocinar es manual, concreto y termina con premio."], en: ["Cook something good", "cooking is hands-on, concrete and ends with a reward."] },
  { taste: "any", moods: ["tired"], nightOk: true, base: 20, es: ["Siesta corta", "tras mucho foco, 20 minutos de descanso real recargan."], en: ["A short nap", "after deep focus, 20 minutes of real rest recharges you."] },
  { taste: "any", moods: ["tired", "restless", "curious"], nightOk: true, base: 5, es: ["Agua y ventana", "hidratarte y mirar lejos relaja la vista."], en: ["Water and a window", "hydrating and looking far away relaxes your eyes."] },
];

const rotl = (x: bigint, n: number) => {
  const k = BigInt(n % 64);
  const b64 = BigInt(64);
  return ((x << k) | (x >> ((b64 - k) % b64))) & MASK;
};

function breaks(p: P, es: boolean): Out {
  const mood = typeof p.mood === "string" ? p.mood : "tired";
  const tastes = strs(p, "tastes");
  const hour = Math.trunc(num(p, "hour"));
  const focused = num(p, "focusedMin");
  const night = !(hour >= 6 && hour < 21);
  const h = hash(JSON.stringify(p));
  const factor = focused >= 90 ? 1.5 : focused >= 45 ? 1 : 0.75;
  const scored = IDEAS.map((idea, i) => {
    let s = 0;
    if (tastes.includes(idea.taste)) s += 3;
    if (idea.moods.includes(mood)) s += 2;
    if (night && !idea.nightOk) s -= 3;
    if (idea.taste === "any") s += 0.5;
    s += Number(rotl(h, i * 7) % BigInt(100)) / 100;
    return { s, i };
  }).sort((a, b) => b.s - a.s);
  const used: string[] = [];
  const ideas: Out[] = [];
  for (const { i } of scored) {
    const idea = IDEAS[i];
    if (used.includes(idea.taste)) continue;
    used.push(idea.taste);
    const [title, why] = es ? idea.es : idea.en;
    const minutes = Math.min(30, Math.max(5, round5(idea.base * factor)));
    const w = ideas.length === 0 && focused > 0 ? (es ? `Tras ${dur(focused)} de foco, ${why}` : `After ${dur(focused)} of focus, ${why}`) : cap(why);
    ideas.push({ title, minutes, why: w });
    if (ideas.length === 3) break;
  }
  return { ideas };
}

const CONNECTORS = ["y", "e", "and", "then", "luego", "después", "despues", "plus", "also", "además"];

export function clauses(task: string): string[] {
  const out: string[] = [];
  for (const chunk of task.split(/[,;\n+&/.]/)) {
    let cur: string[] = [];
    for (const w of chunk.split(/\s+/).filter(Boolean)) {
      const isC = CONNECTORS.includes(w.toLowerCase());
      if (isC && cur.length) {
        out.push(cur.join(" "));
        cur = [];
      } else if (!isC) cur.push(w);
    }
    if (cur.length) out.push(cur.join(" "));
  }
  return out.filter((c) => [...c].length >= 3);
}

function phases(task: string, es: boolean): [string, string, string] {
  const t = task.toLowerCase();
  const has = (k: string[]) => k.some((x) => t.includes(x));
  if (has(["escrib", "redact", "informe", "ensayo", "memoria", "artículo", "articulo", "report", "essay", "write", "draft", "article", "thesis", "tesis"]))
    return es ? ["Esquema y fuentes", "Redactar el núcleo", "Revisar y pulir"] : ["Outline and sources", "Write the core", "Revise and polish"];
  if (has(["estudi", "repas", "examen", "aprend", "leer", "lectura", "apuntes", "study", "exam", "learn", "read", "notes", "revise"]))
    return es ? ["Leer y subrayar", "Resumir con tus palabras", "Ponerte a prueba"] : ["Read and highlight", "Summarise in your words", "Test yourself"];
  if (has(["program", "código", "codigo", "implement", "bug", "debug", "refactor", "code", "feature", "api", "test"]))
    return es ? ["Plan y casos límite", "Implementar", "Probar y limpiar"] : ["Plan and edge cases", "Implement", "Test and clean up"];
  if (has(["diseñ", "disen", "boceto", "prototip", "wireframe", "interfaz", "logo", "design", "mockup", "sketch", "prototype"]))
    return es ? ["Referencias y objetivos", "Bocetos y variantes", "Pulir la mejor opción"] : ["References and goals", "Sketches and variants", "Polish the best option"];
  if (has(["present", "diapositiva", "exposici", "charla", "slides", "pitch", "talk"]))
    return es ? ["Mensaje y estructura", "Diapositivas", "Ensayar en voz alta"] : ["Message and structure", "Slides", "Rehearse out loud"];
  return es ? ["Aclarar el objetivo", "Avanzar en lo principal", "Cerrar y anotar el siguiente paso"] : ["Clarify the goal", "Push the main part", "Wrap up and note the next step"];
}

function short(s: string, n: number) {
  const t = s.trim();
  if ([...t].length <= n) return t;
  const cut = [...t].slice(0, n).join("");
  const i = cut.lastIndexOf(" ");
  return i > n / 2 ? `${cut.slice(0, i)}…` : `${cut}…`;
}

function split(p: P, es: boolean): Out {
  const task = [...(typeof p.task === "string" ? p.task : "").trim()].slice(0, 160).join("");
  const len = sessionLen(p);
  const side = Math.max(15, round5(len * 0.5));
  let parts = clauses(task);
  if (parts.length >= 2) {
    if (parts.length > 4) parts = [...parts.slice(0, 3), parts.slice(3).join(", ")];
    const each = parts.length === 4 ? Math.max(15, round5(len * 0.75)) : len;
    return { blocks: parts.map((c) => ({ title: cap(short(c, 60)), minutes: each })) };
  }
  const subject = short(task, 40);
  const [a, b, c] = phases(task, es);
  const long = task.split(/\s+/).filter(Boolean).length > 8 || len <= 25;
  const blocks = [{ title: `${a} · ${subject}`, minutes: side }, { title: `${b} · ${subject}`, minutes: len }];
  if (long) blocks.push({ title: `${b} (2) · ${subject}`, minutes: len });
  blocks.push({ title: `${c} · ${subject}`, minutes: side });
  return { blocks };
}
