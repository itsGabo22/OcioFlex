//! Local accounts. Pure logic over an injectable directory so it can be tested without Tauri.
//!
//! * Passwords: Argon2id, per-user random salt from the OS RNG, PHC string format.
//! * Verification is constant-time (argon2 crate); unknown logins still pay for one hash.
//! * Lockout: after 5 failures, 30 s, then doubling, persisted in the auth file.
//! * Remember me: 256-bit random token; only its SHA-256 is stored here, the raw token lives in
//!   the device file, which no command ever returns to the webview.

use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use rand_core::{OsRng, RngCore};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use zeroize::Zeroize;

use crate::store;

pub const MAX_FAILS: u32 = 5;
pub const BASE_LOCK_MS: u64 = 30_000;
pub const MAX_LOCK_MS: u64 = 60 * 60_000;
pub const TOKEN_TTL_MS: u64 = 30 * 24 * 3_600_000;
pub const SAMPLE_ID: &str = "sample";

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
struct TokenRec {
  sha: String,
  expires: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct UserRec {
  id: String,
  login: String,
  display_name: String,
  #[serde(default)]
  hash: Option<String>,
  created: u64,
  #[serde(default)]
  failed: u32,
  #[serde(default)]
  locked_until: u64,
  #[serde(default)]
  tokens: Vec<TokenRec>,
  #[serde(default)]
  sample: bool,
}

#[derive(Serialize, Deserialize, Default)]
struct UsersFile {
  version: u32,
  users: Vec<UserRec>,
}

/// What the webview may know about an account. No hash, no tokens, no counters.
#[derive(Serialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PublicUser {
  pub id: String,
  pub login: String,
  pub display_name: String,
  pub sample: bool,
  pub created: u64,
}

#[derive(Debug, PartialEq)]
pub enum AuthError {
  /// Wrong login or password. Deliberately does not say which.
  Invalid,
  Locked { retry_in_s: u64 },
  Taken,
  WeakPassword,
  BadLogin,
  BadName,
  NotSignedIn,
  Io(String),
}

impl AuthError {
  pub fn code(&self) -> &'static str {
    match self {
      AuthError::Invalid => "invalid",
      AuthError::Locked { .. } => "locked",
      AuthError::Taken => "taken",
      AuthError::WeakPassword => "weak",
      AuthError::BadLogin => "bad_login",
      AuthError::BadName => "bad_name",
      AuthError::NotSignedIn => "no_session",
      AuthError::Io(_) => "io",
    }
  }
}

fn public(u: &UserRec) -> PublicUser {
  PublicUser { id: u.id.clone(), login: u.login.clone(), display_name: u.display_name.clone(), sample: u.sample, created: u.created }
}

fn hex(bytes: &[u8]) -> String {
  bytes.iter().map(|b| format!("{b:02x}")).collect()
}

pub fn sha256_hex(s: &str) -> String {
  hex(&Sha256::digest(s.as_bytes()))
}

fn random_hex(n: usize) -> String {
  let mut buf = vec![0u8; n];
  OsRng.fill_bytes(&mut buf);
  let out = hex(&buf);
  buf.zeroize();
  out
}

/// username (a-z 0-9 . _ -) or e-mail, case-insensitive.
pub fn normalize_login(raw: &str) -> Result<String, AuthError> {
  let s = raw.trim().to_lowercase();
  let len = s.chars().count();
  if !(3..=64).contains(&len) {
    return Err(AuthError::BadLogin);
  }
  let ok = if let Some((local, domain)) = s.split_once('@') {
    !local.is_empty()
      && domain.contains('.')
      && !domain.starts_with('.')
      && !domain.ends_with('.')
      && !s.chars().any(|c| c.is_whitespace() || c.is_control())
      && !domain.contains('@')
  } else {
    s.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
  };
  if ok { Ok(s) } else { Err(AuthError::BadLogin) }
}

fn check_password(p: &str) -> Result<(), AuthError> {
  let n = p.chars().count();
  if (8..=256).contains(&n) { Ok(()) } else { Err(AuthError::WeakPassword) }
}

fn hash_password(p: &str) -> Result<String, AuthError> {
  let salt = SaltString::generate(&mut OsRng);
  Argon2::default() // Argon2id v19, m=19 MiB, t=2, p=1
    .hash_password(p.as_bytes(), &salt)
    .map(|h| h.to_string())
    .map_err(|e| AuthError::Io(e.to_string()))
}

fn verify(p: &str, phc: &str) -> bool {
  match PasswordHash::new(phc) {
    Ok(parsed) => Argon2::default().verify_password(p.as_bytes(), &parsed).is_ok(),
    Err(_) => false,
  }
}

/// A fixed hash used to keep timing flat when the login does not exist.
fn dummy_hash() -> &'static str {
  static DUMMY: std::sync::OnceLock<String> = std::sync::OnceLock::new();
  DUMMY.get_or_init(|| hash_password("timing-equaliser").unwrap_or_default())
}

pub struct AuthStore {
  root: PathBuf,
}

impl AuthStore {
  pub fn new(root: impl Into<PathBuf>) -> Self {
    Self { root: root.into() }
  }

  pub fn root(&self) -> &Path {
    &self.root
  }

  fn file(&self) -> PathBuf {
    self.root.join("auth").join("users.json")
  }

  fn load(&self) -> UsersFile {
    std::fs::read(self.file())
      .ok()
      .and_then(|b| serde_json::from_slice(&b).ok())
      .unwrap_or(UsersFile { version: 1, users: vec![] })
  }

  fn save(&self, f: &UsersFile) -> Result<(), AuthError> {
    let bytes = serde_json::to_vec_pretty(f).map_err(|e| AuthError::Io(e.to_string()))?;
    store::write_atomic(&self.file(), &bytes).map_err(|e| AuthError::Io(e.to_string()))
  }

  pub fn get(&self, uid: &str) -> Option<PublicUser> {
    self.load().users.iter().find(|u| u.id == uid).map(public)
  }

  pub fn register(&self, login: &str, display_name: &str, password: &mut String, now: u64) -> Result<PublicUser, AuthError> {
    let res = (|| {
      let login = normalize_login(login)?;
      let name = display_name.trim();
      if name.is_empty() || name.chars().count() > 40 {
        return Err(AuthError::BadName);
      }
      check_password(password)?;
      let mut f = self.load();
      if f.users.iter().any(|u| u.login == login) {
        return Err(AuthError::Taken);
      }
      let rec = UserRec {
        id: random_hex(12),
        login,
        display_name: name.to_string(),
        hash: Some(hash_password(password)?),
        created: now,
        failed: 0,
        locked_until: 0,
        tokens: vec![],
        sample: false,
      };
      let out = public(&rec);
      f.users.push(rec);
      self.save(&f)?;
      Ok(out)
    })();
    password.zeroize();
    res
  }

  pub fn login(&self, login: &str, password: &mut String, now: u64) -> Result<PublicUser, AuthError> {
    let res = (|| {
      let Ok(login) = normalize_login(login) else {
        verify(password, dummy_hash());
        return Err(AuthError::Invalid);
      };
      let mut f = self.load();
      let Some(u) = f.users.iter_mut().find(|u| u.login == login && !u.sample) else {
        verify(password, dummy_hash());
        return Err(AuthError::Invalid);
      };
      if u.locked_until > now {
        return Err(AuthError::Locked { retry_in_s: (u.locked_until - now).div_ceil(1000) });
      }
      let ok = u.hash.as_deref().is_some_and(|h| verify(password, h));
      if ok {
        u.failed = 0;
        u.locked_until = 0;
        let out = public(u);
        self.save(&f)?;
        Ok(out)
      } else {
        u.failed += 1;
        let mut err = AuthError::Invalid;
        if u.failed >= MAX_FAILS {
          let level = (u.failed - MAX_FAILS).min(20);
          let ms = (BASE_LOCK_MS << level).min(MAX_LOCK_MS);
          u.locked_until = now + ms;
          err = AuthError::Locked { retry_in_s: ms / 1000 };
        }
        self.save(&f)?;
        Err(err)
      }
    })();
    password.zeroize();
    res
  }

  /// Returns the raw token (for the device file); stores only its digest.
  pub fn issue_token(&self, uid: &str, now: u64) -> Result<String, AuthError> {
    let mut f = self.load();
    let u = f.users.iter_mut().find(|u| u.id == uid).ok_or(AuthError::NotSignedIn)?;
    let raw = random_hex(32);
    u.tokens.retain(|t| t.expires > now);
    u.tokens.push(TokenRec { sha: sha256_hex(&raw), expires: now + TOKEN_TTL_MS });
    self.save(&f)?;
    Ok(raw)
  }

  pub fn check_token(&self, raw: &str, now: u64) -> Option<PublicUser> {
    if raw.len() != 64 {
      return None;
    }
    let sha = sha256_hex(raw);
    let f = self.load();
    f.users
      .iter()
      .find(|u| u.tokens.iter().any(|t| t.expires > now && ct_eq(t.sha.as_bytes(), sha.as_bytes())))
      .map(public)
  }

  pub fn revoke_token(&self, raw: &str) -> Result<(), AuthError> {
    let sha = sha256_hex(raw);
    let mut f = self.load();
    for u in f.users.iter_mut() {
      u.tokens.retain(|t| t.sha != sha);
    }
    self.save(&f)
  }

  pub fn change_password(&self, uid: &str, current: &mut String, next: &mut String) -> Result<(), AuthError> {
    let res = (|| {
      let mut f = self.load();
      let u = f.users.iter_mut().find(|u| u.id == uid).ok_or(AuthError::NotSignedIn)?;
      if u.sample || !u.hash.as_deref().is_some_and(|h| verify(current, h)) {
        return Err(AuthError::Invalid);
      }
      check_password(next)?;
      u.hash = Some(hash_password(next)?);
      u.tokens.clear(); // every remembered device has to sign in again
      self.save(&f)
    })();
    current.zeroize();
    next.zeroize();
    res
  }

  /// Removes the account and its whole data namespace.
  pub fn delete(&self, uid: &str) -> Result<(), AuthError> {
    let mut f = self.load();
    let before = f.users.len();
    f.users.retain(|u| u.id != uid);
    if f.users.len() == before {
      return Err(AuthError::NotSignedIn);
    }
    self.save(&f)?;
    if let Some(dir) = store::user_dir(&self.root, uid) {
      if dir.exists() {
        std::fs::remove_dir_all(dir).map_err(|e| AuthError::Io(e.to_string()))?;
      }
    }
    Ok(())
  }

  pub fn find_login(&self, login: &str) -> Option<String> {
    let login = normalize_login(login).ok()?;
    self.load().users.iter().find(|u| u.login == login).map(|u| u.id.clone())
  }

  /// Passwordless example profile. `fresh` is true when it was just created.
  pub fn sample(&self, display_name: &str, now: u64) -> Result<(PublicUser, bool), AuthError> {
    let mut f = self.load();
    if let Some(u) = f.users.iter().find(|u| u.id == SAMPLE_ID) {
      return Ok((public(u), false));
    }
    let rec = UserRec {
      id: SAMPLE_ID.into(),
      login: "sample".into(),
      display_name: display_name.trim().chars().take(40).collect(),
      hash: None,
      created: now,
      failed: 0,
      locked_until: 0,
      tokens: vec![],
      sample: true,
    };
    let out = public(&rec);
    f.users.push(rec);
    self.save(&f)?;
    Ok((out, true))
  }
}

fn ct_eq(a: &[u8], b: &[u8]) -> bool {
  if a.len() != b.len() {
    return false;
  }
  a.iter().zip(b).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

#[cfg(test)]
mod tests {
  use super::*;

  fn tmp() -> AuthStore {
    let dir = std::env::temp_dir().join(format!("ocioflex-test-{}", random_hex(8)));
    AuthStore::new(dir)
  }
  fn pw(s: &str) -> String {
    s.to_string()
  }

  #[test]
  fn register_and_duplicate() {
    let s = tmp();
    let u = s.register("Gabo@Example.com", "Gabo", &mut pw("correct horse"), 1).unwrap();
    assert_eq!(u.login, "gabo@example.com");
    assert_eq!(s.register("gabo@example.COM", "Other", &mut pw("another pass"), 2), Err(AuthError::Taken));
    assert_eq!(s.register("x", "Name", &mut pw("long enough"), 2), Err(AuthError::BadLogin));
    assert_eq!(s.register("valid_user", "Name", &mut pw("short"), 2), Err(AuthError::WeakPassword));
    assert_eq!(s.register("valid_user", "  ", &mut pw("long enough"), 2), Err(AuthError::BadName));
  }

  #[test]
  fn login_ok_and_generic_failure() {
    let s = tmp();
    s.register("gabo", "Gabo", &mut pw("correct horse"), 1).unwrap();
    assert_eq!(s.login("GABO", &mut pw("correct horse"), 2).unwrap().login, "gabo");
    // wrong password and unknown user produce the same error
    assert_eq!(s.login("gabo", &mut pw("wrong horse"), 3), Err(AuthError::Invalid));
    assert_eq!(s.login("nobody", &mut pw("correct horse"), 3), Err(AuthError::Invalid));
  }

  #[test]
  fn lockout_backoff_persists() {
    let s = tmp();
    s.register("gabo", "Gabo", &mut pw("correct horse"), 0).unwrap();
    for i in 0..4 {
      assert_eq!(s.login("gabo", &mut pw("nope nope"), i), Err(AuthError::Invalid));
    }
    assert_eq!(s.login("gabo", &mut pw("nope nope"), 10), Err(AuthError::Locked { retry_in_s: 30 }));
    // a fresh store over the same dir (= app restart) still sees the lock, even with the right password
    let s2 = AuthStore::new(s.root().to_path_buf());
    assert!(matches!(s2.login("gabo", &mut pw("correct horse"), 1_000), Err(AuthError::Locked { .. })));
    // after it expires one more failure doubles the wait
    assert_eq!(s2.login("gabo", &mut pw("nope nope"), 40_000), Err(AuthError::Locked { retry_in_s: 60 }));
    // and a success resets the counter
    assert!(s2.login("gabo", &mut pw("correct horse"), 200_000).is_ok());
    assert_eq!(s2.login("gabo", &mut pw("nope nope"), 200_001), Err(AuthError::Invalid));
  }

  #[test]
  fn remember_tokens() {
    let s = tmp();
    let u = s.register("gabo", "Gabo", &mut pw("correct horse"), 0).unwrap();
    let raw = s.issue_token(&u.id, 0).unwrap();
    assert_eq!(raw.len(), 64);
    assert_eq!(s.check_token(&raw, 1).unwrap().id, u.id);
    assert!(s.check_token(&raw, TOKEN_TTL_MS + 1).is_none(), "expired");
    s.revoke_token(&raw).unwrap();
    assert!(s.check_token(&raw, 1).is_none(), "revoked");
    // the raw token is never stored
    let file = std::fs::read_to_string(s.root().join("auth/users.json")).unwrap();
    let raw2 = s.issue_token(&u.id, 0).unwrap();
    let file2 = std::fs::read_to_string(s.root().join("auth/users.json")).unwrap();
    assert!(!file.contains(&raw) && !file2.contains(&raw2));
  }

  #[test]
  fn change_password_flow() {
    let s = tmp();
    let u = s.register("gabo", "Gabo", &mut pw("correct horse"), 0).unwrap();
    let raw = s.issue_token(&u.id, 0).unwrap();
    assert_eq!(s.change_password(&u.id, &mut pw("bad current"), &mut pw("battery staple")), Err(AuthError::Invalid));
    s.change_password(&u.id, &mut pw("correct horse"), &mut pw("battery staple")).unwrap();
    assert!(s.login("gabo", &mut pw("correct horse"), 1).is_err());
    assert!(s.login("gabo", &mut pw("battery staple"), 1).is_ok());
    assert!(s.check_token(&raw, 1).is_none(), "password change revokes remembered sessions");
  }

  #[test]
  fn delete_removes_namespace() {
    let s = tmp();
    let u = s.register("gabo", "Gabo", &mut pw("correct horse"), 0).unwrap();
    let doc = store::user_doc(s.root(), &u.id).unwrap();
    store::write_atomic(&doc, b"{\"sessions\":[]}").unwrap();
    assert!(doc.exists());
    s.delete(&u.id).unwrap();
    assert!(!doc.exists() && !doc.parent().unwrap().exists());
    assert!(s.find_login("gabo").is_none());
    assert_eq!(s.login("gabo", &mut pw("correct horse"), 1), Err(AuthError::Invalid));
  }

  #[test]
  fn hashes_are_argon2id_and_never_public() {
    let s = tmp();
    let u = s.register("gabo", "Gabo", &mut pw("correct horse"), 0).unwrap();
    let file = std::fs::read_to_string(s.root().join("auth/users.json")).unwrap();
    assert!(file.contains("$argon2id$v=19$"));
    assert!(!file.contains("correct horse"));
    let json = serde_json::to_string(&u).unwrap();
    assert!(!json.contains("argon2") && !json.contains("hash") && !json.contains("token"));
    assert_eq!(json.matches(':').count(), 5, "only id, login, displayName, sample, created: {json}");
  }

  #[test]
  fn sample_profile_is_passwordless_and_cannot_be_logged_into() {
    let s = tmp();
    let (u, fresh) = s.sample("Alex", 0).unwrap();
    assert!(fresh && u.sample);
    let (_, again) = s.sample("Alex", 1).unwrap();
    assert!(!again);
    assert_eq!(s.login("sample", &mut pw("anything at all"), 2), Err(AuthError::Invalid));
  }

  #[test]
  fn password_buffers_are_wiped() {
    let s = tmp();
    let mut p = pw("correct horse");
    s.register("gabo", "Gabo", &mut p, 0).unwrap();
    assert!(p.is_empty());
  }
}
