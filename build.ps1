# Build script for Windows
Write-Host "Starting build process..."

# Check if process is running and stop it
$ProcessName = "artifact-viewer"
if (Get-Process $ProcessName -ErrorAction SilentlyContinue) {
    Write-Host "Stopping running instance of $ProcessName..."
    Stop-Process -Name $ProcessName -Force
    Start-Sleep -Seconds 1
}

# Also check for .exe extension just in case
if (Get-Process "$ProcessName.exe" -ErrorAction SilentlyContinue) {
    Write-Host "Stopping running instance of $ProcessName.exe..."
    Stop-Process -Name "$ProcessName.exe" -Force
    Start-Sleep -Seconds 1
}

# Install dependencies
Write-Host "Installing dependencies..."
npm install

# Build release
Write-Host "Building release..."
npm run release

Write-Host "Build complete! Installer located in src-tauri/target/release/bundle/msi/"
