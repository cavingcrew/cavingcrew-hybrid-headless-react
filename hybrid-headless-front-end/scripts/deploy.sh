#!/bin/bash

# Configuration
REMOTE_HOST="cavingcrew"
REMOTE_PATH="/home/bitnami/apps/nextjs-frontend"
APP_NAME="hybrid-headless-frontend"

# Plugin configurations
PLUGINS=(
    "hybrid source=../hybrid-headless-react-plugin name=hybrid-headless-react-plugin"
    "automatewoo source=../hybrid-headless-automatewoo name=hybrid-headless-automatewoo"
)

# Plugin deployment flags
declare -A PLUGIN_DEPLOY_FLAGS=(
    ["hybrid"]=0
    ["automatewoo"]=0
)
PLUGIN_DEST="/home/bitnami/stack/wordpress/wp-content/plugins"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m'
RED='\033[0;31m'
YELLOW='\033[1;33m'

# Function to deploy WordPress plugin
deploy_plugin() {
    local plugin_key=$1
    local plugin_source plugin_name
    
    # Find the plugin by key and parse its properties
    for plugin in "${PLUGINS[@]}"; do
        IFS=' ' read -r key src name <<< "$plugin"
        [[ "$key" == "$plugin_key" ]] || continue
        plugin_source=${src#*=}
        plugin_name=${name#*=}
    done

    echo "🔌 Deploying WordPress plugin: $plugin_name..."
    
    # Deactivate plugin
    echo "⏸️  Deactivating plugin..."
    ssh -o "ForwardX11=no" -o "ForwardAgent=no" "$REMOTE_HOST" "sudo wp plugin deactivate $plugin_name --path=/home/bitnami/stack/wordpress --allow-root"
    
    # Deploy plugin files
    echo "📤 Copying plugin files..."
    rsync --delete -avz -e ssh \
        --exclude='.git/' \
        --exclude='.gitignore' \
        --exclude='node_modules/' \
        --exclude='tests/' \
        --exclude='.github/' \
        "$plugin_source/." \
        "$REMOTE_HOST:$PLUGIN_DEST/$plugin_name/"

    if [ $? -ne 0 ]; then
        echo -e "${RED}Plugin deployment failed${NC}"
        exit 1
    fi

    # Reactivate plugin
    echo "▶️  Reactivating plugin..."
    ssh -o "ForwardX11=no" -o "ForwardAgent=no" "$REMOTE_HOST" "sudo wp plugin activate $plugin_name --path=/home/bitnami/stack/wordpress --allow-root"
    
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
SKIP_PLUGINS=false
PLUGIN_DEPLOY_MODE="default"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --plugins)
            PLUGIN_DEPLOY_MODE="all"
            shift
            ;;
        --only-automatewoo)
            PLUGIN_DEPLOY_MODE="automatewoo"
            shift
            ;;
        --skip-build) SKIP_BUILD=true ;;
        --skip-frontend) SKIP_FRONTEND=true ;;
        --skip-plugin) SKIP_PLUGINS=true ;;
        --frontend-only)
            SKIP_PLUGINS=true
            SKIP_BUILD=false
            shift
            ;;
        --plugins-only)
            SKIP_FRONTEND=true
            shift
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Main deployment logic
echo "🚀 Starting deployment process..."

# Handle frontend deployment
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

# Handle plugin deployments
if [ "$SKIP_PLUGINS" = false ]; then
    case $PLUGIN_DEPLOY_MODE in
        "all")
            for plugin in "${PLUGINS[@]}"; do
                IFS=' ' read -r key source name <<< "$plugin"
                deploy_plugin "$key"
            done
            ;;
        "automatewoo")
            for plugin in "${PLUGINS[@]}"; do
                IFS=' ' read -r key source name <<< "$plugin"
                if [ "$key" == "automatewoo" ]; then
                    deploy_plugin "$key"
                fi
            done
            ;;
        *)
            deploy_plugin "hybrid"
    esac
else
    echo -e "${YELLOW}Skipping plugin deployment...${NC}"
fi

echo -e "${GREEN}✨ All deployments complete!${NC}"
