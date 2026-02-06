#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{collections::HashMap, sync::Mutex};

use tauri::{
    api::process::{Command, CommandChild, CommandEvent},
    Manager, RunEvent,
};

struct SidecarState(Mutex<Option<CommandChild>>);

fn main() {
    let context = tauri::generate_context!();
    let app = tauri::Builder::default()
        .setup(|app| {
            if std::env::var("TAURI_DISABLE_SIDECAR").is_ok() {
                return Ok(());
            }

            let mut envs = HashMap::new();
            envs.insert("API_HOST".to_string(), "127.0.0.1".to_string());
            envs.insert("API_PORT".to_string(), "5000".to_string());

            let (mut rx, child) = Command::new_sidecar("backend")?
                .envs(envs)
                .spawn()
                .map_err(|err| tauri::Error::from(err))?;

            app.manage(SidecarState(Mutex::new(Some(child))));

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Terminated(_) = event {
                        break;
                    }
                }
            });

            Ok(())
        })
        .build(context)
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::ExitRequested { .. } = event {
            if let Some(state) = app_handle.try_state::<SidecarState>() {
                if let Ok(mut guard) = state.0.lock() {
                    if let Some(child) = guard.take() {
                        let _ = child.kill();
                    }
                }
            }
        }
    });
}
