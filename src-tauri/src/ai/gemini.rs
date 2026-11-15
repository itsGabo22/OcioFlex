//! Gemini `generateContent` adapter. Request building and response parsing are pure functions so
//! they can be tested against fixtures without the network.

use serde_json::{json, Value};
use std::time::Duration;

#[derive(Debug, PartialEq, Clone, Copy)]
pub enum AiError {
  BadRequest,
  Key,
  Model,
  RateLimited,
  Server,
  Timeout,
  Network,
  Shape,
}

impl AiError {
  pub fn code(self) -> &'static str {
    match self {
      AiError::BadRequest => "bad_request",
      AiError::Key => "key",
      AiError::Model => "model",
      AiError::RateLimited => "rate_limited",
      AiError::Server => "server",
      AiError::Timeout => "timeout",
      AiError::Network => "network",
      AiError::Shape => "shape",
    }
  }
  pub fn from_status(status: u16) -> Self {
    match status {
      401 | 403 => AiError::Key,
      404 => AiError::Model,
      429 => AiError::RateLimited,
      500..=599 => AiError::Server,
      _ => AiError::BadRequest,
    }
  }
}

pub struct Request {
  pub url: String,
  pub headers: Vec<(&'static str, String)>,
  pub body: Value,
}

pub fn valid_model(model: &str) -> bool {
  !model.is_empty() && model.len() <= 80 && model.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '.' | '_'))
}

/// The key travels only in the `x-goog-api-key` header: never in the URL (so it cannot leak into
/// logs or error messages) and never in the body.
pub fn build(key: &str, model: &str, system: &str, user: &str) -> Result<Request, AiError> {
  if !valid_model(model) {
    return Err(AiError::Model);
  }
  Ok(Request {
    url: format!("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"),
    headers: vec![("x-goog-api-key", key.to_string()), ("content-type", "application/json".into())],
    body: json!({
      "systemInstruction": { "parts": [{ "text": system }] },
      "contents": [{ "role": "user", "parts": [{ "text": user }] }],
      "generationConfig": { "responseMimeType": "application/json", "temperature": 0.6, "maxOutputTokens": 700 }
    }),
  })
}

/// Maps an HTTP status + body to the model's JSON text, or a typed error.
pub fn parse(status: u16, body: &str) -> Result<Value, AiError> {
  if !(200..300).contains(&status) {
    return Err(AiError::from_status(status));
  }
  let v: Value = serde_json::from_str(body).map_err(|_| AiError::Shape)?;
  let text = v.pointer("/candidates/0/content/parts/0/text").and_then(Value::as_str).ok_or(AiError::Shape)?;
  // tolerate a fenced reply even though we ask for application/json
  let text = text.trim().trim_start_matches("```json").trim_start_matches("```").trim_end_matches("```").trim();
  serde_json::from_str(text).map_err(|_| AiError::Shape)
}

pub async fn complete(key: &str, model: &str, system: &str, user: &str) -> Result<Value, AiError> {
  let req = build(key, model, system, user)?;
  let client = reqwest::Client::builder().timeout(Duration::from_secs(15)).build().map_err(|_| AiError::Network)?;
  let mut rb = client.post(&req.url).json(&req.body);
  for (k, v) in &req.headers {
    rb = rb.header(*k, v);
  }
  let resp = rb.send().await.map_err(|e| if e.is_timeout() { AiError::Timeout } else { AiError::Network })?;
  let status = resp.status().as_u16();
  let body = resp.text().await.map_err(|e| if e.is_timeout() { AiError::Timeout } else { AiError::Network })?;
  parse(status, &body)
}

#[cfg(test)]
mod tests {
  use super::*;

  const OK: &str = r#"{"candidates":[{"content":{"role":"model","parts":[{"text":"{\"insight\":\"Good week.\",\"tweak\":\"Rest more.\"}"}]},"finishReason":"STOP"}]}"#;

  #[test]
  fn key_only_in_header() {
    let r = build("SECRET-KEY-123", "gemini-flash-latest", "sys", "user").unwrap();
    assert!(!r.url.contains("SECRET") && !r.url.contains("key="));
    assert!(!r.body.to_string().contains("SECRET"));
    assert_eq!(r.headers.iter().filter(|(_, v)| v.contains("SECRET")).map(|(k, _)| *k).collect::<Vec<_>>(), vec!["x-goog-api-key"]);
    assert!(r.url.ends_with("/models/gemini-flash-latest:generateContent"));
    assert_eq!(r.body["generationConfig"]["responseMimeType"], "application/json");
  }

  #[test]
  fn rejects_injected_model_names() {
    assert!(build("k", "../../evil?x=1", "s", "u").is_err());
    assert!(build("k", "", "s", "u").is_err());
  }

  #[test]
  fn parses_valid_json() {
    let v = parse(200, OK).unwrap();
    assert_eq!(v["insight"], "Good week.");
    let fenced = OK.replace("{\\\"insight", "```json{\\\"insight").replace("more.\\\"}", "more.\\\"}```");
    assert_eq!(parse(200, &fenced).unwrap()["tweak"], "Rest more.");
  }

  #[test]
  fn invalid_json_is_a_shape_error() {
    assert_eq!(parse(200, "not json"), Err(AiError::Shape));
    assert_eq!(parse(200, r#"{"candidates":[]}"#), Err(AiError::Shape));
    let prose = r#"{"candidates":[{"content":{"parts":[{"text":"Sure! Here are ideas"}]}}]}"#;
    assert_eq!(parse(200, prose), Err(AiError::Shape));
  }

  #[test]
  fn maps_http_errors() {
    let cases = [(400, "bad_request"), (401, "key"), (403, "key"), (404, "model"), (429, "rate_limited"), (500, "server"), (503, "server")];
    for (status, code) in cases {
      assert_eq!(parse(status, r#"{"error":{"message":"x"}}"#).unwrap_err().code(), code, "status {status}");
    }
    assert_eq!(AiError::Timeout.code(), "timeout");
  }
}
