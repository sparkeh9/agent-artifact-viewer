use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TextLocation {
    pub path: String,
    pub line: usize,
    pub column: usize,
    pub offset: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Target {
    Selection {
        start: TextLocation,
        end: TextLocation,
        #[serde(rename = "textQuote")]
        text_quote: String,
    },
    File {
        path: String,
    },
    Global,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Comment {
    pub id: String,
    pub target: Target,
    pub content: String,
    pub author: String,
    pub timestamp: String,
}

// Wrapper for comments list to save as JSON
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
struct CommentsFile {
    comments: Vec<Comment>,
}

fn get_comments_file_path(file_path: &str) -> String {
    format!("{}.comments.json", file_path)
}

#[tauri::command]
pub fn save_comment(file_path: String, comment: Comment) -> Result<Vec<Comment>, String> {
    let comments_path = get_comments_file_path(&file_path);
    
    let mut comments_file: CommentsFile = if Path::new(&comments_path).exists() {
        let content = fs::read_to_string(&comments_path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        CommentsFile::default()
    };

    // Check if updating existing or adding new
    if let Some(idx) = comments_file.comments.iter().position(|c| c.id == comment.id) {
        comments_file.comments[idx] = comment;
    } else {
        comments_file.comments.push(comment);
    }

    let json = serde_json::to_string_pretty(&comments_file).map_err(|e| e.to_string())?;
    fs::write(&comments_path, json).map_err(|e| e.to_string())?;

    Ok(comments_file.comments)
}

#[tauri::command]
pub fn load_comments(file_path: String) -> Result<Vec<Comment>, String> {
    let comments_path = get_comments_file_path(&file_path);
    
    if Path::new(&comments_path).exists() {
        let content = fs::read_to_string(&comments_path).map_err(|e| e.to_string())?;
        let comments_file: CommentsFile = serde_json::from_str(&content).unwrap_or_default();
        Ok(comments_file.comments)
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn delete_comment(file_path: String, comment_id: String) -> Result<Vec<Comment>, String> {
    let comments_path = get_comments_file_path(&file_path);
    
    if Path::new(&comments_path).exists() {
        let content = fs::read_to_string(&comments_path).map_err(|e| e.to_string())?;
        let mut comments_file: CommentsFile = serde_json::from_str(&content).unwrap_or_default();
        
        comments_file.comments.retain(|c| c.id != comment_id);
        
        if comments_file.comments.is_empty() {
             // clean up empty files
             let _ = fs::remove_file(&comments_path);
             Ok(Vec::new())
        } else {
             let json = serde_json::to_string_pretty(&comments_file).map_err(|e| e.to_string())?;
             fs::write(&comments_path, json).map_err(|e| e.to_string())?;
             Ok(comments_file.comments)
        }
    } else {
        Ok(Vec::new())
    }
}
