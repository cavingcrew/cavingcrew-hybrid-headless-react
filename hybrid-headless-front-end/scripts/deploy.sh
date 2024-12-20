#!/bin/bash

# Configuration
REMOTE_HOST="cavingcrew"
REMOTE_PATH="/home/bitnami/apps/nextjs-frontend"
APP_NAME="hybrid-headless-frontend"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Starting deployment process..."

# Build Next.js app
echo "📦 Building Next.js application..."
NEXT_TELEMETRY_DISABLED=1 npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed${NC}"
    exit 1
fi

# Create deployment directory if it doesn't exist
echo "🏗️ Ensuring proper directory structure..."
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

# Deploy application files
echo "📤 Deploying application..."
rsync -avz --delete \
    --exclude='.git/' \
    --exclude='.gitignore' \
    --exclude='node_modules/' \
    --exclude='.next/cache/' \
    --exclude='tests/' \
    --exclude='.github/' \
    ./ \
    "$REMOTE_HOST:$REMOTE_PATH/"

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed${NC}"
    exit 1
fi

# Install dependencies and restart PM2
echo "📦 Installing dependencies and restarting service..."
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && npm install --production"

# Copy and reload PM2 config
echo "📦 Updating PM2 configuration..."
scp ecosystem.config.js "$REMOTE_HOST:$REMOTE_PATH/"
ssh "$REMOTE_HOST" "cd $REMOTE_PATH && pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js"

if [ $? -ne 0 ]; then
    echo -e "${RED}Service restart failed${NC}"
    exit 1
fi

echo -e "${GREEN}✨ Deployment complete!${NC}"
