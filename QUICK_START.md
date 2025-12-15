# ⚡ Quick Start - VPS Deployment

## 🎯 Fastest Path to Deployment

### Step 1: Initial VPS Setup (One Time)
```bash
sudo bash scripts/setup-vps.sh
```

### Step 2: Clone & Configure
```bash
cd /var/www
git clone <your-repo-url> OCL_MAIN
cd OCL_MAIN
```

### Step 3: Create Environment Files

**Backend:**
```bash
cd backend
cat > .env << 'EOF'
MONGO_URI=your_mongodb_connection_string
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://www.oclservices.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MSG91_AUTH_KEY=your_msg91_key
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=ocl-services-uploads
JWT_SECRET=your_very_secure_jwt_secret_min_32_chars
EOF
nano .env  # Edit with your actual values
```

**Frontend:**
```bash
cd ../Frontend
cat > .env.production << 'EOF'
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=https://www.oclservices.com/api
EOF
nano .env.production  # Edit with your actual values
```

### Step 4: Deploy
```bash
cd /var/www/OCL_MAIN
chmod +x deploy.sh
sudo ./deploy.sh
```

### Step 5: Setup Nginx
```bash
# Copy configs
sudo cp nginx/ocl-backend.conf /etc/nginx/sites-available/ocl-backend
sudo cp nginx/ocl-frontend.conf /etc/nginx/sites-available/ocl-frontend

# Edit domain names
sudo nano /etc/nginx/sites-available/ocl-backend
sudo nano /etc/nginx/sites-available/ocl-frontend

# Enable
sudo ln -s /etc/nginx/sites-available/ocl-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ocl-frontend /etc/nginx/sites-enabled/

# Test & reload
sudo nginx -t && sudo systemctl reload nginx
```

### Step 6: SSL (If you have domain)
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

## ✅ Verify Deployment

```bash
# Check backend
pm2 list
curl http://localhost:5000/api/health

# Check frontend
# Visit your domain in browser
```

## 🔄 Update Deployment

```bash
cd /var/www/OCL_MAIN
git pull
sudo ./deploy.sh
```

## 📚 Full Documentation

- **`VPS_DEPLOYMENT_README.md`** - Complete guide
- **`DEPLOYMENT_CHECKLIST.md`** - Step-by-step checklist
- **`HOSTING_GUIDE.md`** - Detailed hosting instructions

