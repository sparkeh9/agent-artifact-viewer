#!/bin/bash
# Linux/macOS Build Script
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build release
echo "Building release..."
npm run release

echo "Build complete! Artifacts located in src-tauri/target/release/bundle/"
