//! Flex's local engine: answers built from the user's real numbers and profile, no network.
//! Deterministic (variation keyed on the payload), ES/EN, and it never invents facts: every number
//! in a sentence comes from the payload. Mirrored for browser review in `src/lib/engine.ts`.

use super::Feature;
use serde_json::{json, Value};

pub fn hash(s: &str) -> u64 {
  let mut h: u64 = 0xcbf29ce484222325;
  for b in s.bytes() {
    h ^= b as u64;
    h = h.wrapping_mul(0x100000001b3);
  }
  h
}

fn num(v: &Value, k: &str) -> f64 {
  v.get(k).and_then(Value::as_f64).unwrap_or(0.0)
}
fn strs(v: &Value, k: &str) -> Vec<String> {
  v.get(k).and_then(Value::as_array).map(|a| a.iter().filter_map(|x| x.as_str().map(str::to_owned)).collect()).unwrap_or_default()
}
fn round5(x: f64) -> i64 {
  ((x / 5.0).round() as i64 * 5).max(5)
}

/// "3 h 45 min", "40 min", "2 h"
pub fn dur(min: f64) -> String {
  let m = min.max(0.0).round() as i64;
  match (m / 60, m % 60) {
    (0, r) => format!("{r} min"),
    (h, 0) => format!("{h} h"),
    (h, r) => format!("{h} h {r} min"),
  }
}

fn session_len(p: &Value) -> i64 {
  match num(p, "sessionLen") as i64 {
    v @ 15..=120 => v,
    _ => 45,
  }
}

pub fn generate(feature: Feature, p: &Value, lang: &str) -> Value {
  let es = lang == "es";
  match feature {
    Feature::Coach => coach(p, es),
    Feature::Breaks => breaks(p, es),
    Feature::Split => split(p, es),
  }
}

/* ───────────────────────── Balance Coach ───────────────────────── */

fn coach(p: &Value, es: bool) -> Value {
  let days: Vec<&Value> = p.get("days").and_then(Value::as_array).map(|a| a.iter().collect()).unwrap_or_default();
  let focus: f64 = days.iter().map(|d| num(d, "focusMin")).sum();
  let rest: f64 = days.iter().map(|d| num(d, "restMin")).sum();
  let len = session_len(p);
  let best_hour = p.get("bestHour").and_then(Value::as_i64);
  let streak = num(p, "streak") as i64;
  let goal = num(p, "goalWeeklyMin");
  let week = num(p, "weekFocusMin");
  let days_left = num(p, "daysLeftInWeek").max(0.0) as i64;
  let target = p.get("targetFocusPct").and_then(Value::as_f64).unwrap_or(65.0).clamp(30.0, 90.0);
  let obstacles = strs(p, "obstacles");
  let h = hash(&p.to_string());
  let at = |hr: i64| format!("{hr:02}:00");

  if focus <= 0.0 {
    let insight = if es {
      format!("Aún no hay sesiones de foco en los últimos 7 días, así que todavía no hay patrón que leer. Tu perfil apunta a bloques de {len} min.")
    } else {
      format!("There are no focus sessions in the last 7 days yet, so there is no pattern to read. Your profile points to {len}-minute blocks.")
    };
    let tweak = match (best_hour, es) {
      (Some(hr), true) => format!("Empieza hoy con un único bloque de {len} min hacia las {}.", at(hr)),
      (Some(hr), false) => format!("Start today with a single {len}-minute block around {}.", at(hr)),
      (None, true) => format!("Empieza hoy con un único bloque de {len} min; lo demás vendrá solo."),
      (None, false) => format!("Start today with a single {len}-minute block; the rest follows."),
    };
    return json!({ "insight": insight, "tweak": tweak });
  }

  let total = focus + rest;
  let fp = ((focus / total) * 100.0).round() as i64;
  let tp = target.round() as i64;
  let mut s = if es {
    format!("En 7 días sumaste {} de foco y {} de ocio: un {}:{} frente a tu objetivo {}:{}.", dur(focus), dur(rest), fp, 100 - fp, tp, 100 - tp)
  } else {
    format!("Over 7 days you logged {} of focus and {} of leisure: {}:{} against your {}:{} target.", dur(focus), dur(rest), fp, 100 - fp, tp, 100 - tp)
  };
  if goal > 0.0 {
    let pct = ((week / goal) * 100.0).round() as i64;
    s.push(' ');
    s.push_str(&if pct >= 100 {
      if es { format!("Ya cumpliste tu meta semanal de {} ({} %).", dur(goal), pct) } else { format!("You have already met your weekly goal of {} ({}%).", dur(goal), pct) }
    } else if es {
      format!("Llevas el {} % de tu meta semanal de {}; faltan {}.", pct, dur(goal), dur(goal - week))
    } else {
      format!("You are at {}% of your weekly goal of {}; {} to go.", pct, dur(goal), dur(goal - week))
    });
  } else if streak >= 2 {
    s.push(' ');
    s.push_str(&if es { format!("Llevas {streak} días seguidos con foco.") } else { format!("That is {streak} days in a row with focus.") });
  }
  if let Some(hr) = best_hour {
    s.push(' ');
    s.push_str(&if es { format!("Tu franja más productiva empieza hacia las {}.", at(hr)) } else { format!("Your most productive window starts around {}.", at(hr)) });
  }

  let rest_len = round5(len as f64 / 4.0).clamp(5, 20);
  let tweak = if fp as f64 > target + 10.0 {
    if es { format!("Tu ratio pide más ocio: cierra cada bloque largo con {rest_len} min de descanso de verdad.") } else { format!("Your ratio asks for more leisure: close each long block with a real {rest_len}-minute break.") }
  } else if goal > 0.0 && week < goal && days_left > 0 {
    let blocks = ((goal - week) / len as f64).ceil() as i64;
    let per_day = (blocks as f64 / days_left as f64).ceil() as i64;
    if es {
      format!("Para llegar a tu meta te bastan {blocks} bloques de {len} min; unos {per_day} al día hasta el domingo.")
    } else {
      format!("{blocks} blocks of {len} min get you to your goal; about {per_day} a day until Sunday.")
    }
  } else if (fp as f64) < target - 10.0 {
    match (best_hour, es) {
      (Some(hr), true) => format!("Reserva un bloque de {len} min a las {} durante los próximos 3 días.", at(hr)),
      (Some(hr), false) => format!("Book a {len}-minute block at {} for the next 3 days.", at(hr)),
      (None, true) => format!("Reserva un bloque de {len} min a la misma hora durante los próximos 3 días."),
      (None, false) => format!("Book a {len}-minute block at the same time for the next 3 days."),
    }
  } else if !obstacles.is_empty() {
    obstacle_tip(&obstacles[(h as usize) % obstacles.len()], len, best_hour, es)
  } else if streak == 0 {
    if es { format!("Recupera la racha hoy con un bloque corto de {} min.", round5(len as f64 / 2.0).max(15)) } else { format!("Restart your streak today with a short {}-minute block.", round5(len as f64 / 2.0).max(15)) }
  } else if es {
    format!("Mantén el ritmo: bloques de {len} min con {rest_len} min de pausa entre ellos.")
  } else {
    format!("Keep the rhythm: {len}-minute blocks with {rest_len}-minute pauses in between.")
  };
  json!({ "insight": s, "tweak": tweak })
}

fn obstacle_tip(o: &str, len: i64, best_hour: Option<i64>, es: bool) -> String {
  let at = best_hour.map(|h| format!("{h:02}:00"));
  match (o, es) {
    ("phone", true) => "Deja el móvil en otra habitación durante el próximo bloque.".into(),
    ("phone", false) => "Leave your phone in another room for the next block.".into(),
    ("notifications", true) => format!("Silencia las notificaciones durante cada bloque de {len} min."),
    ("notifications", false) => format!("Mute notifications for each {len}-minute block."),
    ("procrastination", true) => "Empieza con solo 10 minutos; si sigues, conviértelo en un bloque completo.".into(),
    ("procrastination", false) => "Start with just 10 minutes; if you keep going, turn it into a full block.".into(),
    ("tiredness", true) => match at { Some(a) => format!("Coloca tu tarea más exigente a las {a}, cuando más rindes."), None => "Coloca tu tarea más exigente al principio del día.".into() },
    ("tiredness", false) => match at { Some(a) => format!("Put your hardest task at {a}, when you perform best."), None => "Put your hardest task at the start of the day.".into() },
    ("distractions", true) => "Escribe la tarea antes de empezar y deja una sola pestaña abierta.".into(),
    ("distractions", false) => "Write the task down before you start and keep a single tab open.".into(),
    (_, true) => "Fija la misma hora de inicio tres días seguidos.".into(),
    (_, false) => "Set the same start time three days in a row.".into(),
  }
}

/* ───────────────────────── Break Suggester ───────────────────────── */

struct Idea {
  taste: &'static str,
  moods: &'static [&'static str],
  night_ok: bool,
  base: f64,
  es: (&'static str, &'static str),
  en: (&'static str, &'static str),
}

// `why` starts lower-case so it can follow "After N min of focus, ".
const IDEAS: &[Idea] = &[
  Idea { taste: "games", moods: &["restless", "curious"], night_ok: true, base: 20.0, es: ("Una partida corta", "una ronda breve canaliza la inquietud sin engancharte."), en: ("One short match", "a quick round channels restlessness without hooking you.") },
  Idea { taste: "games", moods: &["tired"], night_ok: true, base: 15.0, es: ("Un juego tranquilo", "un puzle o un juego relajado descansa sin exigir."), en: ("A cosy game", "a puzzle or relaxed game rests you without demanding much.") },
  Idea { taste: "video", moods: &["curious"], night_ok: true, base: 25.0, es: ("Un vídeo que te interese", "aprender algo ajeno al trabajo cambia de canal mental."), en: ("A video you care about", "learning something unrelated to work switches channels.") },
  Idea { taste: "video", moods: &["tired"], night_ok: true, base: 20.0, es: ("Un episodio corto", "algo ligero y con final claro, para no encadenar otro."), en: ("One short episode", "something light with a clear end, so you don't chain another.") },
  Idea { taste: "music", moods: &["tired", "curious"], night_ok: true, base: 15.0, es: ("Música sin letra", "baja la carga mental sin pedirte atención."), en: ("Lyric-free music", "lowers mental load without asking for attention.") },
  Idea { taste: "music", moods: &["restless"], night_ok: false, base: 10.0, es: ("Tres canciones a todo volumen", "subir el ánimo y soltar tensión en poco tiempo."), en: ("Three loud songs", "lifts your mood and releases tension fast.") },
  Idea { taste: "books", moods: &["tired", "curious"], night_ok: true, base: 20.0, es: ("Un capítulo de tu libro", "leer en papel descansa la vista de la pantalla."), en: ("A chapter of your book", "reading on paper rests your eyes from the screen.") },
  Idea { taste: "sports", moods: &["restless"], night_ok: false, base: 20.0, es: ("Entrenamiento breve", "gastar energía ahora te deja más centrado después."), en: ("A short workout", "burning energy now leaves you calmer afterwards.") },
  Idea { taste: "sports", moods: &["tired"], night_ok: true, base: 10.0, es: ("Estiramientos suaves", "soltar cuello y espalda recupera el cuerpo antes de volver."), en: ("Gentle stretching", "loosening neck and back resets the body before you go back.") },
  Idea { taste: "outdoors", moods: &["restless", "tired"], night_ok: false, base: 15.0, es: ("Paseo al aire libre", "luz natural y movimiento despejan la cabeza."), en: ("A walk outside", "daylight and movement clear your head.") },
  Idea { taste: "outdoors", moods: &["curious"], night_ok: false, base: 20.0, es: ("Ruta sin destino", "dejarte llevar por la calle alimenta la curiosidad."), en: ("A walk with no destination", "wandering feeds curiosity.") },
  Idea { taste: "social", moods: &["restless", "curious"], night_ok: true, base: 15.0, es: ("Llamar a alguien", "una charla rompe el bucle mental del trabajo."), en: ("Call someone", "a chat breaks the work loop in your head.") },
  Idea { taste: "creative", moods: &["curious", "restless"], night_ok: true, base: 20.0, es: ("Dibujar o escribir sin objetivo", "crear sin presión usa otra parte de la mente."), en: ("Doodle or free-write", "making things without pressure uses another part of your mind.") },
  Idea { taste: "cooking", moods: &["tired", "curious"], night_ok: true, base: 25.0, es: ("Preparar algo rico", "cocinar es manual, concreto y termina con premio."), en: ("Cook something good", "cooking is hands-on, concrete and ends with a reward.") },
  Idea { taste: "any", moods: &["tired"], night_ok: true, base: 20.0, es: ("Siesta corta", "tras mucho foco, 20 minutos de descanso real recargan."), en: ("A short nap", "after deep focus, 20 minutes of real rest recharges you.") },
  Idea { taste: "any", moods: &["tired", "restless", "curious"], night_ok: true, base: 5.0, es: ("Agua y ventana", "hidratarte y mirar lejos relaja la vista."), en: ("Water and a window", "hydrating and looking far away relaxes your eyes.") },
];

fn breaks(p: &Value, es: bool) -> Value {
  let mood = p.get("mood").and_then(Value::as_str).unwrap_or("tired");
  let tastes = strs(p, "tastes");
  let hour = num(p, "hour") as i64;
  let focused = num(p, "focusedMin");
  let night = !(6..21).contains(&hour);
  let h = hash(&p.to_string());
  let factor = if focused >= 90.0 { 1.5 } else if focused >= 45.0 { 1.0 } else { 0.75 };

  let mut scored: Vec<(f64, usize)> = IDEAS
    .iter()
    .enumerate()
    .map(|(i, idea)| {
      let mut s = 0.0;
      if tastes.iter().any(|t| t == idea.taste) {
        s += 3.0;
      }
      if idea.moods.contains(&mood) {
        s += 2.0;
      }
      if night && !idea.night_ok {
        s -= 3.0;
      }
      if idea.taste == "any" {
        s += 0.5;
      }
      s += ((h.rotate_left(i as u32 * 7) % 100) as f64) / 100.0; // light, deterministic variation
      (s, i)
    })
    .collect();
  scored.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));

  let mut used: Vec<&str> = vec![];
  let mut out = vec![];
  for (_, i) in scored {
    let idea = &IDEAS[i];
    if used.contains(&idea.taste) {
      continue;
    }
    used.push(idea.taste);
    let (title, why) = if es { idea.es } else { idea.en };
    let minutes = round5(idea.base * factor).clamp(5, 30);
    let why = if out.is_empty() && focused > 0.0 {
      if es { format!("Tras {} de foco, {}", dur(focused), why) } else { format!("After {} of focus, {}", dur(focused), why) }
    } else {
      capitalize(why)
    };
    out.push(json!({ "title": title, "minutes": minutes, "why": why }));
    if out.len() == 3 {
      break;
    }
  }
  json!({ "ideas": out })
}

fn capitalize(s: &str) -> String {
  let mut c = s.chars();
  match c.next() {
    Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    None => String::new(),
  }
}

/* ───────────────────────── Task Splitter ───────────────────────── */

const CONNECTORS: [&str; 10] = ["y", "e", "and", "then", "luego", "después", "despues", "plus", "also", "además"];

/// Splits on punctuation and on connector words ("y", "and", "then"…).
pub fn clauses(task: &str) -> Vec<String> {
  let mut out = vec![];
  for chunk in task.split(|c| matches!(c, ',' | ';' | '\n' | '+' | '&' | '/' | '.')) {
    let mut cur: Vec<&str> = vec![];
    for w in chunk.split_whitespace() {
      if CONNECTORS.contains(&w.to_lowercase().as_str()) && !cur.is_empty() {
        out.push(cur.join(" "));
        cur.clear();
      } else if !CONNECTORS.contains(&w.to_lowercase().as_str()) {
        cur.push(w);
      }
    }
    if !cur.is_empty() {
      out.push(cur.join(" "));
    }
  }
  out.retain(|c| c.chars().count() >= 3);
  out
}

fn phases(task: &str, es: bool) -> [&'static str; 3] {
  let t = task.to_lowercase();
  let has = |keys: &[&str]| keys.iter().any(|k| t.contains(k));
  if has(&["escrib", "redact", "informe", "ensayo", "memoria", "artículo", "articulo", "report", "essay", "write", "draft", "article", "thesis", "tesis"]) {
    if es { ["Esquema y fuentes", "Redactar el núcleo", "Revisar y pulir"] } else { ["Outline and sources", "Write the core", "Revise and polish"] }
  } else if has(&["estudi", "repas", "examen", "aprend", "leer", "lectura", "apuntes", "study", "exam", "learn", "read", "notes", "revise"]) {
    if es { ["Leer y subrayar", "Resumir con tus palabras", "Ponerte a prueba"] } else { ["Read and highlight", "Summarise in your words", "Test yourself"] }
  } else if has(&["program", "código", "codigo", "implement", "bug", "debug", "refactor", "code", "feature", "api", "test"]) {
    if es { ["Plan y casos límite", "Implementar", "Probar y limpiar"] } else { ["Plan and edge cases", "Implement", "Test and clean up"] }
  } else if has(&["diseñ", "disen", "boceto", "prototip", "wireframe", "interfaz", "logo", "design", "mockup", "sketch", "prototype"]) {
    if es { ["Referencias y objetivos", "Bocetos y variantes", "Pulir la mejor opción"] } else { ["References and goals", "Sketches and variants", "Polish the best option"] }
  } else if has(&["present", "diapositiva", "exposici", "charla", "slides", "pitch", "talk"]) {
    if es { ["Mensaje y estructura", "Diapositivas", "Ensayar en voz alta"] } else { ["Message and structure", "Slides", "Rehearse out loud"] }
  } else if es {
    ["Aclarar el objetivo", "Avanzar en lo principal", "Cerrar y anotar el siguiente paso"]
  } else {
    ["Clarify the goal", "Push the main part", "Wrap up and note the next step"]
  }
}

fn short(s: &str, n: usize) -> String {
  let s = s.trim();
  if s.chars().count() <= n {
    return s.to_string();
  }
  let cut: String = s.chars().take(n).collect();
  match cut.rfind(' ') {
    Some(i) if i > n / 2 => format!("{}…", &cut[..i]),
    _ => format!("{cut}…"),
  }
}

fn split(p: &Value, es: bool) -> Value {
  let task: String = p.get("task").and_then(Value::as_str).unwrap_or("").trim().chars().take(160).collect();
  let len = session_len(p);
  let side = round5(len as f64 * 0.5).max(15);
  let mut parts = clauses(&task);
  if parts.len() >= 2 {
    if parts.len() > 4 {
      let tail = parts.split_off(3).join(", ");
      parts.push(tail);
    }
    let each = if parts.len() == 4 { round5(len as f64 * 0.75).max(15) } else { len };
    let blocks: Vec<Value> = parts.iter().map(|c| json!({ "title": capitalize(&short(c, 60)), "minutes": each })).collect();
    return json!({ "blocks": blocks });
  }
  let subject = short(&task, 40);
  let [a, b, c] = phases(&task, es);
  let long = task.split_whitespace().count() > 8 || len <= 25;
  let mut blocks = vec![json!({ "title": format!("{a} · {subject}"), "minutes": side })];
  blocks.push(json!({ "title": format!("{b} · {subject}"), "minutes": len }));
  if long {
    blocks.push(json!({ "title": format!("{b} (2) · {subject}"), "minutes": len }));
  }
  blocks.push(json!({ "title": format!("{c} · {subject}"), "minutes": side }));
  json!({ "blocks": blocks })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn coach_uses_real_numbers() {
    let p = json!({ "days": [{"focusMin": 120, "restMin": 30}, {"focusMin": 90, "restMin": 60}], "sessionLen": 45, "goalWeeklyMin": 600, "weekFocusMin": 210, "daysLeftInWeek": 3, "targetFocusPct": 65, "bestHour": 10, "streak": 2, "obstacles": [] });
    let out = generate(Feature::Coach, &p, "es");
    let s = out["insight"].as_str().unwrap();
    assert!(s.contains("3 h 30 min") && s.contains("1 h 30 min") && s.contains("70:30") && s.contains("65:35") && s.contains("10:00"), "{s}");
    assert!(s.contains("35 %"), "{s}");
    let tweak = out["tweak"].as_str().unwrap();
    assert!(tweak.contains("9 bloques de 45 min"), "{tweak}");
  }

  #[test]
  fn coach_empty_week_does_not_invent() {
    let out = generate(Feature::Coach, &json!({ "days": [], "sessionLen": 25 }), "en");
    assert!(out["insight"].as_str().unwrap().contains("no focus sessions"));
    assert!(out["tweak"].as_str().unwrap().contains("25-minute"));
  }

  #[test]
  fn breaks_follow_tastes_and_night() {
    let p = json!({ "mood": "restless", "tastes": ["sports", "music"], "hour": 23, "focusedMin": 90 });
    let ideas = generate(Feature::Breaks, &p, "en")["ideas"].as_array().unwrap().clone();
    assert_eq!(ideas.len(), 3);
    assert!(ideas[0]["why"].as_str().unwrap().starts_with("After 1 h 30 min of focus"));
    let titles: Vec<&str> = ideas.iter().map(|i| i["title"].as_str().unwrap()).collect();
    assert!(!titles.contains(&"A short workout"), "no workouts at 23:00: {titles:?}");
  }

  #[test]
  fn split_by_clauses_and_by_phase() {
    let p = json!({ "task": "leer el capítulo 3, hacer el resumen y preparar las preguntas", "sessionLen": 60 });
    let b = generate(Feature::Split, &p, "es")["blocks"].as_array().unwrap().clone();
    assert_eq!(b.len(), 3);
    assert_eq!(b[1]["title"], "Hacer el resumen");
    assert_eq!(b[0]["minutes"], 60);
    let p2 = json!({ "task": "Write the design report", "sessionLen": 45 });
    let b2 = generate(Feature::Split, &p2, "en")["blocks"].as_array().unwrap().clone();
    assert_eq!(b2[0]["title"], "Outline and sources · Write the design report");
    assert_eq!(b2[1]["minutes"], 45);
  }
}
