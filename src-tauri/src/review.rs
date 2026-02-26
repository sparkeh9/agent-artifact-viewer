use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Comment {
    pub id: String,
    pub line: usize,
    pub content: String,
    pub author: String,
    pub timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct ReviewState {
    pub artifact_id: String,
    pub content: String,
    pub comments: Vec<Comment>,
}

pub struct ReviewManager {
    pub state: Arc<Mutex<ReviewState>>,
}

impl ReviewManager {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(ReviewState::default())),
        }
    }

    pub fn set_content(&self, content: String) {
        let mut state = self.state.lock().unwrap();
        state.content = content;
    }

    pub fn add_comment(&self, line: usize, content: String, author: String) {
        let mut state = self.state.lock().unwrap();
        let id = uuid::Uuid::new_v4().to_string();
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
            
        state.comments.push(Comment {
            id,
            line,
            content,
            author,
            timestamp,
        });
    }

    pub fn get_state(&self) -> ReviewState {
        self.state.lock().unwrap().clone()
    }
}
