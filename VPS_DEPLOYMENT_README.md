# 🚀 VPS Deployment Guide for OCL Project

This guide will help you deploy the OCL (Our Courier & Logistics) project on a VPS server.

## 📋 Quick Start

### Option 1: Automated Setup (Recommended)

1. **Run the VPS setup script** (first time only):
   ```bash
   sudo bash scripts/setup-vps.sh
   ```

2. **Clone your repository**:
   ```bash
   cd /var/www
   git clone <your-repo-url> OCL_MAIN
   cd OCL_MAIN
   ```

3. **Configure environment variables**:
   - Backend: Copy `backend/.env.example` to `backend/.env` and fill in your values
   - Frontend: Copy `Frontend/.env.example` to `Frontend/.env.production` and fill in your values

4. **Run the deployment script**:
   ```bash
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

5. **Configure Nginx**:
   ```bash
   # Copy Nginx configs
   sudo cp nginx/ocl-backend.conf /etc/nginx/sites-available/ocl-backend
   sudo cp nginx/ocl-frontend.conf /etc/nginx/sites-available/ocl-frontend
   
   # Edit configs to match your domain
   sudo nano /etc/nginx/sites-available/ocl-backend
   sudo nano /etc/nginx/sites-available/ocl-frontend
   
   # Enable sites
   sudo ln -s /etc/nginx/sites-available/ocl-backend /etc/nginx/sites-enabled/
   sudo ln -s /etc/nginx/sites-available/ocl-frontend /etc/nginx/sites-enabled/
   
   # Test and reload
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Setup SSL** (if you have a domain):
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Option 2: Manual Setup

Follow the detailed guide in [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) or use the [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md).

## 📁 Project Structure

```
OCL_MAIN/
├── backend/              # Node.js/Express backend
│   ├── .env             # Backend environment variables (create from .env.example)
│   ├── server.js       # Main server file
│   └── ...
├── Frontend/            # React/Vite frontend
│   ├── .env.production # Frontend production env (create from .env.example)
│   ├── dist/           # Built frontend files (generated)
│   └── ...
├── ecosystem.config.js  # PM2 configuration
├── deploy.sh           # Deployment script
├── nginx/              # Nginx configuration templates
│   ├── ocl-backend.conf
│   └── ocl-frontend.conf
└── scripts/
    └── setup-vps.sh    # VPS initial setup script
```

## 🔧 Environment Variables

### Backend (.env)

Create `backend/.env` with the following variables:

```env
# MongoDB Atlas Connection String
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://www.oclservices.com

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Gmail SMTP Configuration (for email sending - fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# MSG91 Authentication Key (for SMS)
MSG91_AUTH_KEY=your_msg91_auth_key_here

# AWS S3 Configuration
AWS_ACCESS_KEY=your_aws_access_key_here
AWS_SECRET_KEY=your_aws_secret_key_here
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=ocl-services-uploads

# Google Sheets Configuration (optional)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# JWT Secret (for authentication tokens)
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters_long
```

### Frontend (.env.production)

Create `Frontend/.env.production` with:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend API URL
VITE_API_URL=https://www.oclservices.com/api
# OR if using separate API subdomain:
# VITE_API_URL=https://api.oclservices.com/api
```

## 🚀 Deployment Commands

### Initial Deployment

```bash
# 1. Setup VPS (first time only)
sudo bash scripts/setup-vps.sh

# 2. Clone repository
cd /var/www
git clone <your-repo-url> OCL_MAIN
cd OCL_MAIN

# 3. Configure environment variables
cp backend/.env.example backend/.env
cp Frontend/.env.example Frontend/.env.production
# Edit both files with your actual values

# 4. Deploy
chmod +x deploy.sh
sudo ./deploy.sh
```

### Updating Deployment

```bash
cd /var/www/OCL_MAIN

# Pull latest changes
git pull origin main

# Run deployment script
sudo ./deploy.sh
```

### Manual Update

```bash
# Backend
cd /var/www/OCL_MAIN/backend
npm install --production
pm2 restart ocl-backend

# Frontend
cd /var/www/OCL_MAIN/Frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 📊 PM2 Management

```bash
# View all processes
pm2 list

# View logs
pm2 logs ocl-backend

# Restart backend
pm2 restart ocl-backend

# Stop backend
pm2 stop ocl-backend

# Delete process
pm2 delete ocl-backend

# Monitor resources
pm2 monit

# Save current process list
pm2 save
```

## 🌐 Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 🔒 SSL Certificate Management

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# View certificates
sudo certbot certificates
```

## ✅ Health Checks

### Backend Health

```bash
# Local check
curl http://localhost:5000/api/health

# Via domain (if configured)
curl https://api.yourdomain.com/api/health
```

### Frontend Check

- Visit your domain in a browser
- Check browser console for errors
- Verify API calls are working

## 🔍 Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs ocl-backend

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Check environment variables
cd /var/www/OCL_MAIN/backend
cat .env

# Test manually
node server.js
```

### Frontend Not Loading

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if dist folder exists
ls -la /var/www/OCL_MAIN/Frontend/dist

# Check Nginx configuration
sudo nginx -t

# Check file permissions
ls -la /var/www/OCL_MAIN/Frontend/dist
```

### Database Connection Issues

1. Check MongoDB Atlas Network Access - ensure VPS IP is whitelisted
2. Verify `MONGO_URI` in `.env` file
3. Test connection from VPS:
   ```bash
   curl -v "your_mongodb_connection_string"
   ```

### File Upload Issues

1. Check Nginx `client_max_body_size` (should be 50M)
2. Check AWS S3 credentials
3. Check S3 bucket CORS configuration
4. Verify file permissions on upload directories

## 🔐 Security Checklist

- [ ] Firewall (UFW) enabled and configured
- [ ] SSL certificates installed and auto-renewal configured
- [ ] `.env` files not committed to git
- [ ] `.env` files have correct permissions (600)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] AWS S3 bucket policy configured
- [ ] SSH key authentication enabled (optional but recommended)
- [ ] Regular system updates scheduled
- [ ] Backups configured

## 📝 Important Notes

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Update MongoDB Atlas whitelist** - Add your VPS IP address
3. **Update S3 CORS policy** - Add your production domain
4. **Keep PM2 running** - It manages your backend process
5. **Monitor logs regularly** - Check PM2 and Nginx logs
6. **Backup regularly** - Backup `.env` files and database
7. **Update dependencies** - Regularly update npm packages
8. **Monitor resources** - Check CPU, RAM, and disk usage

## 📚 Additional Resources

- [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) - Detailed hosting guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Comprehensive deployment checklist
- [backend/README.md](./backend/README.md) - Backend documentation
- [Frontend/README.md](./Frontend/README.md) - Frontend documentation

## 🆘 Support

If you encounter issues:

1. Check the [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) troubleshooting section
2. Review PM2 logs: `pm2 logs ocl-backend`
3. Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Check system logs: `sudo journalctl -xe`
5. Verify all environment variables are set correctly
6. Test each component individually (backend, frontend, database, S3)

---

**Last Updated:** 2024
**Project:** OCL Services
**Version:** 1.0.0

