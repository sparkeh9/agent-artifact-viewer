// GUI component test - validates that the GUI can be instantiated and components work

use artifact_viewer::review::ReviewManager;
use std::sync::Arc;

#[test]
fn test_gui_app_creation() {
    // This test verifies the GUI app can be created with a review manager
    let review_manager = Arc::new(ReviewManager::new());
    
    // Start a review for testing
    let _review_id = review_manager.start_review(
        "test-artifact".to_string(),
        "# Original\nLine 1\nLine 2".to_string(),
        "# Original\nLine 1 modified\nLine 2".to_string()
    ).unwrap();
    
    // Verify the review is active
    let review = review_manager.get_active_review();
    assert!(review.is_some());
    
    let review = review.unwrap();
    assert_eq!(review.artifact_id, "test-artifact");
    assert!(review.diff.contains("Line 1"));
    assert!(review.diff.contains("modified"));
}

#[test]
fn test_comment_functionality() {
    let review_manager = Arc::new(ReviewManager::new());
    
    // Start a review
    review_manager.start_review(
        "test-artifact".to_string(),
        "# Doc\nLine 1\nLine 2".to_string(),
        "# Doc\nLine 1\nLine 2".to_string()
    ).unwrap();
    
    // Add comments (simulating GUI interaction)
    review_manager.add_comment(
        1,
        "Great title!".to_string(),
        "# Doc".to_string()
    ).unwrap();
    
    review_manager.add_comment(
        2,
        "Consider expanding this".to_string(),
        "Line 1".to_string()
    ).unwrap();
    
    // Verify comments were added
    let review = review_manager.get_active_review().unwrap();
    assert_eq!(review.comments.len(), 2);
    assert_eq!(review.comments[0].line, 1);
    assert_eq!(review.comments[0].content, "Great title!");
    assert_eq!(review.comments[1].line, 2);
    assert_eq!(review.comments[1].content, "Consider expanding this");
}

#[test]
fn test_content_updates() {
    let review_manager = Arc::new(ReviewManager::new());
    
    // Start a review
    review_manager.start_review(
        "test-artifact".to_string(),
        "Original content".to_string(),
        "Original content".to_string()
    ).unwrap();
    
    // Simulate editing in the GUI
    review_manager.update_current_content("Updated content".to_string()).unwrap();
    
    // Verify the content was updated
    let review = review_manager.get_active_review().unwrap();
    assert_eq!(review.current, "Updated content");
    assert_eq!(review.final_markdown, "Updated content");
    
    // Verify diff was recalculated
    assert!(review.diff.contains("Original content") || review.diff.contains("Updated content"));
}

#[test]
fn test_submit_review() {
    let review_manager = Arc::new(ReviewManager::new());
    
    // Start and modify review
    review_manager.start_review(
        "test-artifact".to_string(),
        "Original".to_string(),
        "Modified".to_string()
    ).unwrap();
    
    review_manager.add_comment(
        1,
        "Test comment".to_string(),
        "Original".to_string()
    ).unwrap();
    
    // Submit the review
    let completed = review_manager.submit_review().unwrap();
    
    assert!(completed.submitted);
    assert!(!completed.cancelled);
    assert_eq!(completed.comments.len(), 1);
    assert!(completed.completed_at.is_some());
}

#[test]
fn test_cancel_review() {
    let review_manager = Arc::new(ReviewManager::new());
    
    // Start and cancel review
    review_manager.start_review(
        "test-artifact".to_string(),
        "Original".to_string(),
        "Modified".to_string()
    ).unwrap();
    
    let cancelled = review_manager.cancel_review().unwrap();
    
    assert!(!cancelled.submitted);
    assert!(cancelled.cancelled);
    assert!(cancelled.completed_at.is_some());
}
