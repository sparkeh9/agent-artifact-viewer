use std::sync::Arc;
use eframe::egui;
use egui::{FontId, RichText, Color32};
use pulldown_cmark::{Parser, html};

use crate::review::ReviewManager;

pub struct ArtifactViewerApp {
    review_manager: Arc<ReviewManager>,
    editor_text: String,
    show_preview: bool,
    hovered_line: Option<usize>,
    show_comment_modal: bool,
    comment_line: usize,
    comment_text: String,

}

impl ArtifactViewerApp {
    pub fn new(_cc: &eframe::CreationContext, review_manager: Arc<ReviewManager>) -> Self {
        let editor_text = if let Some(review) = review_manager.get_active_review() {
            review.current
        } else {
            String::new()
        };

        Self {
            review_manager,
            editor_text,
            show_preview: true,
            hovered_line: None,
            show_comment_modal: false,
            comment_line: 0,
            comment_text: String::new(),

        }
    }

    fn render_markdown_preview(&self, ui: &mut egui::Ui) {
        let parser = Parser::new(&self.editor_text);
        let mut html_output = String::new();
        html::push_html(&mut html_output, parser);

        egui::ScrollArea::vertical().show(ui, |ui| {
            // Simple markdown rendering (just show text, could be enhanced)
            for line in self.editor_text.lines() {
                ui.label(line);
            }
        });
    }

    fn render_editor(&mut self, ui: &mut egui::Ui) {
        let lines: Vec<&str> = self.editor_text.lines().collect();
        
        egui::ScrollArea::vertical()
            .id_salt("editor_scroll")
            .show(ui, |ui| {
                for (idx, line) in lines.iter().enumerate() {
                    let line_num = idx + 1;
                    
                    ui.horizontal(|ui| {
                        // Line number
                        ui.label(
                            RichText::new(format!("{:4} ", line_num))
                                .color(Color32::GRAY)
                                .font(FontId::monospace(12.0))
                        );

                        // Check if hovering this line
                        let line_response = ui.label(
                            RichText::new(*line)
                                .font(FontId::monospace(12.0))
                        );

                        if line_response.hovered() {
                            self.hovered_line = Some(line_num);
                            
                            // Show "+" button
                            if ui.small_button("+").clicked() {
                                self.comment_line = line_num;
                                self.comment_text.clear();
                                self.show_comment_modal = true;
                            }
                        }
                    });
                }
            });
    }

    fn show_comment_modal(&mut self, ctx: &egui::Context) {
        if !self.show_comment_modal {
            return;
        }

        egui::Window::new("Add Comment")
            .collapsible(false)
            .resizable(true)
            .default_width(400.0)
            .show(ctx, |ui| {
                ui.label(format!("Comment on line {}", self.comment_line));
                ui.add_space(10.0);

                ui.label("Comment:");
                ui.text_edit_multiline(&mut self.comment_text);
                ui.add_space(10.0);

                ui.horizontal(|ui| {
                    if ui.button("Add Comment").clicked() {
                        let lines: Vec<&str> = self.editor_text.lines().collect();
                        let snapshot = if self.comment_line > 0 && self.comment_line <= lines.len() {
                            lines[self.comment_line - 1].to_string()
                        } else {
                            String::new()
                        };

                        if let Err(e) = self.review_manager.add_comment(
                            self.comment_line,
                            self.comment_text.clone(),
                            snapshot,
                        ) {
                            eprintln!("Failed to add comment: {}", e);
                        }

                        self.show_comment_modal = false;
                    }

                    if ui.button("Cancel").clicked() {
                        self.show_comment_modal = false;
                    }
                });
            });
    }

    fn show_comments_panel(&self, ui: &mut egui::Ui) {
        ui.heading("Comments");
        ui.separator();

        if let Some(review) = self.review_manager.get_active_review() {
            if review.comments.is_empty() {
                ui.label("No comments yet");
            } else {
                egui::ScrollArea::vertical().show(ui, |ui| {
                    for comment in &review.comments {
                        ui.group(|ui| {
                            ui.label(RichText::new(format!("Line {}", comment.line)).strong());
                            ui.label(&comment.content);
                            ui.label(
                                RichText::new(format!("\"{}\"", comment.snapshot))
                                    .italics()
                                    .color(Color32::GRAY)
                            );
                        });
                        ui.add_space(5.0);
                    }
                });
            }
        }
    }
}

impl eframe::App for ArtifactViewerApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Update current content in review manager
        if let Some(review) = self.review_manager.get_active_review() {
            if self.editor_text != review.current {
                let _ = self.review_manager.update_current_content(self.editor_text.clone());
            }
        }

        // Top panel with controls
        egui::TopBottomPanel::top("top_panel").show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.heading("Artifact Viewer");
                ui.separator();

                ui.checkbox(&mut self.show_preview, "Show Preview");
                
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if ui.button("Cancel Review").clicked() {
                        if let Err(e) = self.review_manager.cancel_review() {
                            eprintln!("Failed to cancel review: {}", e);
                        }
                    }

                    if ui.button("Submit Review").clicked() {
                        if let Err(e) = self.review_manager.submit_review() {
                            eprintln!("Failed to submit review: {}", e);
                        }
                    }
                });
            });
        });

        // Side panel for comments
        egui::SidePanel::right("comments_panel")
            .default_width(300.0)
            .show(ctx, |ui| {
                self.show_comments_panel(ui);
            });

        // Central panel
        egui::CentralPanel::default().show(ctx, |ui| {
            if self.show_preview {
                ui.columns(2, |columns| {
                    columns[0].vertical(|ui| {
                        ui.heading("Editor");
                        ui.separator();
                        self.render_editor(ui);
                    });

                    columns[1].vertical(|ui| {
                        ui.heading("Preview");
                        ui.separator();
                        self.render_markdown_preview(ui);
                    });
                });
            } else {
                ui.vertical(|ui| {
                    ui.heading("Editor");
                    ui.separator();
                    
                    // Full-width text editor
                    egui::ScrollArea::vertical().show(ui, |ui| {
                        ui.add(
                            egui::TextEdit::multiline(&mut self.editor_text)
                                .font(FontId::monospace(12.0))
                                .desired_width(f32::INFINITY)
                        );
                    });
                });
            }
        });

        // Show comment modal
        self.show_comment_modal(ctx);

        // Request repaint for hover effects
        ctx.request_repaint();
    }
}
