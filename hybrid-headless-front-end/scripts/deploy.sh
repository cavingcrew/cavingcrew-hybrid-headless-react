#!/bin/bash

# Configuration
PLUGIN_DIR="../hybrid-headless-react-plugin"
WORDPRESS_PLUGINS_DIR="/home/bitnami/stack/wordpress/wp-content/plugins/hybrid-headless-react-plugin"
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

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
    echo "NEXT_PUBLIC_WORDPRESS_API_URL=/wp-json" > .env.production
    echo "NEXT_PUBLIC_WORDPRESS_URL=/" >> .env.production
    echo -e "${GREEN}Created .env.production with default values${NC}"
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

# Copy standalone output if using standalone output
if [ -d ".next/standalone" ]; then
    cp -r .next/standalone/* "$BUILD_DIR/"
fi

# Create version file
echo "$(date '+%Y%m%d%H%M%S')" > "$BUILD_DIR/version.txt"

# Deploy to WordPress plugins directory
echo "📤 Deploying to WordPress plugins directory..."
if [ -d "$WORDPRESS_PLUGINS_DIR" ]; then
    rm -rf "$WORDPRESS_PLUGINS_DIR/dist"
    cp -r "$BUILD_DIR" "$WORDPRESS_PLUGINS_DIR/"
    echo -e "${GREEN}Deployment successful!${NC}"
else
    echo -e "${RED}WordPress plugins directory not found${NC}"
    echo "Build files are in $BUILD_DIR"
    exit 1
fi

echo -e "${GREEN}✨ Deployment complete!${NC}"
