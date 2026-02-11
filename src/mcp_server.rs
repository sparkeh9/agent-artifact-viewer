use artifact_viewer::mcp::McpServer;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let storage_path = std::env::var("ARTIFACT_STORAGE_PATH")
        .unwrap_or_else(|_| "./artifacts".to_string());

    let server = McpServer::new(&storage_path)?;
    
    eprintln!("Artifact MCP Server starting...");
    eprintln!("Storage path: {}", storage_path);
    
    server.run().await
}
