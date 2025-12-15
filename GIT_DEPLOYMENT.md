# 🔄 Git Deployment Workflow

Since your VPS is already set up, you can simply push changes and pull on the VPS.

## 📤 Step 1: Commit & Push to Git

On your local machine:

```bash
# Add all new deployment files
git add .

# Or add specific files:
git add ecosystem.config.js
git add deploy.sh
git add backend/.gitignore
git add nginx/
git add scripts/
git add *.md

# Commit
git commit -m "Add VPS deployment configuration and scripts"

# Push to your repository
git push origin main
```

## 📥 Step 2: Pull on VPS

On your VPS:

```bash
# Navigate to project directory
cd /var/www/OCL_MAIN

# Pull latest changes
git pull origin main

# Run deployment script
sudo ./deploy.sh
```

That's it! 🎉

## 🔄 Future Updates

For future updates, just repeat:

**Local:**
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

**VPS:**
```bash
cd /var/www/OCL_MAIN
git pull origin main
sudo ./deploy.sh
```

## ⚠️ Important Notes

1. **Environment Files**: Your `.env` files on VPS won't be overwritten (they're in .gitignore)
2. **First Time**: Make sure you've already created `.env` files on VPS before pulling
3. **Nginx Configs**: If you update Nginx configs, you'll need to:
   ```bash
   sudo cp nginx/ocl-backend.conf /etc/nginx/sites-available/ocl-backend
   sudo cp nginx/ocl-frontend.conf /etc/nginx/sites-available/ocl-frontend
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 🚀 Quick One-Liner (VPS)

You can also create an alias for easier updates:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias ocl-update='cd /var/www/OCL_MAIN && git pull origin main && sudo ./deploy.sh'

# Then just run:
ocl-update
```

