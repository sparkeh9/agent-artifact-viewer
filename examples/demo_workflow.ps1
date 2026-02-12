# Example workflow demonstrating the Artifact Viewer
$ErrorActionPreference = "Stop"

# Ensure UTF-8 for piping
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8


Write-Host "=========================================="
Write-Host "Artifact Viewer - Example Workflow (PowerShell)"
Write-Host "=========================================="
Write-Host ""

# Helper function to invoke MCP method
function Invoke-McpMethod {
    param (
        [string]$Method,
        [hashtable]$Params,
        [int]$Id
    )
    
    $req = @{
        jsonrpc = "2.0"
        id      = $Id
        method  = $Method
        params  = $Params
    }
    
    $json = $req | ConvertTo-Json -Depth 10 -Compress
    # Parse escape sequences for manual JSON construction if needed, but ConvertTo-Json should be fine
    # except for special chars in content.
    
    # We use cargo run. We suppress stderr to avoid noise, but keep it if verification fails.
    # Note: cargo run might recompiling, so it might be slow.
    $responseJson = $json | cargo run --quiet --bin artifact-mcp-server 2>$null
    
    return $responseJson
}

# Step 1: Create an artifact
Write-Host "Step 1: Creating a new artifact..."
$content1 = @"
# Example Document

## Introduction

This is an example artifact for demonstration.

## Features

- Support for markdown
- Real-time preview
- Comments and reviews
- Version tracking
"@

$req1 = @{
    jsonrpc = "2.0"
    id      = 1
    method  = "artifact.create"
    params  = @{
        id      = "example-doc-ps"
        content = $content1
    }
}
$json1 = $req1 | ConvertTo-Json -Depth 5 -Compress
$response1 = $json1 | cargo run --quiet --bin artifact-mcp-server 2>$null
Write-Host "Response: $response1"
Write-Host ""

# Step 2: List artifacts
Write-Host "Step 2: Listing all artifacts..."
$req2 = @{
    jsonrpc = "2.0"
    id      = 2
    method  = "artifact.list"
    params  = @{}
}
$json2 = $req2 | ConvertTo-Json -Compress
$response2 = $json2 | cargo run --quiet --bin artifact-mcp-server 2>$null
Write-Host "Response: $response2"
Write-Host ""

# Step 3: Update the artifact
Write-Host "Step 3: Updating the artifact..."
$content2 = @"
# Example Document

## Introduction

This is an updated example artifact.

## New Features

- Enhanced markdown support
- Real-time preview
- Inline comments
- Review workflow
- Diff tracking
"@

$req3 = @{
    jsonrpc = "2.0"
    id      = 3
    method  = "artifact.update"
    params  = @{
        id      = "example-doc-ps"
        content = $content2
    }
}
$json3 = $req3 | ConvertTo-Json -Depth 5 -Compress
$response3 = $json3 | cargo run --quiet --bin artifact-mcp-server 2>$null
Write-Host "Response: $response3"
Write-Host ""

# Step 4: Open for review
Write-Host "Step 4: Opening artifact for review..."
$req4 = @{
    jsonrpc = "2.0"
    id      = 4
    method  = "artifact.open"
    params  = @{
        id = "example-doc-ps"
    }
}
$json4 = $req4 | ConvertTo-Json -Compress
$response4 = $json4 | cargo run --quiet --bin artifact-mcp-server 2>$null
Write-Host "Response: $response4"

# Extract Review ID
try {
    $obj4 = $response4 | ConvertFrom-Json
    # Structure might be result -> review_id or similar depending on implementation
    # The bash script grep suggests: "review_id":"..."
    # Let's inspect the object structure if possible, but usually it's in result.
    # Note: McpResponse struct in mcp.rs has `result: Option<Value>`.
    
    # We can try to dynamically get it.
    # But for now, just print it if we can't parse strictly.
    # The implementation of `artifact.open` returns a string? Or object?
    # Let's assume it returns an object with review_id?
    # Inspecting mcp.rs... (I read it earlier).
    # `handle_open` returns `json!({ "status": "opened", "review_id": review_id })`
    
    $reviewId = $obj4.result.review_id
}
catch {
    $reviewId = "Unknown (Parse Error)"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Workflow complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Artifact 'example-doc-ps' has been created and is ready for review."
Write-Host "Review ID: $reviewId"
Write-Host ""
Write-Host "To view the artifact in the GUI:"
Write-Host "  cargo run --bin artifact-viewer"
Write-Host ""
