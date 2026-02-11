use std::fs;
use std::path::{Path, PathBuf};
use anyhow::{Result, Context};
use chrono::Utc;

use crate::{Artifact, ArtifactMeta, Comment, Review};

pub struct Storage {
    base_path: PathBuf,
}

impl Storage {
    pub fn new<P: AsRef<Path>>(base_path: P) -> Result<Self> {
        let base_path = base_path.as_ref().to_path_buf();
        fs::create_dir_all(&base_path)
            .context("Failed to create storage directory")?;
        Ok(Self { base_path })
    }

    pub fn artifact_dir(&self, id: &str) -> PathBuf {
        self.base_path.join("artifacts").join(id)
    }

    pub fn create_artifact(&self, id: String, content: String) -> Result<Artifact> {
        let dir = self.artifact_dir(&id);
        fs::create_dir_all(&dir)?;
        
        let now = Utc::now();
        let artifact = Artifact {
            id: id.clone(),
            content: content.clone(),
            created_at: now,
            updated_at: now,
        };

        let meta = ArtifactMeta {
            id: id.clone(),
            created_at: now,
            updated_at: now,
        };

        fs::write(dir.join("artifact.md"), &content)?;
        fs::write(dir.join("meta.json"), serde_json::to_string_pretty(&meta)?)?;
        fs::write(dir.join("comments.json"), "[]")?;
        
        Ok(artifact)
    }

    pub fn update_artifact(&self, id: &str, content: String) -> Result<Artifact> {
        let dir = self.artifact_dir(id);
        if !dir.exists() {
            anyhow::bail!("Artifact {} not found", id);
        }

        let mut meta: ArtifactMeta = self.read_json(&dir.join("meta.json"))?;
        meta.updated_at = Utc::now();

        fs::write(dir.join("artifact.md"), &content)?;
        fs::write(dir.join("meta.json"), serde_json::to_string_pretty(&meta)?)?;

        Ok(Artifact {
            id: id.to_string(),
            content,
            created_at: meta.created_at,
            updated_at: meta.updated_at,
        })
    }

    pub fn get_artifact(&self, id: &str) -> Result<Artifact> {
        let dir = self.artifact_dir(id);
        if !dir.exists() {
            anyhow::bail!("Artifact {} not found", id);
        }

        let meta: ArtifactMeta = self.read_json(&dir.join("meta.json"))?;
        let content = fs::read_to_string(dir.join("artifact.md"))?;

        Ok(Artifact {
            id: id.to_string(),
            content,
            created_at: meta.created_at,
            updated_at: meta.updated_at,
        })
    }

    pub fn list_artifacts(&self) -> Result<Vec<String>> {
        let artifacts_dir = self.base_path.join("artifacts");
        if !artifacts_dir.exists() {
            return Ok(vec![]);
        }

        let mut ids = Vec::new();
        for entry in fs::read_dir(artifacts_dir)? {
            let entry = entry?;
            if entry.file_type()?.is_dir() {
                if let Some(name) = entry.file_name().to_str() {
                    ids.push(name.to_string());
                }
            }
        }
        Ok(ids)
    }

    pub fn save_comments(&self, id: &str, comments: &[Comment]) -> Result<()> {
        let dir = self.artifact_dir(id);
        fs::write(dir.join("comments.json"), serde_json::to_string_pretty(comments)?)?;
        Ok(())
    }

    pub fn load_comments(&self, id: &str) -> Result<Vec<Comment>> {
        let dir = self.artifact_dir(id);
        let path = dir.join("comments.json");
        if !path.exists() {
            return Ok(vec![]);
        }
        self.read_json(&path)
    }

    pub fn save_review(&self, review: &Review) -> Result<()> {
        let dir = self.artifact_dir(&review.artifact_id);
        let reviews_dir = dir.join("reviews");
        fs::create_dir_all(&reviews_dir)?;
        
        let review_path = reviews_dir.join(format!("{}.json", review.id));
        fs::write(review_path, serde_json::to_string_pretty(review)?)?;
        Ok(())
    }

    pub fn load_review(&self, artifact_id: &str, review_id: &str) -> Result<Review> {
        let dir = self.artifact_dir(artifact_id);
        let review_path = dir.join("reviews").join(format!("{}.json", review_id));
        self.read_json(&review_path)
    }

    pub fn get_latest_review(&self, artifact_id: &str) -> Result<Option<Review>> {
        let dir = self.artifact_dir(artifact_id);
        let reviews_dir = dir.join("reviews");
        if !reviews_dir.exists() {
            return Ok(None);
        }

        let mut reviews = Vec::new();
        for entry in fs::read_dir(reviews_dir)? {
            let entry = entry?;
            if entry.path().extension().and_then(|s| s.to_str()) == Some("json") {
                let review: Review = self.read_json(&entry.path())?;
                reviews.push(review);
            }
        }

        reviews.sort_by_key(|r| r.created_at);
        Ok(reviews.last().cloned())
    }

    fn read_json<T: serde::de::DeserializeOwned>(&self, path: &Path) -> Result<T> {
        let content = fs::read_to_string(path)?;
        Ok(serde_json::from_str(&content)?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_temp_storage() -> (Storage, tempfile::TempDir) {
        let temp_dir = tempfile::tempdir().unwrap();
        let storage = Storage::new(temp_dir.path()).unwrap();
        (storage, temp_dir)
    }

    #[test]
    fn test_create_and_get_artifact() {
        let (storage, _temp) = create_temp_storage();
        
        let id = "test-id".to_string();
        let content = "# Test\nContent".to_string();
        
        let artifact = storage.create_artifact(id.clone(), content.clone()).unwrap();
        assert_eq!(artifact.id, id);
        assert_eq!(artifact.content, content);
        
        let retrieved = storage.get_artifact(&id).unwrap();
        assert_eq!(retrieved.id, id);
        assert_eq!(retrieved.content, content);
    }

    #[test]
    fn test_update_artifact() {
        let (storage, _temp) = create_temp_storage();
        
        let id = "test-id".to_string();
        let content1 = "Initial content".to_string();
        let content2 = "Updated content".to_string();
        
        storage.create_artifact(id.clone(), content1).unwrap();
        let updated = storage.update_artifact(&id, content2.clone()).unwrap();
        
        assert_eq!(updated.content, content2);
        
        let retrieved = storage.get_artifact(&id).unwrap();
        assert_eq!(retrieved.content, content2);
    }

    #[test]
    fn test_list_artifacts() {
        let (storage, _temp) = create_temp_storage();
        
        storage.create_artifact("id1".to_string(), "content1".to_string()).unwrap();
        storage.create_artifact("id2".to_string(), "content2".to_string()).unwrap();
        
        let ids = storage.list_artifacts().unwrap();
        assert_eq!(ids.len(), 2);
        assert!(ids.contains(&"id1".to_string()));
        assert!(ids.contains(&"id2".to_string()));
    }

    #[test]
    fn test_comments() {
        let (storage, _temp) = create_temp_storage();
        
        let id = "test-id".to_string();
        storage.create_artifact(id.clone(), "content".to_string()).unwrap();
        
        let comments = vec![
            Comment {
                line: 1,
                content: "Comment 1".to_string(),
                snapshot: "line 1".to_string(),
                created_at: Utc::now(),
            },
        ];
        
        storage.save_comments(&id, &comments).unwrap();
        let loaded = storage.load_comments(&id).unwrap();
        
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].content, "Comment 1");
    }
}

