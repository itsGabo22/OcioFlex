//! Deterministic, localized sample answers used when no API key is configured.
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

pub fn generate(feature: Feature, payload: &Value, lang: &str) -> Value {
  let es = lang == "es";
  let h = hash(&payload.to_string()) as usize;
  match feature {
    Feature::Coach => {
      let total: f64 = payload.get("days").and_then(Value::as_array).map(|d| d.iter().filter_map(|x| x.get("focusMin").and_then(Value::as_f64)).sum()).unwrap_or(0.0);
      let hrs = format!("{:.1}", total / 60.0);
      let tweaks_es = ["Protege un bloque de 45 minutos antes de las 11:00.", "Cierra cada bloque con 10 minutos de descanso real, sin pantalla.", "Agrupa las tareas pequeñas en un solo bloque de 25 minutos."];
      let tweaks_en = ["Protect one 45-minute block before 11:00.", "End each block with a real 10-minute break, screen off.", "Batch the small tasks into a single 25-minute block."];
      let insight = if es {
        format!("Sumaste {hrs} h de foco en 7 días y tu descanso acompaña bien. Tus mejores días siguen un ritmo estable de bloques de 45 minutos.")
      } else {
        format!("You logged {hrs} h of focus over 7 days and your downtime keeps up. Your best days follow a steady rhythm of 45-minute blocks.")
      };
      json!({ "insight": insight, "tweak": if es { tweaks_es[h % 3] } else { tweaks_en[h % 3] } })
    }
    Feature::Breaks => {
      let mood = payload.get("mood").and_then(Value::as_str).unwrap_or("tired");
      let rows: [(&str, u32, &str); 3] = match (mood, es) {
        ("restless", true) => [("Paseo rápido", 15, "Mover el cuerpo gasta la energía sobrante."), ("Un juego corto", 20, "Una partida breve canaliza la inquietud."), ("Llamar a alguien", 10, "El contacto social rompe el bucle mental.")],
        ("restless", false) => [("Brisk walk", 15, "Moving burns off the extra energy."), ("A short game", 20, "A quick round channels the restlessness."), ("Call someone", 10, "Social contact breaks the mental loop.")],
        ("curious", true) => [("Un vídeo largo", 25, "Alimenta la curiosidad sin abrir más pestañas."), ("Un capítulo de tu libro", 20, "Lectura ligera para cambiar de modo."), ("Un podcast", 20, "Aprende algo que no tenga que ver con el trabajo.")],
        ("curious", false) => [("A long-form video", 25, "Feeds curiosity without opening more tabs."), ("A chapter of your book", 20, "Light reading to switch modes."), ("A podcast", 20, "Learn something unrelated to work.")],
        (_, true) => [("Siesta de potencia", 20, "Tras mucho foco, el cerebro rinde más con un descanso corto de verdad."), ("Música sin letra", 15, "Baja la carga cognitiva sin pedirte atención."), ("Estirar y agua", 10, "Recupera el cuerpo antes de volver.")],
        (_, false) => [("Power nap", 20, "After deep focus the brain recovers best with a short, real rest."), ("Lyric-free music", 15, "Lowers cognitive load without asking for attention."), ("Stretch and water", 10, "Resets the body before you go back.")],
      };
      json!({ "ideas": rows.iter().map(|(t, m, w)| json!({ "title": t, "minutes": m, "why": w })).collect::<Vec<_>>() })
    }
    Feature::Split => {
      let task: String = payload.get("task").and_then(Value::as_str).unwrap_or("").trim().chars().take(48).collect();
      let names = if es { ["Esquema y alcance", "Primer borrador", "Revisión y pulido"] } else { ["Outline and scope", "First draft", "Review and polish"] };
      let mins = [25, 45, 25];
      json!({ "blocks": names.iter().zip(mins).map(|(n, m)| json!({ "title": format!("{n}: {task}"), "minutes": m })).collect::<Vec<_>>() })
    }
  }
}
