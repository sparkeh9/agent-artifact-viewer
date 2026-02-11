use std::sync::Arc;
use artifact_viewer::gui::ArtifactViewerApp;
use artifact_viewer::review::ReviewManager;

fn main() -> Result<(), eframe::Error> {
    let review_manager = Arc::new(ReviewManager::new());
    
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1200.0, 800.0])
            .with_title("Artifact Viewer"),
        ..Default::default()
    };

    eframe::run_native(
        "Artifact Viewer",
        options,
        Box::new(|cc| Ok(Box::new(ArtifactViewerApp::new(cc, review_manager)))),
    )
}
