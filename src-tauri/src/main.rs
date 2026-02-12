// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod review;

use crate::review::{ReviewManager, ReviewState};
use tauri::State;

#[tauri::command]
fn get_review_state(manager: State<'_, ReviewManager>) -> ReviewState {
    manager.get_state()
}

#[tauri::command]
fn add_comment(
    manager: State<'_, ReviewManager>,
    line: usize,
    content: String,
    author: String,
) -> ReviewState {
    manager.add_comment(line, content, author);
    manager.get_state()
}

#[tauri::command]
fn set_artifact_content(manager: State<'_, ReviewManager>, content: String) -> ReviewState {
    manager.set_content(content);
    manager.get_state()
}

#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        // Fix for Windows: replace forward slashes with backslashes
        let path = path.replace("/", "\\");
        
        // Use cmd /C start to ensure the file is opened with its default handler, 
        // not just revealed in Explorer. Quoting handles spaces correctly.
        // We use "start" followed by empty string for title, then the path.
        Command::new("cmd")
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(ReviewManager::new())
        .invoke_handler(tauri::generate_handler![
            get_review_state,
            add_comment,
            set_artifact_content,
            open_file,
            read_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
