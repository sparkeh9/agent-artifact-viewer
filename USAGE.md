# Usage Guide

This guide provides detailed instructions for using the Artifact Viewer with MCP and GUI.

## Quick Start

### 1. Build the Project

```bash
cargo build --release
```

### 2. Run the Demo Workflow

```bash
./examples/demo_workflow.sh
```

### 3. Launch the GUI

```bash
cargo run --bin artifact-viewer
```

## MCP Server Usage

### Starting the Server

```bash
# Default storage path (./artifacts)
cargo run --bin artifact-mcp-server

# Custom storage path
ARTIFACT_STORAGE_PATH=/path/to/storage cargo run --bin artifact-mcp-server
```

### MCP Tool Reference

#### artifact.create

Create a new artifact.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "artifact.create",
  "params": {
    "id": "my-artifact",
    "content": "# My Artifact\n\nContent here."
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "my-artifact",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### artifact.update

Update an existing artifact.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "artifact.update",
  "params": {
    "id": "my-artifact",
    "content": "# My Updated Artifact\n\nNew content."
  }
}
```

#### artifact.list

List all artifacts.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "artifact.list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "artifacts": ["artifact-1", "artifact-2"]
  }
}
```

#### artifact.open

Open an artifact for review.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "artifact.open",
  "params": {
    "id": "my-artifact"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "id": "my-artifact",
    "content": "...",
    "review_id": "uuid"
  }
}
```

#### artifact.create_and_open

Create and immediately open an artifact for review.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "artifact.create_and_open",
  "params": {
    "id": "new-artifact",
    "content": "# New Artifact\n\nContent."
  }
}
```

#### artifact.await_review

Wait for review completion. This method blocks until the review is submitted, cancelled, or times out.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "artifact.await_review",
  "params": {
    "timeout": 600
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "review_id": "uuid",
    "artifact_id": "my-artifact",
    "diff": "...",
    "edits": [...],
    "comments": [...],
    "final_markdown": "...",
    "submitted": true,
    "cancelled": false
  }
}
```

#### artifact.get_latest_review

Get the most recent review for an artifact.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "artifact.get_latest_review",
  "params": {
    "artifact_id": "my-artifact"
  }
}
```

## GUI Usage

### Editor Panel

- **Line Numbers**: Each line is numbered for easy reference
- **Hover to Comment**: Hover over a line to see a "+" button
- **Click "+"**: Opens a modal to add a comment on that line

### Preview Panel

- Toggle the preview panel with the "Show Preview" checkbox
- Real-time rendering of markdown content

### Comments Panel

- View all comments added during the review
- Each comment shows:
  - Line number
  - Comment text
  - Original line snapshot

### Review Controls

- **Submit Review**: Saves the review and updates the artifact
- **Cancel Review**: Discards changes and cancels the review

## Integration with Agents

### Example: Python Agent

```python
import subprocess
import json

class ArtifactViewer:
    def __init__(self, storage_path="./artifacts"):
        self.process = subprocess.Popen(
            ["cargo", "run", "--bin", "artifact-mcp-server"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={"ARTIFACT_STORAGE_PATH": storage_path}
        )
    
    def send_request(self, method, params):
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        self.process.stdin.write(json.dumps(request).encode() + b"\n")
        self.process.stdin.flush()
        response = self.process.stdout.readline()
        return json.loads(response)
    
    def create_artifact(self, id, content):
        return self.send_request("artifact.create", {
            "id": id,
            "content": content
        })
    
    def open_for_review(self, id):
        # Open artifact for review
        result = self.send_request("artifact.open", {"id": id})
        
        # Launch GUI
        subprocess.Popen(["cargo", "run", "--bin", "artifact-viewer"])
        
        # Wait for review
        review = self.send_request("artifact.await_review", {"timeout": 600})
        return review

# Usage
viewer = ArtifactViewer()
viewer.create_artifact("my-doc", "# My Document\n\nContent here.")
review = viewer.open_for_review("my-doc")
print(f"Review completed: {review}")
```

## Storage Structure

Artifacts are stored in a hierarchical directory structure:

```
artifacts/
├── artifacts/
│   ├── artifact-1/
│   │   ├── artifact.md       # Current content
│   │   ├── meta.json        # Metadata
│   │   ├── comments.json    # Comments
│   │   └── reviews/         # Historical reviews
│   │       ├── review-1.json
│   │       └── review-2.json
│   └── artifact-2/
│       └── ...
```

## Tips and Best Practices

1. **Use Descriptive IDs**: Choose meaningful artifact IDs for easy identification
2. **Regular Reviews**: Conduct reviews frequently to track changes
3. **Comment Liberally**: Add comments to document important decisions
4. **Backup Storage**: Regularly backup the artifacts directory
5. **Timeout Settings**: Adjust review timeout based on expected review duration

## Troubleshooting

### MCP Server Not Responding

- Check that the server is running
- Verify JSON-RPC request format
- Check stderr for error messages

### GUI Not Launching

- Ensure display is available (X11 or Wayland)
- Check for OpenGL/graphics driver issues
- Try running with `RUST_LOG=debug` for more info

### Storage Issues

- Verify write permissions for storage directory
- Check disk space
- Ensure valid JSON in meta/comment files
