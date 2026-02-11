# Artifact Viewer

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-12%20passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

A Rust-based artifact viewer and editor with Model Context Protocol (MCP) integration and a GUI built with eframe/egui. This tool allows CLI-based agents to create, edit, and review markdown artifacts with a visual interface.

## Quick Start

```bash
# Build the project
cargo build --release

# Run the MCP server
cargo run --bin artifact-mcp-server

# Launch the GUI
cargo run --bin artifact-viewer

# Run the demo
./examples/demo_workflow.sh
```

## Features

- **MCP Server**: JSON-RPC 2.0 server exposing artifact management tools
- **GUI Editor**: Real-time markdown editing with preview
- **Review System**: Add inline comments, track edits, and submit reviews
- **Persistent Storage**: Artifacts stored in structured directories with metadata
- **Diff Tracking**: Automatic diff calculation between baseline and current versions

## Architecture

### MCP Tools

The following tools are exposed via the MCP server:

1. **artifact.create**: Create a new artifact
   - Params: `{ "content": string, "id"?: string }`
   - Returns: `{ "id": string, "created_at": timestamp }`

2. **artifact.update**: Update an existing artifact
   - Params: `{ "id": string, "content": string }`
   - Returns: `{ "id": string, "updated_at": timestamp }`

3. **artifact.open**: Open an artifact for review
   - Params: `{ "id": string }`
   - Returns: `{ "id": string, "content": string, "review_id": string }`

4. **artifact.create_and_open**: Create and immediately open for review
   - Params: `{ "content": string, "id"?: string }`
   - Returns: `{ "id": string, "content": string, "review_id": string }`

5. **artifact.list**: List all artifacts
   - Params: none
   - Returns: `{ "artifacts": string[] }`

6. **artifact.await_review**: Wait for review completion (blocks until submit/cancel/timeout)
   - Params: `{ "timeout"?: number }` (default: 300 seconds)
   - Returns: Review JSON with diff, edits, comments, and final_markdown

7. **artifact.get_latest_review**: Get the most recent review for an artifact
   - Params: `{ "artifact_id": string }`
   - Returns: Review JSON or null

### Storage Structure

Artifacts are stored in the following structure:

```
artifacts/
  <artifact-id>/
    artifact.md         # Current markdown content
    meta.json          # Metadata (id, created_at, updated_at)
    comments.json      # Array of comments
    reviews/           # Historical reviews
      <review-id>.json
```

### Review JSON Format

Reviews are returned in the following format:

```json
{
  "review_id": "uuid",
  "artifact_id": "uuid",
  "diff": "unified diff string",
  "edits": [
    {
      "before_start": 0,
      "before_end": 1,
      "after_start": 0,
      "after_end": 2
    }
  ],
  "comments": [
    {
      "line": 5,
      "content": "This needs clarification",
      "snapshot": "Original line content",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "final_markdown": "Final content after edits",
  "submitted": true,
  "cancelled": false
}
```

## Installation

### Prerequisites

- Rust 1.70 or later
- Cargo

### Build

```bash
cargo build --release
```

This produces two binaries:
- `target/release/artifact-viewer` - GUI application
- `target/release/artifact-mcp-server` - MCP server

## Usage

### Running the MCP Server

```bash
# Use default storage path (./artifacts)
cargo run --bin artifact-mcp-server

# Or specify a custom storage path
ARTIFACT_STORAGE_PATH=/path/to/storage cargo run --bin artifact-mcp-server
```

The server reads JSON-RPC requests from stdin and writes responses to stdout.

### Running the GUI

```bash
cargo run --bin artifact-viewer
```

The GUI provides:
- **Editor Panel**: Edit markdown with line numbers
- **Preview Panel**: Real-time markdown preview (toggle with checkbox)
- **Comments Panel**: View and manage inline comments
- **Hover to Comment**: Hover over a line and click "+" to add a comment
- **Review Controls**: Submit or Cancel buttons in the top bar

### Example MCP Usage

Create an artifact:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"artifact.create","params":{"content":"# Hello\nThis is my artifact"}}' | cargo run --bin artifact-mcp-server
```

Open for review and wait:
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"artifact.open","params":{"id":"<artifact-id>"}}' | cargo run --bin artifact-mcp-server
echo '{"jsonrpc":"2.0","id":3,"method":"artifact.await_review","params":{"timeout":600}}' | cargo run --bin artifact-mcp-server
```

### Integration with Agents

The MCP server can be integrated with CLI-based agents that support the Model Context Protocol. Configure your agent to:

1. Start the MCP server as a subprocess
2. Send JSON-RPC requests via stdin
3. Read responses from stdout
4. Launch the GUI when `artifact.open` or `artifact.create_and_open` is called
5. Wait for review completion with `artifact.await_review`

## Development

### Running Tests

```bash
cargo test
```

### Project Structure

```
src/
  lib.rs           # Core types and module exports
  main.rs          # GUI application entry point
  mcp_server.rs    # MCP server binary
  storage.rs       # File system storage management
  mcp.rs           # MCP protocol implementation
  review.rs        # Review lifecycle management
  diff_utils.rs    # Diff calculation utilities
  gui.rs           # eframe/egui GUI implementation
```

## License

MIT

