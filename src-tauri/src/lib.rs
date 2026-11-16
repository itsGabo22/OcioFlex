mod ai;
mod auth;
mod store;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .targets([
          tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
          tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: Some("ocioflex".into()) }),
        ])
        .build(),
    )
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![
      ai::ai_status,
      ai::ai_generate,
      ai::ai_set_key,
      ai::ai_clear_key,
      ai::ai_test,
      auth::auth_session,
      auth::auth_register,
      auth::auth_login,
      auth::auth_logout,
      auth::auth_change_password,
      auth::auth_delete_account,
      auth::auth_sample_profile,
      auth::data_load,
      auth::data_save,
      auth::prefs_get,
      auth::prefs_set,
    ])
    .setup(|app| {
      let root = app.path().app_data_dir()?;
      std::fs::create_dir_all(&root)?;
      app.manage(auth::AppState::new(root));
      log::info!("OcioFlex {} started", app.package_info().version);
      // Safety net: the frontend shows the window after its first paint; if it never does, show it anyway.
      let handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_secs(4)).await;
        if let Some(w) = handle.get_webview_window("main") {
          let _ = w.show();
        }
      });
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
