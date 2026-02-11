use artifact_viewer::{storage::Storage, review::ReviewManager};
use std::sync::Arc;

#[tokio::test]
async fn test_review_workflow() {
    let temp_dir = tempfile::tempdir().unwrap();
    let storage = Storage::new(temp_dir.path()).unwrap();
    let review_manager = Arc::new(ReviewManager::new());

    // Create an artifact
    let artifact = storage.create_artifact(
        "test-workflow".to_string(),
        "# Initial\nLine 1\nLine 2".to_string()
    ).unwrap();

    // Start a review
    let review_id = review_manager.start_review(
        artifact.id.clone(),
        artifact.content.clone(),
        "# Initial\nLine 1 modified\nLine 2".to_string()
    ).unwrap();

    assert!(!review_id.is_empty());

    // Add a comment
    review_manager.add_comment(
        2,
        "This line was modified".to_string(),
        "Line 1".to_string()
    ).unwrap();

    // Get the active review
    let review = review_manager.get_active_review().unwrap();
    assert_eq!(review.comments.len(), 1);
    assert!(review.diff.contains("Line 1"));
    assert!(review.diff.contains("Line 1 modified"));

    // Submit the review
    let completed_review = review_manager.submit_review().unwrap();
    assert!(completed_review.submitted);
    assert!(!completed_review.cancelled);

    // Save the review
    storage.save_review(&completed_review).unwrap();

    // Verify we can retrieve it
    let retrieved = storage.get_latest_review(&artifact.id).unwrap().unwrap();
    assert_eq!(retrieved.id, review_id);
    assert_eq!(retrieved.comments.len(), 1);
}
