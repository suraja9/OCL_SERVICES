#!/bin/bash

# OCL Project Deployment Script for VPS
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting OCL Project Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/OCL_MAIN"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/Frontend"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  This script should be run with sudo for some operations${NC}"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${GREEN}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

if ! command_exists pm2; then
    echo -e "${YELLOW}⚠️  PM2 is not installed. Installing PM2...${NC}"
    npm install -g pm2
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version 16+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Navigate to project directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    echo "Please clone the repository first or update PROJECT_DIR in this script"
    exit 1
fi

cd "$PROJECT_DIR"

# Pull latest changes
echo -e "\n${GREEN}📥 Pulling latest changes from git...${NC}"
git pull origin main || echo -e "${YELLOW}⚠️  Git pull failed or not a git repository${NC}"

# Deploy Backend
echo -e "\n${GREEN}🔧 Deploying Backend...${NC}"
cd "$BACKEND_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please update .env file with your actual values before continuing${NC}"
        read -p "Press Enter after updating .env file..."
    else
        echo -e "${RED}❌ .env.example not found. Please create .env manually${NC}"
        exit 1
    fi
fi

# Install dependencies
echo -e "${GREEN}📦 Installing backend dependencies...${NC}"
npm install --production

# Start/restart with PM2
echo -e "${GREEN}🔄 Starting backend with PM2...${NC}"
if pm2 list | grep -q "ocl-backend"; then
    echo -e "${YELLOW}⚠️  Backend already running. Restarting...${NC}"
    pm2 restart ocl-backend
else
    pm2 start ecosystem.config.js --env production || pm2 start server.js --name ocl-backend --env production
fi

pm2 save

# Deploy Frontend
echo -e "\n${GREEN}🎨 Deploying Frontend...${NC}"
cd "$FRONTEND_DIR"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env.production
        echo -e "${YELLOW}⚠️  Please update .env.production with your actual values${NC}"
    fi
fi

# Install dependencies
echo -e "${GREEN}📦 Installing frontend dependencies...${NC}"
npm install

# Build frontend
echo -e "${GREEN}🏗️  Building frontend for production...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed. dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build completed${NC}"

# Reload Nginx (if installed)
if command_exists nginx; then
    echo -e "\n${GREEN}🔄 Reloading Nginx...${NC}"
    sudo nginx -t && sudo systemctl reload nginx || echo -e "${YELLOW}⚠️  Nginx reload failed${NC}"
fi

# Show PM2 status
echo -e "\n${GREEN}📊 PM2 Status:${NC}"
pm2 list

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo "1. Check backend logs: pm2 logs ocl-backend"
echo "2. Check backend health: curl http://localhost:5000/api/health"
echo "3. Verify frontend is accessible"
echo "4. Test API endpoints"

