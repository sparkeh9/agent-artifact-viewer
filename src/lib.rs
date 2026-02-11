pub mod storage;
pub mod mcp;
pub mod gui;
pub mod review;
pub mod diff_utils;

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artifact {
    pub id: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub line: usize,
    pub content: String,
    pub snapshot: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditRange {
    pub before_start: usize,
    pub before_end: usize,
    pub after_start: usize,
    pub after_end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Review {
    pub id: String,
    pub artifact_id: String,
    pub baseline: String,
    pub current: String,
    pub diff: String,
    pub edits: Vec<EditRange>,
    pub comments: Vec<Comment>,
    pub final_markdown: String,
    pub submitted: bool,
    pub cancelled: bool,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArtifactMeta {
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
