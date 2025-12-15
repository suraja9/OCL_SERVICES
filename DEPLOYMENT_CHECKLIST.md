# 🚀 VPS Deployment Checklist for OCL Project

Use this checklist to ensure your project is properly deployed on your VPS.

## 📋 Pre-Deployment Checklist

### Server Requirements
- [ ] VPS with Ubuntu 20.04+ or similar Linux distribution
- [ ] Root or sudo access
- [ ] At least 2GB RAM (4GB+ recommended)
- [ ] At least 20GB storage
- [ ] Domain name configured (optional but recommended)

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] PM2 installed globally
- [ ] Nginx installed
- [ ] Git installed
- [ ] Firewall (UFW) configured

## 🔧 Server Setup

### Initial Server Configuration
- [ ] Connected to VPS via SSH
- [ ] System packages updated (`sudo apt update && sudo apt upgrade -y`)
- [ ] Essential tools installed (curl, wget, git, build-essential)
- [ ] Node.js installed and verified
- [ ] PM2 installed and configured for auto-start
- [ ] Nginx installed and running
- [ ] Firewall configured (ports 22, 80, 443 open)

## 📦 Project Setup

### Repository
- [ ] Project cloned to `/var/www/OCL_MAIN` (or your preferred directory)
- [ ] Project directory permissions set correctly
- [ ] Git repository is up to date

### Backend Configuration
- [ ] Navigated to `backend/` directory
- [ ] `.env` file created from `.env.example`
- [ ] All environment variables configured:
  - [ ] `MONGO_URI` - MongoDB Atlas connection string
  - [ ] `PORT` - Backend port (default: 5000)
  - [ ] `NODE_ENV=production`
  - [ ] `FRONTEND_URL` - Your frontend domain
  - [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
  - [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
  - [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
  - [ ] `MSG91_AUTH_KEY` - SMS service key (if used)
  - [ ] `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME` - AWS S3 config
  - [ ] `JWT_SECRET` - Secure JWT secret (min 32 characters)
- [ ] `google-credentials.json` uploaded (if using Google OAuth)
- [ ] Dependencies installed (`npm install --production`)
- [ ] Backend tested manually (`node server.js`)
- [ ] Backend started with PM2 (`pm2 start ecosystem.config.js --env production`)
- [ ] PM2 process saved (`pm2 save`)
- [ ] Backend health check passed (`curl http://localhost:5000/api/health`)

### Frontend Configuration
- [ ] Navigated to `Frontend/` directory
- [ ] `.env.production` file created from `.env.example`
- [ ] Environment variables configured:
  - [ ] `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
  - [ ] `VITE_API_URL` - Backend API URL (production domain)
- [ ] Dependencies installed (`npm install`)
- [ ] Frontend built for production (`npm run build`)
- [ ] `dist/` folder created and contains built files
- [ ] Frontend files accessible at build location

## 🌐 Nginx Configuration

### Backend Nginx Setup
- [ ] Nginx config file created at `/etc/nginx/sites-available/ocl-backend`
- [ ] Configuration file contains correct:
  - [ ] Server name (API subdomain or IP)
  - [ ] Proxy pass to `http://localhost:5000`
  - [ ] Client max body size (50M for file uploads)
  - [ ] Proper proxy headers
- [ ] Symlink created: `sudo ln -s /etc/nginx/sites-available/ocl-backend /etc/nginx/sites-enabled/`
- [ ] Nginx configuration tested (`sudo nginx -t`)
- [ ] Nginx reloaded (`sudo systemctl reload nginx`)

### Frontend Nginx Setup
- [ ] Nginx config file created at `/etc/nginx/sites-available/ocl-frontend`
- [ ] Configuration file contains correct:
  - [ ] Server name (your domain)
  - [ ] Root path pointing to `/var/www/OCL_MAIN/Frontend/dist`
  - [ ] API proxy configuration (`/api` location)
  - [ ] Static file caching
  - [ ] Security headers
- [ ] Symlink created: `sudo ln -s /etc/nginx/sites-available/ocl-frontend /etc/nginx/sites-enabled/`
- [ ] Default Nginx site removed (if needed)
- [ ] Nginx configuration tested (`sudo nginx -t`)
- [ ] Nginx reloaded (`sudo systemctl reload nginx`)

## 🔒 SSL Certificate (Let's Encrypt)

### SSL Setup
- [ ] Certbot installed (`sudo apt install -y certbot python3-certbot-nginx`)
- [ ] Domain DNS records configured (A record pointing to VPS IP)
- [ ] SSL certificate obtained for frontend domain
- [ ] SSL certificate obtained for API subdomain (if separate)
- [ ] SSL auto-renewal tested (`sudo certbot renew --dry-run`)
- [ ] HTTP to HTTPS redirect configured
- [ ] SSL certificate valid and working

## 🔐 Security Configuration

### MongoDB Atlas
- [ ] VPS IP address added to MongoDB Atlas Network Access whitelist
- [ ] MongoDB connection tested from VPS
- [ ] Database credentials secure and not exposed

### AWS S3
- [ ] AWS credentials configured correctly
- [ ] S3 bucket CORS policy updated with production domain
- [ ] S3 bucket policy allows necessary operations
- [ ] AWS credentials tested (upload/download works)

### Firewall
- [ ] UFW firewall enabled
- [ ] SSH port (22) allowed
- [ ] HTTP port (80) allowed
- [ ] HTTPS port (443) allowed
- [ ] Unnecessary ports closed
- [ ] Firewall status verified (`sudo ufw status`)

### Environment Security
- [ ] `.env` files not committed to git
- [ ] `.env` files have correct permissions (600)
- [ ] Sensitive files (google-credentials.json) secured
- [ ] SSH key authentication enabled (password auth disabled - optional but recommended)

## ✅ Testing

### Backend Testing
- [ ] Backend accessible via domain/IP
- [ ] Health endpoint working: `https://api.yourdomain.com/api/health`
- [ ] API endpoints responding correctly
- [ ] File upload functionality working
- [ ] Database operations working
- [ ] Email sending working (test email sent)
- [ ] PM2 logs show no errors

### Frontend Testing
- [ ] Frontend accessible via domain
- [ ] All pages loading correctly
- [ ] API calls working (check browser console)
- [ ] Static assets loading (images, CSS, JS)
- [ ] No console errors
- [ ] Authentication flow working
- [ ] File uploads working (if applicable)

### Integration Testing
- [ ] Frontend can communicate with backend
- [ ] CORS configured correctly
- [ ] Authentication tokens working
- [ ] File uploads end-to-end working
- [ ] Email notifications working
- [ ] All critical features functional

## 📊 Monitoring & Maintenance

### PM2 Monitoring
- [ ] PM2 process running (`pm2 list`)
- [ ] PM2 logs checked (`pm2 logs ocl-backend`)
- [ ] PM2 auto-restart on boot configured
- [ ] PM2 log rotation configured

### Nginx Monitoring
- [ ] Nginx status checked (`sudo systemctl status nginx`)
- [ ] Nginx error logs reviewed (`sudo tail -f /var/log/nginx/error.log`)
- [ ] Nginx access logs reviewed

### System Monitoring
- [ ] Server resources monitored (CPU, RAM, Disk)
- [ ] Disk space sufficient
- [ ] Backup strategy in place
- [ ] Update strategy planned

## 🔄 Post-Deployment

### Documentation
- [ ] Deployment documented
- [ ] Environment variables documented
- [ ] Domain/DNS information documented
- [ ] Credentials stored securely (password manager)

### Team Access
- [ ] Team members have SSH access (if needed)
- [ ] Deployment process documented for team
- [ ] Rollback procedure documented

## 🚨 Troubleshooting

If issues occur, check:
- [ ] PM2 logs: `pm2 logs ocl-backend`
- [ ] Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] System logs: `sudo journalctl -xe`
- [ ] Backend health: `curl http://localhost:5000/api/health`
- [ ] Port availability: `sudo netstat -tulpn | grep 5000`
- [ ] Environment variables: Check `.env` file
- [ ] File permissions: `ls -la /var/www/OCL_MAIN`
- [ ] DNS resolution: `nslookup yourdomain.com`

## 📝 Notes

- Keep this checklist updated as you deploy
- Document any custom configurations
- Note any issues encountered and their solutions
- Update deployment scripts if needed

---

**Last Updated:** [Date]
**Deployed By:** [Name]
**VPS Provider:** [Provider]
**Domain:** [Domain]

