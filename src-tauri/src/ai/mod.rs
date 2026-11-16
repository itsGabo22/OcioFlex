//! Flex, the assistant. Everything that touches the API key or the provider lives here, in the Rust
//! core. The webview only receives `AiStatus` (with a boolean `configured`) and feature results.
//! With no key, answers come from the local engine (`local.rs`), built from the user's own data.

pub mod gemini;
pub mod local;

use gemini::AiError;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const DEFAULT_PROVIDER: &str = "gemini";
/// Google's rolling alias for the current Flash model; override with AI_MODEL.
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
  #[serde(skip_serializing_if = "Option::is_none")]
  error: Option<&'static str>,
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
  if cfg!(debug_assertions) {
    if let Ok(cwd) = std::env::current_dir() {
      sources.push(read_env_file(&cwd.join(".env")));
      sources.push(read_env_file(&cwd.join("..").join(".env")));
    }
  }
  let pick = |name: &str| -> Option<String> { sources.iter().filter_map(|m| m.get(name)).map(|v| v.trim().to_string()).find(|v| !v.is_empty()) };
  Config {
    provider: pick("AI_PROVIDER").unwrap_or_else(|| DEFAULT_PROVIDER.into()).to_lowercase(),
    model: pick("AI_MODEL").unwrap_or_else(|| DEFAULT_MODEL.into()),
    key: pick("AI_API_KEY"),
  }
}

fn status_of(cfg: &Config) -> AiStatus {
  let configured = cfg.key.is_some();
  AiStatus { mode: if configured { "live" } else { "local" }, provider: cfg.provider.clone(), model: cfg.model.clone(), configured }
}

#[tauri::command]
pub fn ai_status(app: AppHandle) -> AiStatus {
  status_of(&resolve(&app))
}

#[tauri::command]
pub fn ai_set_key(app: AppHandle, key: String) -> Result<AiStatus, String> {
  let key = key.trim();
  if key.len() < 8 || key.len() > 512 || key.chars().any(|c| c.is_control() || c.is_whitespace() || c == '#' || c == '"' || c == '\'') {
    return Err("invalid_key".into());
  }
  let path = saved_key_path(&app).ok_or("io")?;
  crate::store::write_atomic(&path, format!("AI_API_KEY={key}\n").as_bytes()).map_err(|_| "io".to_string())?;
  Ok(status_of(&resolve(&app)))
}

#[tauri::command]
pub fn ai_clear_key(app: AppHandle) -> Result<AiStatus, String> {
  if let Some(path) = saved_key_path(&app) {
    if path.exists() {
      std::fs::remove_file(path).map_err(|_| "io".to_string())?;
    }
  }
  Ok(status_of(&resolve(&app)))
}

/// Personal identifiers never leave the device, whatever the webview sends.
const PRIVATE_KEYS: [&str; 7] = ["name", "displayName", "login", "email", "username", "password", "id"];

pub fn sanitize(v: &Value) -> Value {
  match v {
    Value::Object(m) => Value::Object(m.iter().filter(|(k, _)| !PRIVATE_KEYS.contains(&k.as_str())).map(|(k, v)| (k.clone(), sanitize(v))).collect::<Map<_, _>>()),
    Value::Array(a) => Value::Array(a.iter().map(sanitize).collect()),
    Value::String(s) => Value::String(s.chars().take(300).collect()),
    other => other.clone(),
  }
}

fn language_name(lang: &str) -> &'static str {
  if lang == "es" { "Spanish (Spain)" } else { "English" }
}

fn prompts(feature: Feature, payload: &Value, lang: &str) -> (String, String) {
  let l = language_name(lang);
  let system = format!(
    "You are Flex, the assistant inside OcioFlex, a desktop app that balances deep work and leisure. \
     You get aggregated statistics and a short profile (occupation, rhythm, goals, obstacles, leisure tastes). \
     Be warm, concrete and brief; use only numbers present in the data, never invent facts. \
     Reply ONLY with JSON matching the requested shape. Write every string in {l}."
  );
  let user = match feature {
    Feature::Coach => format!(
      "Weekly data and profile: {payload}. Return {{\"insight\": \"two sentences reading the pattern with the real numbers\", \"tweak\": \"one concrete, small change (max 22 words)\"}}."
    ),
    Feature::Breaks => format!(
      "The user just finished focusing. Context and leisure tastes: {payload}. Suggest exactly 3 break ideas that fit the mood, the time of day and their tastes. \
       Return {{\"ideas\": [{{\"title\": \"max 5 words\", \"minutes\": 5-30, \"why\": \"one short sentence\"}}]}}."
    ),
    Feature::Split => format!(
      "Split this task into 2 to 4 focus blocks that each fit one sitting; size them around the preferred session length: {payload}. \
       Return {{\"blocks\": [{{\"title\": \"short imperative, max 8 words\", \"minutes\": 15-90}}]}}."
    ),
  };
  (system, user)
}

pub fn valid(feature: Feature, v: &Value) -> bool {
  let s = |x: &Value, k: &str| x.get(k).and_then(Value::as_str).is_some_and(|s| !s.trim().is_empty());
  let n = |x: &Value, k: &str| x.get(k).and_then(Value::as_f64).is_some_and(|m| (1.0..=240.0).contains(&m));
  match feature {
    Feature::Coach => s(v, "insight") && s(v, "tweak"),
    Feature::Breaks => v.get("ideas").and_then(Value::as_array).is_some_and(|a| !a.is_empty() && a.iter().all(|i| s(i, "title") && n(i, "minutes") && s(i, "why"))),
    Feature::Split => v.get("blocks").and_then(Value::as_array).is_some_and(|a| !a.is_empty() && a.iter().all(|i| s(i, "title") && n(i, "minutes"))),
  }
}

/// Decides what the user sees from a provider outcome: the provider's JSON when it is valid,
/// otherwise the local engine plus the reason, so the UI can say so in plain words.
pub fn settle(feature: Feature, outcome: Result<Value, AiError>, payload: &Value, lang: &str) -> AiResult {
  match outcome {
    Ok(v) if valid(feature, &v) => AiResult { mode: "live", data: v, fallback: false, error: None },
    Ok(_) => AiResult { mode: "local", data: local::generate(feature, payload, lang), fallback: true, error: Some(AiError::Shape.code()) },
    Err(e) => AiResult { mode: "local", data: local::generate(feature, payload, lang), fallback: true, error: Some(e.code()) },
  }
}

#[tauri::command]
pub async fn ai_generate(app: AppHandle, feature: Feature, payload: Value, lang: String) -> Result<AiResult, String> {
  let cfg = resolve(&app);
  let lang = if lang == "es" { "es" } else { "en" };
  let Some(key) = cfg.key.clone() else {
    // a short beat so the answer reads as "considered", not as a canned instant reply
    tokio::time::sleep(std::time::Duration::from_millis(350)).await;
    return Ok(AiResult { mode: "local", data: local::generate(feature, &payload, lang), fallback: false, error: None });
  };
  if cfg.provider != "gemini" {
    log::warn!("unsupported AI provider configured");
    return Ok(settle(feature, Err(AiError::BadRequest), &payload, lang));
  }
  let (system, user) = prompts(feature, &sanitize(&payload), lang);
  let mut outcome = gemini::complete(&key, &cfg.model, &system, &user).await;
  if matches!(outcome, Err(AiError::Server) | Err(AiError::Timeout) | Err(AiError::Network) | Err(AiError::Shape)) {
    outcome = gemini::complete(&key, &cfg.model, &system, &user).await; // one retry
  }
  if let Err(e) = &outcome {
    log::warn!("assistant provider failed: {}", e.code()); // the code only: never the key or the payload
  }
  Ok(settle(feature, outcome, &payload, lang))
}

/// "Test connection" in Settings: one tiny request, a specific error code on failure.
#[tauri::command]
pub async fn ai_test(app: AppHandle) -> Result<AiStatus, String> {
  let cfg = resolve(&app);
  let Some(key) = cfg.key.clone() else { return Err("no_key".into()) };
  if cfg.provider != "gemini" {
    return Err(AiError::BadRequest.code().into());
  }
  match gemini::complete(&key, &cfg.model, "Reply only with JSON.", "Return {\"ok\": true}.").await {
    Ok(_) => Ok(status_of(&cfg)),
    Err(e) => Err(e.code().into()),
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[test]
  fn invalid_provider_json_falls_back_to_local_engine() {
    let payload = json!({ "task": "Write the report", "sessionLen": 45 });
    let r = settle(Feature::Split, Ok(json!({ "blocks": "nope" })), &payload, "en");
    assert_eq!((r.mode, r.fallback, r.error), ("local", true, Some("shape")));
    assert!(valid(Feature::Split, &r.data));
    let r = settle(Feature::Split, Err(AiError::RateLimited), &payload, "en");
    assert_eq!(r.error, Some("rate_limited"));
    let ok = settle(Feature::Coach, Ok(json!({ "insight": "a", "tweak": "b" })), &payload, "en");
    assert_eq!((ok.mode, ok.fallback), ("live", false));
  }

  #[test]
  fn personal_fields_never_reach_the_provider() {
    let p = json!({ "profile": { "name": "Gabo", "displayName": "G", "email": "g@x.io", "goals": ["balance"] }, "login": "gabo", "days": [{ "focusMin": 30 }] });
    let s = sanitize(&p).to_string();
    assert!(!s.contains("Gabo") && !s.contains("g@x.io") && !s.contains("gabo"));
    assert!(s.contains("balance") && s.contains("focusMin"));
  }
}
