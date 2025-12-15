#!/bin/bash

# VPS Initial Setup Script for OCL Project
# This script sets up a fresh VPS server for hosting the OCL project

set -e

echo "🚀 OCL VPS Initial Setup Script"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "\n${GREEN}📦 Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "\n${GREEN}📦 Step 2: Installing essential tools...${NC}"
apt install -y curl wget git build-essential ufw

echo -e "\n${GREEN}📦 Step 3: Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo -e "\n${GREEN}✅ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"

echo -e "\n${GREEN}📦 Step 4: Installing PM2...${NC}"
npm install -g pm2

echo -e "\n${GREEN}📦 Step 5: Installing Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

echo -e "\n${GREEN}📦 Step 6: Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "\n${GREEN}🔒 Step 7: Configuring Firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "\n${GREEN}✅ Firewall status:${NC}"
ufw status

echo -e "\n${GREEN}📁 Step 8: Creating project directory...${NC}"
mkdir -p /var/www
chown -R $SUDO_USER:$SUDO_USER /var/www

echo -e "\n${GREEN}✅ VPS setup completed!${NC}"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo "1. Clone your repository: cd /var/www && git clone <your-repo-url> OCL_MAIN"
echo "2. Follow the deployment checklist in DEPLOYMENT_CHECKLIST.md"
echo "3. Configure environment variables"
echo "4. Deploy using: ./deploy.sh"

echo -e "\n${YELLOW}⚠️  Important:${NC}"
echo "- Make sure to configure PM2 startup: pm2 startup"
echo "- Update MongoDB Atlas IP whitelist with your VPS IP"
echo "- Configure your domain DNS records"
echo "- Set up SSL certificates with Certbot"

