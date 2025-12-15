# Hostinger VPS Hosting Guide for OCL Project

## Prerequisites
- Hostinger VPS with root/SSH access
- Domain name (optional but recommended)
- MongoDB Atlas connection string
- AWS S3 credentials
- Google OAuth credentials (for email)

---

## Step 1: Initial Server Setup

### Connect to your VPS
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Install essential tools
```bash
sudo apt install -y curl wget git build-essential
```

---

## Step 2: Install Node.js (v18 or higher)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x or higher
npm --version
```

---

## Step 3: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs (usually: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username)
```

---

## Step 4: Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## Step 5: Setup Backend

### Clone your repository
```bash
cd /var/www  # or /home/username
git clone <your-repo-url> OCL_MAIN
cd OCL_MAIN/backend
```

### Install dependencies
```bash
npm install
```

### Create environment file
```bash
nano .env
```

Add the following (replace with your actual values):
```env
# Server
NODE_ENV=production
PORT=5000

# MongoDB
MONGO_URI=your_mongodb_atlas_connection_string

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=ocl-services-uploads

# Google OAuth (for email)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

# SMTP Fallback (optional)
SMTP_USER=your_gmail_address
SMTP_PASS=your_gmail_app_password
```

Save and exit (Ctrl+X, then Y, then Enter)

### Upload google-credentials.json (if needed)
```bash
# Use SCP or SFTP to upload the file
# Or create it manually if you have the content
nano google-credentials.json
# Paste your Google credentials JSON content
```

### Test backend
```bash
node server.js
# If it works, press Ctrl+C to stop
```

### Start with PM2
```bash
pm2 start server.js --name ocl-backend
pm2 save
pm2 list  # Check if it's running
pm2 logs ocl-backend  # View logs
```

---

## Step 6: Setup Frontend

### Navigate to frontend directory
```bash
cd /var/www/OCL_MAIN/Frontend
```

### Install dependencies
```bash
npm install
```

### Create production environment file
```bash
nano .env.production
```

Add:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
# OR if using same domain:
# VITE_API_BASE_URL=https://yourdomain.com
```

### Build frontend
```bash
npm run build
```

This creates a `dist` folder with production-ready files.

---

## Step 7: Configure Nginx

### Create backend configuration
```bash
sudo nano /etc/nginx/sites-available/ocl-backend
```

Add:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your API subdomain or IP

    # Increase body size for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

### Create frontend configuration
```bash
sudo nano /etc/nginx/sites-available/ocl-frontend
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain or IP

    root /var/www/OCL_MAIN/Frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase body size for file uploads
        client_max_body_size 50M;
        
        # Timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable sites
```bash
# Enable backend
sudo ln -s /etc/nginx/sites-available/ocl-backend /etc/nginx/sites-enabled/

# Enable frontend
sudo ln -s /etc/nginx/sites-available/ocl-frontend /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Step 8: Setup SSL Certificate (Let's Encrypt)

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get SSL certificate
```bash
# For frontend domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For API subdomain (if using separate domain)
sudo certbot --nginx -d api.yourdomain.com
```

### Auto-renewal (already configured by Certbot)
```bash
# Test renewal
sudo certbot renew --dry-run
```

---

## Step 9: Configure Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 10: Update MongoDB Atlas Whitelist

1. Go to MongoDB Atlas dashboard
2. Network Access → Add IP Address
3. Add your VPS IP address (or use 0.0.0.0/0 for all IPs - less secure)

---

## Step 11: Update AWS S3 CORS (if needed)

If your frontend domain is different, update S3 bucket CORS:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
            "https://yourdomain.com",
            "https://www.yourdomain.com"
        ],
        "ExposeHeaders": ["ETag"]
    }
]
```

---

## Step 12: Update Frontend API URLs

If you're using a separate API subdomain, update the frontend build:

1. Edit `.env.production`:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

2. Rebuild:
```bash
cd /var/www/OCL_MAIN/Frontend
npm run build
```

---

## Step 13: Final Testing

### Test backend
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs ocl-backend

# Test API endpoint
curl http://localhost:5000/api/health
```

### Test frontend
- Visit `https://yourdomain.com` in browser
- Check browser console for errors
- Test API calls

---

## Useful Commands

### PM2 Commands
```bash
pm2 list                    # List all processes
pm2 logs ocl-backend        # View logs
pm2 restart ocl-backend    # Restart backend
pm2 stop ocl-backend       # Stop backend
pm2 delete ocl-backend     # Delete process
pm2 monit                   # Monitor resources
```

### Nginx Commands
```bash
sudo systemctl status nginx    # Check status
sudo systemctl restart nginx   # Restart
sudo nginx -t                  # Test configuration
sudo systemctl reload nginx    # Reload config
```

### Update Application
```bash
# Pull latest changes
cd /var/www/OCL_MAIN
git pull

# Update backend
cd backend
npm install
pm2 restart ocl-backend

# Update frontend
cd ../Frontend
npm install
npm run build
sudo systemctl reload nginx
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs ocl-backend

# Check if port is in use
sudo netstat -tulpn | grep 5000

# Check environment variables
cd /var/www/OCL_MAIN/backend
cat .env
```

### Frontend not loading
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if dist folder exists
ls -la /var/www/OCL_MAIN/Frontend/dist

# Check Nginx configuration
sudo nginx -t
```

### SSL issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Permission issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/OCL_MAIN

# Fix permissions
sudo chmod -R 755 /var/www/OCL_MAIN
```

---

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication (disable password auth)
- [ ] SSL certificates installed
- [ ] Environment variables secured (not in git)
- [ ] MongoDB Atlas IP whitelist configured
- [ ] AWS S3 bucket policy configured
- [ ] Regular backups configured
- [ ] PM2 auto-restart enabled
- [ ] Nginx security headers (optional but recommended)

---

## Optional: Add Nginx Security Headers

Edit your Nginx config:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

---

## Backup Strategy

### Manual backup script
```bash
#!/bin/bash
# Create backup.sh

BACKUP_DIR="/var/backups/ocl"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup environment files
cp /var/www/OCL_MAIN/backend/.env $BACKUP_DIR/backend_env_$DATE

# Backup google-credentials.json
cp /var/www/OCL_MAIN/backend/google-credentials.json $BACKUP_DIR/google_creds_$DATE

echo "Backup completed: $BACKUP_DIR"
```

Make it executable:
```bash
chmod +x backup.sh
```

---

## Monitoring

### Setup PM2 monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Check server resources
```bash
# CPU and memory
htop

# Disk space
df -h

# Network
iftop
```

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs ocl-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system logs: `sudo journalctl -xe`
4. Verify environment variables are set correctly
5. Test MongoDB connection from server
6. Test AWS S3 access from server

---

## Notes

- Replace `yourdomain.com` with your actual domain
- Replace `your-vps-ip` with your actual VPS IP
- Keep your `.env` file secure and never commit it to git
- Regularly update system packages: `sudo apt update && sudo apt upgrade`
- Monitor server resources and upgrade VPS if needed

