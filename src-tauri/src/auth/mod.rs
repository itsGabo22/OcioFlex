//! Tauri commands for local accounts and the signed-in user's data.
//! Errors cross the bridge as `{ code, retryIn? }` only.

pub mod core;

use self::core::{AuthError, AuthStore, PublicUser};
use crate::store;
use serde::Serialize;
use serde_json::{Map, Value};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

pub struct AppState {
  pub auth: AuthStore,
  pub session: Mutex<Option<String>>,
  /// serialises every read-modify-write on disk
  pub io: Mutex<()>,
}

impl AppState {
  pub fn new(root: std::path::PathBuf) -> Self {
    Self { auth: AuthStore::new(root), session: Mutex::new(None), io: Mutex::new(()) }
  }
  fn uid(&self) -> Result<String, ApiError> {
    self.session.lock().map_err(|_| ApiError::io())?.clone().ok_or(ApiError { code: "no_session", retry_in: None })
  }
  fn set_uid(&self, uid: Option<String>) {
    if let Ok(mut s) = self.session.lock() {
      *s = uid;
    }
  }
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ApiError {
  code: &'static str,
  #[serde(skip_serializing_if = "Option::is_none")]
  retry_in: Option<u64>,
}

impl ApiError {
  fn io() -> Self {
    Self { code: "io", retry_in: None }
  }
}

impl From<AuthError> for ApiError {
  fn from(e: AuthError) -> Self {
    if let AuthError::Io(msg) = &e {
      log::error!("auth io error: {msg}");
    }
    let retry_in = if let AuthError::Locked { retry_in_s } = e { Some(retry_in_s) } else { None };
    ApiError { code: e.code(), retry_in }
  }
}

type R<T> = Result<T, ApiError>;

fn now() -> u64 {
  SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

const REMEMBER_KEY: &str = "remember";

fn device_token(st: &AppState) -> Option<String> {
  store::read_object(&store::device_file(st.auth.root())).get(REMEMBER_KEY).and_then(Value::as_str).map(str::to_owned)
}

fn set_device_token(st: &AppState, token: Option<String>) {
  let path = store::device_file(st.auth.root());
  let mut dev = store::read_object(&path);
  match token {
    Some(t) => dev.insert(REMEMBER_KEY.into(), Value::String(t)),
    None => dev.remove(REMEMBER_KEY),
  };
  if let Err(e) = store::write_object(&path, &dev) {
    log::error!("device file write failed: {e}");
  }
}

fn signed_in(st: &AppState, user: PublicUser, remember: bool) -> R<PublicUser> {
  if remember {
    let raw = st.auth.issue_token(&user.id, now())?;
    set_device_token(st, Some(raw));
  } else if let Some(old) = device_token(st) {
    let _ = st.auth.revoke_token(&old);
    set_device_token(st, None);
  }
  st.set_uid(Some(user.id.clone()));
  log::info!("signed in ({})", if user.sample { "sample" } else { "account" });
  Ok(user)
}

/// Current user, restoring a remembered session on launch.
#[tauri::command]
pub fn auth_session(st: State<'_, AppState>) -> R<Option<PublicUser>> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  if let Ok(uid) = st.uid() {
    return Ok(st.auth.get(&uid));
  }
  let Some(raw) = device_token(&st) else { return Ok(None) };
  match st.auth.check_token(&raw, now()) {
    Some(u) => {
      st.set_uid(Some(u.id.clone()));
      Ok(Some(u))
    }
    None => {
      set_device_token(&st, None); // expired or revoked
      Ok(None)
    }
  }
}

#[tauri::command]
pub fn auth_register(st: State<'_, AppState>, login: String, display_name: String, mut password: String, remember: bool) -> R<PublicUser> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  let u = st.auth.register(&login, &display_name, &mut password, now())?;
  signed_in(&st, u, remember)
}

#[tauri::command]
pub fn auth_login(st: State<'_, AppState>, login: String, mut password: String, remember: bool) -> R<PublicUser> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  let u = st.auth.login(&login, &mut password, now())?;
  signed_in(&st, u, remember)
}

#[tauri::command]
pub fn auth_logout(st: State<'_, AppState>) -> R<()> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  if let Some(raw) = device_token(&st) {
    let _ = st.auth.revoke_token(&raw);
  }
  set_device_token(&st, None);
  st.set_uid(None);
  Ok(())
}

#[tauri::command]
pub fn auth_change_password(st: State<'_, AppState>, mut current: String, mut next: String) -> R<()> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  let uid = st.uid()?;
  st.auth.change_password(&uid, &mut current, &mut next)?;
  set_device_token(&st, None);
  Ok(())
}

/// Signed in: deletes the current account. Signed out ("forgot password"): deletes the profile
/// with that login — accounts are local, so starting over is the only recovery there is.
#[tauri::command]
pub fn auth_delete_account(st: State<'_, AppState>, login: Option<String>) -> R<()> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  let uid = match (st.uid(), login) {
    (Ok(uid), _) => uid,
    (Err(_), Some(l)) => st.auth.find_login(&l).ok_or(ApiError { code: "invalid", retry_in: None })?,
    (Err(e), None) => return Err(e),
  };
  st.auth.delete(&uid)?;
  if st.uid().ok().as_deref() == Some(uid.as_str()) {
    if let Some(raw) = device_token(&st) {
      let _ = st.auth.revoke_token(&raw);
    }
    set_device_token(&st, None);
    st.set_uid(None);
  }
  Ok(())
}

#[derive(Serialize)]
pub struct SampleResult {
  user: PublicUser,
  fresh: bool,
}

#[tauri::command]
pub fn auth_sample_profile(st: State<'_, AppState>, display_name: String) -> R<SampleResult> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  let (user, fresh) = st.auth.sample(&display_name, now())?;
  let user = signed_in(&st, user, false)?;
  Ok(SampleResult { user, fresh })
}

/* ───────────── per-user document ───────────── */

#[tauri::command]
pub fn data_load(st: State<'_, AppState>) -> R<Map<String, Value>> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  let uid = st.uid()?;
  let path = store::user_doc(st.auth.root(), &uid).ok_or(ApiError::io())?;
  Ok(store::read_object(&path))
}

/// Merges whitelisted top-level keys into the signed-in user's document (`null` removes a key).
#[tauri::command]
pub fn data_save(st: State<'_, AppState>, patch: Map<String, Value>) -> R<()> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  let uid = st.uid()?;
  let path = store::user_doc(st.auth.root(), &uid).ok_or(ApiError::io())?;
  let mut doc = store::read_object(&path);
  for (k, v) in patch {
    if !store::DATA_KEYS.contains(&k.as_str()) {
      continue;
    }
    if v.is_null() { doc.remove(&k) } else { doc.insert(k, v) };
  }
  let size = serde_json::to_vec(&doc).map(|b| b.len()).unwrap_or(usize::MAX);
  if size > store::MAX_DOC_BYTES {
    return Err(ApiError { code: "too_large", retry_in: None });
  }
  store::write_object(&path, &doc).map_err(|e| {
    log::error!("user doc write failed: {e}");
    ApiError::io()
  })
}

/* ───────────── device prefs (language, last mood) — usable before sign-in ───────────── */

#[tauri::command]
pub fn prefs_get(st: State<'_, AppState>) -> R<Map<String, Value>> {
  let dev = store::read_object(&store::device_file(st.auth.root()));
  Ok(dev.into_iter().filter(|(k, _)| store::PREF_KEYS.contains(&k.as_str())).collect())
}

#[tauri::command]
pub fn prefs_set(st: State<'_, AppState>, key: String, value: String) -> R<()> {
  let _g = st.io.lock().map_err(|_| ApiError::io())?;
  let valid = match key.as_str() {
    "lang" => matches!(value.as_str(), "es" | "en"),
    "mood" => matches!(value.as_str(), "foco" | "ocio"),
    _ => false,
  };
  if !valid {
    return Err(ApiError { code: "bad_pref", retry_in: None });
  }
  let path = store::device_file(st.auth.root());
  let mut dev = store::read_object(&path);
  dev.insert(key, Value::String(value));
  store::write_object(&path, &dev).map_err(|_| ApiError::io())
}
