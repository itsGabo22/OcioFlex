//! AI backend. Everything that touches the API key or the provider lives here, in the Rust core.
//! The webview only ever receives `AiStatus` (with a boolean `configured`) and feature results.

mod demo;
mod gemini;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const DEFAULT_PROVIDER: &str = "gemini";
const DEFAULT_MODEL: &str = "gemini-flash-latest";
const KEY_FILE: &str = "ocioflex.env";

#[derive(Serialize, Clone)]
pub struct AiStatus {
  mode: &'static str,
  provider: String,
  model: String,
  configured: bool,
}

#[derive(Serialize)]
pub struct AiResult {
  mode: &'static str,
  data: Value,
  fallback: bool,
}

#[derive(Deserialize, Clone, Copy, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Feature {
  Coach,
  Breaks,
  Split,
}

pub(crate) struct Config {
  pub provider: String,
  pub model: String,
  pub key: Option<String>,
}

fn read_env_file(path: &Path) -> HashMap<String, String> {
  match dotenvy::from_path_iter(path) {
    Ok(iter) => iter.flatten().collect(),
    Err(_) => HashMap::new(),
  }
}

fn saved_key_path(app: &AppHandle) -> Option<PathBuf> {
  app.path().app_config_dir().ok().map(|d| d.join(KEY_FILE))
}

/// Lookup order: key saved from Settings -> process env -> `.env` next to the executable -> repo-root `.env` (dev).
fn resolve(app: &AppHandle) -> Config {
  let mut sources: Vec<HashMap<String, String>> = Vec::new();
  if let Some(p) = saved_key_path(app) {
    sources.push(read_env_file(&p));
  }
  sources.push(std::env::vars().collect());
  if let Ok(exe) = std::env::current_exe() {
    if let Some(dir) = exe.parent() {
      sources.push(read_env_file(&dir.join(".env")));
    }
  }
  if let Ok(cwd) = std::env::current_dir() {
    sources.push(read_env_file(&cwd.join(".env")));
    sources.push(read_env_file(&cwd.join("..").join(".env")));
  }
  let pick = |name: &str| -> Option<String> {
    sources
      .iter()
      .filter_map(|m| m.get(name))
      .map(|v| v.trim().to_string())
      .find(|v| !v.is_empty())
  };
  Config {
    provider: pick("AI_PROVIDER").unwrap_or_else(|| DEFAULT_PROVIDER.into()).to_lowercase(),
    model: pick("AI_MODEL").unwrap_or_else(|| DEFAULT_MODEL.into()),
    key: pick("AI_API_KEY"),
  }
}

fn status_of(cfg: &Config) -> AiStatus {
  let configured = cfg.key.is_some();
  AiStatus { mode: if configured { "live" } else { "demo" }, provider: cfg.provider.clone(), model: cfg.model.clone(), configured }
}

#[tauri::command]
pub fn ai_status(app: AppHandle) -> AiStatus {
  status_of(&resolve(&app))
}

#[tauri::command]
pub fn ai_set_key(app: AppHandle, key: String) -> Result<AiStatus, String> {
  let key = key.trim();
  if key.is_empty() || key.len() > 512 || key.chars().any(|c| c.is_control() || c.is_whitespace()) {
    return Err("invalid key".into());
  }
  let path = saved_key_path(&app).ok_or("no config dir")?;
  if let Some(dir) = path.parent() {
    std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
  }
  std::fs::write(&path, format!("AI_API_KEY={key}\n")).map_err(|e| e.to_string())?;
  Ok(status_of(&resolve(&app)))
}

#[tauri::command]
pub fn ai_clear_key(app: AppHandle) -> Result<AiStatus, String> {
  if let Some(path) = saved_key_path(&app) {
    if path.exists() {
      std::fs::remove_file(path).map_err(|e| e.to_string())?;
    }
  }
  Ok(status_of(&resolve(&app)))
}

fn language_name(lang: &str) -> &'static str {
  if lang == "es" { "Spanish (Spain)" } else { "English" }
}

fn prompts(feature: Feature, payload: &Value, lang: &str) -> (String, String) {
  let l = language_name(lang);
  let system = format!(
    "You are the assistant inside OcioFlex, a desktop app that balances deep work and leisure. \
     Be warm, concrete and brief. Reply ONLY with JSON matching the requested shape. Write every string in {l}."
  );
  let user = match feature {
    Feature::Coach => format!(
      "Here is the user's last 7 days (minutes per day) and today's totals: {payload}. \
       Return {{\"insight\": \"two sentences reading the pattern\", \"tweak\": \"one concrete, small change (max 20 words)\"}}."
    ),
    Feature::Breaks => format!(
      "The user just finished a focus stretch. Context: {payload}. Suggest exactly 3 break ideas that fit the mood. \
       Return {{\"ideas\": [{{\"title\": \"max 5 words\", \"minutes\": 5-30, \"why\": \"one short sentence\"}}]}}."
    ),
    Feature::Split => format!(
      "Split this task into 2 to 4 focus blocks that can each be done in one sitting: {payload}. \
       Return {{\"blocks\": [{{\"title\": \"short imperative, max 8 words\", \"minutes\": 15-90}}]}}."
    ),
  };
  (system, user)
}

fn valid(feature: Feature, v: &Value) -> bool {
  match feature {
    Feature::Coach => v.get("insight").and_then(Value::as_str).is_some() && v.get("tweak").and_then(Value::as_str).is_some(),
    Feature::Breaks => v.get("ideas").and_then(Value::as_array).is_some_and(|a| !a.is_empty() && a.iter().all(|i| i.get("title").is_some() && i.get("minutes").is_some() && i.get("why").is_some())),
    Feature::Split => v.get("blocks").and_then(Value::as_array).is_some_and(|a| !a.is_empty() && a.iter().all(|i| i.get("title").is_some() && i.get("minutes").is_some())),
  }
}

#[tauri::command]
pub async fn ai_generate(app: AppHandle, feature: Feature, payload: Value, lang: String) -> Result<AiResult, String> {
  let cfg = resolve(&app);
  let demo_result = |fallback: bool| AiResult { mode: "demo", data: demo::generate(feature, &payload, &lang), fallback };

  let Some(key) = cfg.key.clone() else {
    // believable latency so the demo feels like the real thing
    tokio::time::sleep(std::time::Duration::from_millis(600 + (demo::hash(&payload.to_string()) % 600))).await;
    return Ok(demo_result(false));
  };

  let (system, user) = prompts(feature, &payload, &lang);
  let mut last_err = String::new();
  for _ in 0..2 {
    let attempt = match cfg.provider.as_str() {
      "gemini" => gemini::complete(&key, &cfg.model, &system, &user).await,
      other => Err(format!("unsupported provider: {other}")),
    };
    match attempt {
      Ok(text) => match serde_json::from_str::<Value>(&text) {
        Ok(v) if valid(feature, &v) => return Ok(AiResult { mode: "live", data: v, fallback: false }),
        _ => last_err = "invalid response shape".into(),
      },
      Err(e) => last_err = e,
    }
  }
  log::warn!("ai provider failed ({}): {}", cfg.provider, last_err.replace(&key, "***"));
  Ok(demo_result(true))
}
