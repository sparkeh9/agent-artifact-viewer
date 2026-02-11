use std::sync::Arc;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tokio::io::{self, AsyncBufReadExt, AsyncWriteExt, BufReader};
use uuid::Uuid;

use crate::{storage::Storage, review::ReviewManager};

#[derive(Debug, Deserialize)]
struct McpRequest {
    #[serde(rename = "jsonrpc")]
    _jsonrpc: String,
    id: Option<Value>,
    method: String,
    params: Option<Value>,
}

#[derive(Debug, Serialize)]
struct McpResponse {
    jsonrpc: String,
    id: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<McpError>,
}

#[derive(Debug, Serialize)]
struct McpError {
    code: i32,
    message: String,
}

pub struct McpServer {
    storage: Arc<Storage>,
    review_manager: Arc<ReviewManager>,
}

impl McpServer {
    pub fn new(storage_path: &str) -> Result<Self> {
        let storage = Arc::new(Storage::new(storage_path)?);
        let review_manager = Arc::new(ReviewManager::new());
        Ok(Self {
            storage,
            review_manager,
        })
    }

    pub async fn run(&self) -> Result<()> {
        let stdin = io::stdin();
        let mut stdout = io::stdout();
        let mut reader = BufReader::new(stdin);
        let mut line = String::new();

        loop {
            line.clear();
            let n = reader.read_line(&mut line).await?;
            if n == 0 {
                break; // EOF
            }

            let response = match serde_json::from_str::<McpRequest>(&line) {
                Ok(request) => self.handle_request(request).await,
                Err(e) => McpResponse {
                    jsonrpc: "2.0".to_string(),
                    id: None,
                    result: None,
                    error: Some(McpError {
                        code: -32700,
                        message: format!("Parse error: {}", e),
                    }),
                },
            };

            let response_json = serde_json::to_string(&response)?;
            stdout.write_all(response_json.as_bytes()).await?;
            stdout.write_all(b"\n").await?;
            stdout.flush().await?;
        }

        Ok(())
    }

    async fn handle_request(&self, request: McpRequest) -> McpResponse {
        let result = match request.method.as_str() {
            "artifact.create" => self.handle_create(&request.params).await,
            "artifact.update" => self.handle_update(&request.params).await,
            "artifact.open" => self.handle_open(&request.params).await,
            "artifact.create_and_open" => self.handle_create_and_open(&request.params).await,
            "artifact.list" => self.handle_list().await,
            "artifact.await_review" => self.handle_await_review(&request.params).await,
            "artifact.get_latest_review" => self.handle_get_latest_review(&request.params).await,
            _ => Err(anyhow::anyhow!("Unknown method: {}", request.method)),
        };

        match result {
            Ok(value) => McpResponse {
                jsonrpc: "2.0".to_string(),
                id: request.id,
                result: Some(value),
                error: None,
            },
            Err(e) => McpResponse {
                jsonrpc: "2.0".to_string(),
                id: request.id,
                result: None,
                error: Some(McpError {
                    code: -32603,
                    message: e.to_string(),
                }),
            },
        }
    }

    async fn handle_create(&self, params: &Option<Value>) -> Result<Value> {
        let params = params.as_ref().ok_or_else(|| anyhow::anyhow!("Missing params"))?;
        let content = params["content"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Missing content"))?;
        let id = params["id"]
            .as_str()
            .map(String::from)
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let artifact = self.storage.create_artifact(id.clone(), content.to_string())?;
        Ok(json!({
            "id": artifact.id,
            "created_at": artifact.created_at,
        }))
    }

    async fn handle_update(&self, params: &Option<Value>) -> Result<Value> {
        let params = params.as_ref().ok_or_else(|| anyhow::anyhow!("Missing params"))?;
        let id = params["id"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Missing id"))?;
        let content = params["content"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Missing content"))?;

        let artifact = self.storage.update_artifact(id, content.to_string())?;
        Ok(json!({
            "id": artifact.id,
            "updated_at": artifact.updated_at,
        }))
    }

    async fn handle_open(&self, params: &Option<Value>) -> Result<Value> {
        let params = params.as_ref().ok_or_else(|| anyhow::anyhow!("Missing params"))?;
        let id = params["id"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Missing id"))?;

        let artifact = self.storage.get_artifact(id)?;
        let baseline = artifact.content.clone();
        let review_id = self.review_manager.start_review(
            artifact.id.clone(),
            baseline.clone(),
            artifact.content.clone(),
        )?;

        Ok(json!({
            "id": artifact.id,
            "content": artifact.content,
            "review_id": review_id,
        }))
    }

    async fn handle_create_and_open(&self, params: &Option<Value>) -> Result<Value> {
        let params = params.as_ref().ok_or_else(|| anyhow::anyhow!("Missing params"))?;
        let content = params["content"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Missing content"))?;
        let id = params["id"]
            .as_str()
            .map(String::from)
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let artifact = self.storage.create_artifact(id.clone(), content.to_string())?;
        let review_id = self.review_manager.start_review(
            artifact.id.clone(),
            artifact.content.clone(),
            artifact.content.clone(),
        )?;

        Ok(json!({
            "id": artifact.id,
            "content": artifact.content,
            "review_id": review_id,
        }))
    }

    async fn handle_list(&self) -> Result<Value> {
        let ids = self.storage.list_artifacts()?;
        Ok(json!({ "artifacts": ids }))
    }

    async fn handle_await_review(&self, params: &Option<Value>) -> Result<Value> {
        let params = params.as_ref().ok_or_else(|| anyhow::anyhow!("Missing params"))?;
        let timeout = params["timeout"]
            .as_u64()
            .unwrap_or(300); // Default 5 minutes

        let review = self.review_manager.await_review_completion(timeout).await?;
        
        // Save review to storage
        self.storage.save_review(&review)?;
        
        // Update artifact if submitted
        if review.submitted {
            self.storage.update_artifact(&review.artifact_id, review.final_markdown.clone())?;
            self.storage.save_comments(&review.artifact_id, &review.comments)?;
        }

        self.review_manager.clear_active_review();

        Ok(json!({
            "review_id": review.id,
            "artifact_id": review.artifact_id,
            "diff": review.diff,
            "edits": review.edits,
            "comments": review.comments,
            "final_markdown": review.final_markdown,
            "submitted": review.submitted,
            "cancelled": review.cancelled,
        }))
    }

    async fn handle_get_latest_review(&self, params: &Option<Value>) -> Result<Value> {
        let params = params.as_ref().ok_or_else(|| anyhow::anyhow!("Missing params"))?;
        let artifact_id = params["artifact_id"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Missing artifact_id"))?;

        if let Some(review) = self.storage.get_latest_review(artifact_id)? {
            Ok(json!({
                "review_id": review.id,
                "artifact_id": review.artifact_id,
                "diff": review.diff,
                "edits": review.edits,
                "comments": review.comments,
                "final_markdown": review.final_markdown,
                "submitted": review.submitted,
                "cancelled": review.cancelled,
                "created_at": review.created_at,
                "completed_at": review.completed_at,
            }))
        } else {
            Ok(json!({ "review": null }))
        }
    }

    pub fn get_review_manager(&self) -> Arc<ReviewManager> {
        Arc::clone(&self.review_manager)
    }
}
