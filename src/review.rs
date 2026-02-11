use std::sync::{Arc, Mutex};
use std::time::Duration;
use anyhow::Result;
use chrono::Utc;
use uuid::Uuid;

use crate::{Review, Comment, diff_utils};

pub struct ReviewManager {
    active_review: Arc<Mutex<Option<Review>>>,
}

impl ReviewManager {
    pub fn new() -> Self {
        Self {
            active_review: Arc::new(Mutex::new(None)),
        }
    }

    pub fn start_review(&self, artifact_id: String, baseline: String, current: String) -> Result<String> {
        let review_id = Uuid::new_v4().to_string();
        let diff = diff_utils::compute_diff(&baseline, &current);
        let edits = diff_utils::compute_edit_ranges(&baseline, &current);

        let review = Review {
            id: review_id.clone(),
            artifact_id,
            baseline,
            current: current.clone(),
            diff,
            edits,
            comments: Vec::new(),
            final_markdown: current,
            submitted: false,
            cancelled: false,
            created_at: Utc::now(),
            completed_at: None,
        };

        let mut active = self.active_review.lock().unwrap();
        *active = Some(review);

        Ok(review_id)
    }

    pub fn add_comment(&self, line: usize, content: String, snapshot: String) -> Result<()> {
        let mut active = self.active_review.lock().unwrap();
        if let Some(review) = active.as_mut() {
            review.comments.push(Comment {
                line,
                content,
                snapshot,
                created_at: Utc::now(),
            });
            Ok(())
        } else {
            anyhow::bail!("No active review")
        }
    }

    pub fn update_current_content(&self, content: String) -> Result<()> {
        let mut active = self.active_review.lock().unwrap();
        if let Some(review) = active.as_mut() {
            review.current = content.clone();
            review.final_markdown = content;
            review.diff = diff_utils::compute_diff(&review.baseline, &review.current);
            review.edits = diff_utils::compute_edit_ranges(&review.baseline, &review.current);
            Ok(())
        } else {
            anyhow::bail!("No active review")
        }
    }

    pub fn submit_review(&self) -> Result<Review> {
        let mut active = self.active_review.lock().unwrap();
        if let Some(review) = active.as_mut() {
            review.submitted = true;
            review.completed_at = Some(Utc::now());
            Ok(review.clone())
        } else {
            anyhow::bail!("No active review")
        }
    }

    pub fn cancel_review(&self) -> Result<Review> {
        let mut active = self.active_review.lock().unwrap();
        if let Some(review) = active.as_mut() {
            review.cancelled = true;
            review.completed_at = Some(Utc::now());
            Ok(review.clone())
        } else {
            anyhow::bail!("No active review")
        }
    }

    pub fn get_active_review(&self) -> Option<Review> {
        self.active_review.lock().unwrap().clone()
    }

    pub fn is_review_complete(&self) -> bool {
        if let Some(review) = self.active_review.lock().unwrap().as_ref() {
            review.submitted || review.cancelled
        } else {
            false
        }
    }

    pub fn clear_active_review(&self) {
        let mut active = self.active_review.lock().unwrap();
        *active = None;
    }

    pub async fn await_review_completion(&self, timeout_secs: u64) -> Result<Review> {
        let start = std::time::Instant::now();
        let timeout = Duration::from_secs(timeout_secs);

        loop {
            if self.is_review_complete() {
                let active = self.active_review.lock().unwrap();
                if let Some(review) = active.as_ref() {
                    return Ok(review.clone());
                }
            }

            if start.elapsed() > timeout {
                anyhow::bail!("Review timeout after {} seconds", timeout_secs);
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }
}

impl Default for ReviewManager {
    fn default() -> Self {
        Self::new()
    }
}
