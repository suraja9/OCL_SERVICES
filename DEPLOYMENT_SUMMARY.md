# 📦 VPS Deployment Preparation Summary

Your OCL project has been prepared for VPS hosting! Here's what has been set up:

## ✅ Files Created

### Configuration Files
1. **`ecosystem.config.js`** - PM2 process manager configuration for production
2. **`backend/.env.example`** - Template for backend environment variables (create manually if needed)
3. **`Frontend/.env.example`** - Template for frontend environment variables (create manually if needed)

### Deployment Scripts
1. **`deploy.sh`** - Automated deployment script for updating your application
2. **`scripts/setup-vps.sh`** - Initial VPS setup script (installs Node.js, PM2, Nginx, etc.)
3. **`scripts/create-env-examples.sh`** - Script to create .env.example files

### Nginx Configurations
1. **`nginx/ocl-backend.conf`** - Nginx configuration for backend API
2. **`nginx/ocl-frontend.conf`** - Nginx configuration for frontend

### Documentation
1. **`VPS_DEPLOYMENT_README.md`** - Complete deployment guide
2. **`DEPLOYMENT_CHECKLIST.md`** - Step-by-step deployment checklist
3. **`HOSTING_GUIDE.md`** - Detailed hosting guide (already existed)

## 🚀 Quick Start Guide

### 1. On Your VPS (First Time Setup)

```bash
# Run the VPS setup script
sudo bash scripts/setup-vps.sh

# Clone your repository
cd /var/www
git clone <your-repo-url> OCL_MAIN
cd OCL_MAIN
```

### 2. Create Environment Files

**Backend:**
```bash
cd backend
# Create .env from .env.example (or create manually)
cp .env.example .env
nano .env  # Edit with your actual values
```

**Frontend:**
```bash
cd ../Frontend
# Create .env.production from .env.example (or create manually)
cp .env.example .env.production
nano .env.production  # Edit with your actual values
```

### 3. Deploy

```bash
cd /var/www/OCL_MAIN
chmod +x deploy.sh
sudo ./deploy.sh
```

### 4. Configure Nginx

```bash
# Copy Nginx configs
sudo cp nginx/ocl-backend.conf /etc/nginx/sites-available/ocl-backend
sudo cp nginx/ocl-frontend.conf /etc/nginx/sites-available/ocl-frontend

# Edit to match your domain
sudo nano /etc/nginx/sites-available/ocl-backend
sudo nano /etc/nginx/sites-available/ocl-frontend

# Enable sites
sudo ln -s /etc/nginx/sites-available/ocl-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ocl-frontend /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup SSL (if you have a domain)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

## 📋 Required Environment Variables

### Backend (.env)
- `MONGO_URI` - MongoDB Atlas connection string
- `PORT` - Backend port (default: 5000)
- `NODE_ENV=production`
- `FRONTEND_URL` - Your frontend domain
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- `MSG91_AUTH_KEY` - SMS service key (optional)
- `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME` - AWS S3 config
- `JWT_SECRET` - Secure JWT secret (min 32 characters)

### Frontend (.env.production)
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `VITE_API_URL` - Backend API URL (e.g., `https://www.oclservices.com/api`)

## 🔧 Important Configuration Steps

1. **MongoDB Atlas**: Add your VPS IP to Network Access whitelist
2. **AWS S3**: Update CORS policy with your production domain
3. **Domain DNS**: Point your domain A records to VPS IP
4. **Firewall**: Ensure ports 22, 80, 443 are open
5. **SSL**: Setup Let's Encrypt certificates for HTTPS

## 📚 Documentation Files

- **`VPS_DEPLOYMENT_README.md`** - Start here for complete deployment guide
- **`DEPLOYMENT_CHECKLIST.md`** - Use this to track your deployment progress
- **`HOSTING_GUIDE.md`** - Detailed step-by-step hosting instructions

## 🛠️ Useful Commands

### PM2 Management
```bash
pm2 list                    # List processes
pm2 logs ocl-backend       # View logs
pm2 restart ocl-backend   # Restart backend
pm2 monit                   # Monitor resources
```

### Nginx Management
```bash
sudo nginx -t              # Test configuration
sudo systemctl reload nginx # Reload configuration
sudo tail -f /var/log/nginx/error.log  # View error logs
```

### Deployment Updates
```bash
cd /var/www/OCL_MAIN
git pull origin main
sudo ./deploy.sh
```

## ⚠️ Important Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Update `.gitignore`** - Already configured to ignore `.env` files
3. **File Permissions** - Scripts are ready, will be executable on Linux
4. **Backup** - Always backup `.env` files before deployment
5. **Test First** - Test deployment on a staging server if possible

## 🔍 Next Steps

1. Review `VPS_DEPLOYMENT_README.md` for detailed instructions
2. Use `DEPLOYMENT_CHECKLIST.md` to track your progress
3. Configure all environment variables
4. Test locally if possible before deploying to production
5. Follow the deployment steps in order

## 🆘 Troubleshooting

If you encounter issues:
- Check `DEPLOYMENT_CHECKLIST.md` troubleshooting section
- Review PM2 logs: `pm2 logs ocl-backend`
- Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify environment variables are set correctly
- Test each component individually

---

**Your project is now ready for VPS deployment!** 🎉

Follow the guides and checklists provided to complete your deployment successfully.

