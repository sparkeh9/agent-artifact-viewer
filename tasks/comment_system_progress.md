# Comment System Implementation Progress

## Completed
- [x] **Testing Framework Setup**: Configured Vitest, React Testing Library, and JSDOM. Smoke tests passing.
- [x] **Selector Logic**: Implemented and tested core utilities for comment anchoring:
    - `calculateLineColumn`: Maps character offsets to line/column numbers.
    - `getOffsetInElement`: Maps DOM nodes/offsets to absolute text offsets.
    - `createSelectorFromSelection`: Converts DOM Selections into serializable `Target` objects.
- [x] **Store Logic**: Initial implementation of `CommentStore` using Zustand with tests for adding/removing/filtering comments.

## In Progress
- [ ] **CommentStore Integration**: Connecting the store to the UI.

## Upcoming
- [ ] **UI Components**:
    - `CommentButton`: Floating button to initiate comments on selection.
    - `CommentSidebar`: To view and manage comments.
    - `CommentThread`: To display individual comment threads.
- [ ] **Data Persistence**:
    - Define Rust `Comment` struct.
    - Implement `save_comment` / `load_comments` Tauri commands.
    - Integrate with local file system JSON storage.
- [ ] **UI Integration**:
    - Connect `MarkdownViewer` to `CommentStore`.
    - Handle text selection events to trigger `CommentButton`.
