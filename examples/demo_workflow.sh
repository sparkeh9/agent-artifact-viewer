#!/bin/bash

# Example workflow demonstrating the Artifact Viewer

PROJECT_DIR="/home/runner/work/agent-artifact-viewer/agent-artifact-viewer"
cd "$PROJECT_DIR"

echo "=========================================="
echo "Artifact Viewer - Example Workflow"
echo "=========================================="
echo ""

# Step 1: Create an artifact
echo "Step 1: Creating a new artifact..."
RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"artifact.create","params":{"id":"example-doc","content":"# Example Document\n\n## Introduction\n\nThis is an example artifact for demonstration.\n\n## Features\n\n- Support for markdown\n- Real-time preview\n- Comments and reviews\n- Version tracking"}}' | cargo run --quiet --bin artifact-mcp-server 2>/dev/null)
echo "Response: $RESPONSE"
echo ""

# Step 2: List artifacts
echo "Step 2: Listing all artifacts..."
RESPONSE=$(echo '{"jsonrpc":"2.0","id":2,"method":"artifact.list","params":{}}' | cargo run --quiet --bin artifact-mcp-server 2>/dev/null)
echo "Response: $RESPONSE"
echo ""

# Step 3: Update the artifact
echo "Step 3: Updating the artifact..."
RESPONSE=$(echo '{"jsonrpc":"2.0","id":3,"method":"artifact.update","params":{"id":"example-doc","content":"# Example Document\n\n## Introduction\n\nThis is an updated example artifact.\n\n## New Features\n\n- Enhanced markdown support\n- Real-time preview\n- Inline comments\n- Review workflow\n- Diff tracking"}}' | cargo run --quiet --bin artifact-mcp-server 2>/dev/null)
echo "Response: $RESPONSE"
echo ""

# Step 4: Open for review
echo "Step 4: Opening artifact for review..."
RESPONSE=$(echo '{"jsonrpc":"2.0","id":4,"method":"artifact.open","params":{"id":"example-doc"}}' | cargo run --quiet --bin artifact-mcp-server 2>/dev/null)
echo "Response: $RESPONSE"
REVIEW_ID=$(echo "$RESPONSE" | grep -o '"review_id":"[^"]*"' | cut -d'"' -f4)
echo ""

echo "=========================================="
echo "Workflow complete!"
echo "=========================================="
echo ""
echo "Artifact 'example-doc' has been created and is ready for review."
echo "Review ID: $REVIEW_ID"
echo ""
echo "To view the artifact in the GUI:"
echo "  cargo run --bin artifact-viewer"
echo ""
echo "Artifact location:"
echo "  $PROJECT_DIR/artifacts/artifacts/example-doc/"
echo ""
