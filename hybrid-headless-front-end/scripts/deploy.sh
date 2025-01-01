#!/bin/bash

# Configuration
REMOTE_HOST="cavingcrew"
REMOTE_PATH="/home/bitnami/apps/nextjs-frontend"
PLUGIN_SOURCE="../hybrid-headless-react-plugin"
PLUGIN_DEST="/home/bitnami/stack/wordpress/wp-content/plugins"
APP_NAME="hybrid-headless-frontend"
PLUGIN_NAME="hybrid-headless-react-plugin"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m'
RED='\033[0;31m'
YELLOW='\033[1;33m'

# Function to deploy WordPress plugin
deploy_plugin() {
    echo "🔌 Deploying WordPress plugin..."
    
    # Deactivate plugin
    echo "⏸️  Deactivating plugin..."
    ssh "$REMOTE_HOST" "wp plugin deactivate $PLUGIN_NAME --path=/home/bitnami/stack/wordpress"
    
    # Deploy plugin files
    echo "📤 Copying plugin files..."
    rsync --delete -avz -e ssh \
        --exclude='.git/' \
        --exclude='.gitignore' \
        --exclude='node_modules/' \
        --exclude='tests/' \
        --exclude='.github/' \
        "$PLUGIN_SOURCE" \
        "$REMOTE_HOST:$PLUGIN_DEST/"

    if [ $? -ne 0 ]; then
        echo -e "${RED}Plugin deployment failed${NC}"
        exit 1
    fi

    # Reactivate plugin
    echo "▶️  Reactivating plugin..."
    ssh "$REMOTE_HOST" "wp plugin activate $PLUGIN_NAME --path=/home/bitnami/stack/wordpress"
    
    echo -e "${GREEN}✨ Plugin deployment complete!${NC}"
}

# Function to deploy built files and restart service
deploy_frontend() {
    # Create deployment directory if it doesn't exist
    echo "🏗️ Ensuring proper directory structure..."
    ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

    # Deploy application files
    echo "📤 Deploying frontend application..."
    rsync -avz --delete \
        --exclude='.git/' \
        --exclude='.gitignore' \
        --exclude='node_modules/' \
        --exclude='.next/cache/' \
        --exclude='tests/' \
        --exclude='.github/' \
        --exclude='.env.development' \
        --exclude='.env.local' \
        --exclude='storybook-static/' \
        --exclude='.storybook/' \
        --exclude='coverage/' \
        --exclude='*.test.*' \
        --exclude='*.spec.*' \
        --exclude='README.md' \
        --exclude='CHANGELOG.md' \
        --exclude='jest.config.*' \
        --exclude='.eslintrc.*' \
        --exclude='.prettierrc.*' \
        --exclude='.stylelintrc.*' \
        --exclude='tsconfig.tsbuildinfo' \
        -e "ssh -T -o ForwardX11=no -o ForwardAgent=no" \
        ./ \
        "$REMOTE_HOST:$REMOTE_PATH/"

    if [ $? -ne 0 ]; then
        echo -e "${RED}Frontend deployment failed${NC}"
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
    
    echo -e "${GREEN}✨ Frontend deployment complete!${NC}"
}

# Parse command line arguments
SKIP_BUILD=false
SKIP_FRONTEND=false
SKIP_PLUGIN=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --skip-build) SKIP_BUILD=true ;;
        --skip-frontend) SKIP_FRONTEND=true ;;
        --skip-plugin) SKIP_PLUGIN=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Main deployment logic
echo "🚀 Starting deployment process..."

if [ "$SKIP_FRONTEND" = false ]; then
    if [ "$SKIP_BUILD" = false ]; then
        echo "📦 Building Next.js application..."
        NEXT_TELEMETRY_DISABLED=1 npm run build
        if [ $? -ne 0 ]; then
            echo -e "${RED}Build failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Skipping build phase...${NC}"
    fi
    
    deploy_frontend
else
    echo -e "${YELLOW}Skipping frontend deployment...${NC}"
fi

if [ "$SKIP_PLUGIN" = false ]; then
    deploy_plugin
else
    echo -e "${YELLOW}Skipping plugin deployment...${NC}"
fi

echo -e "${GREEN}✨ All deployments complete!${NC}"
