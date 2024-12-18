#!/bin/bash

# Configuration
PLUGIN_DIR="../hybrid-headless-react-plugin"
REMOTE_HOST="cavingcrew"
REMOTE_PATH="/home/bitnami/stack/wordpress/wp-content/plugins/hybrid-headless-react-plugin"
BUILD_DIR="$PLUGIN_DIR/dist"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Starting deployment process..."

# Check if plugin directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
    echo -e "${RED}Error: Plugin directory not found${NC}"
    exit 1
fi

# Build Next.js app
echo "📦 Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed${NC}"
    exit 1
fi

# Clean previous build in plugin
echo "🧹 Cleaning previous build..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy Next.js static files
echo "📋 Copying static files..."
cp -r .next/static "$BUILD_DIR/_next/"
cp -r public/* "$BUILD_DIR/"

# Create version file
echo "$(date '+%Y%m%d%H%M%S')" > "$BUILD_DIR/version.txt"

# Deploy to WordPress plugins directory using rsync
echo "📤 Deploying to WordPress plugins directory..."
rsync -avz --delete \
    --exclude='.git/' \
    --exclude='.gitignore' \
    --exclude='node_modules/' \
    "$BUILD_DIR/" \
    "$REMOTE_HOST:$REMOTE_PATH/dist/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✨ Deployment complete!${NC}"
else
    echo -e "${RED}Deployment failed${NC}"
    exit 1
fi
