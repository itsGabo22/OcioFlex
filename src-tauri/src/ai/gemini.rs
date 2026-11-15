use serde_json::{json, Value};
use std::time::Duration;

/// One Gemini `generateContent` call. The key travels in a header (never in the URL, so it cannot leak into logs).
pub async fn complete(key: &str, model: &str, system: &str, user: &str) -> Result<String, String> {
  if !model.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '.' | '_')) {
    return Err("invalid model name".into());
  }
  let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent");
  let body = json!({
    "systemInstruction": { "parts": [{ "text": system }] },
    "contents": [{ "role": "user", "parts": [{ "text": user }] }],
    "generationConfig": { "responseMimeType": "application/json", "temperature": 0.7 }
  });
  let client = reqwest::Client::builder().timeout(Duration::from_secs(15)).build().map_err(|e| e.to_string())?;
  let resp = client
    .post(url)
    .header("x-goog-api-key", key)
    .json(&body)
    .send()
    .await
    .map_err(|e| format!("network: {}", e.without_url()))?;
  let status = resp.status();
  let value: Value = resp.json().await.map_err(|e| format!("decode: {}", e.without_url()))?;
  if !status.is_success() {
    let msg = value.pointer("/error/message").and_then(Value::as_str).unwrap_or("request failed");
    return Err(format!("http {status}: {msg}"));
  }
  value
    .pointer("/candidates/0/content/parts/0/text")
    .and_then(Value::as_str)
    .map(str::to_owned)
    .ok_or_else(|| "empty response".into())
}
