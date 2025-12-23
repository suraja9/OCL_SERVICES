#!/bin/bash

# Script to create .env.example files if they don't exist
# Run this on your local machine or VPS

echo "Creating .env.example files..."

# Backend .env.example
if [ ! -f "backend/.env.example" ]; then
    cat > backend/.env.example << 'EOF'
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

# MSG91 Authentication Key (for SMS and WhatsApp)
MSG91_AUTH_KEY=your_msg91_auth_key_here

# MSG91 WhatsApp Configuration (optional - defaults provided)
MSG91_WHATSAPP_NUMBER=917896375599
MSG91_WHATSAPP_NAMESPACE=c4c9ddbe_1791_4518_9b6c_d0dd2b5a628f

# AWS S3 Configuration
AWS_ACCESS_KEY=your_aws_access_key_here
AWS_SECRET_KEY=your_aws_secret_key_here
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=ocl-services-uploads

# Google Sheets Configuration (optional)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# JWT Secret (for authentication tokens)
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters_long
EOF
    echo "✅ Created backend/.env.example"
else
    echo "⚠️  backend/.env.example already exists"
fi

# Frontend .env.example
if [ ! -f "Frontend/.env.example" ]; then
    cat > Frontend/.env.example << 'EOF'
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Backend API URL
# For production, use your domain or API subdomain
VITE_API_URL=https://www.oclservices.com/api
# OR if using separate API subdomain:
# VITE_API_URL=https://api.oclservices.com/api
EOF
    echo "✅ Created Frontend/.env.example"
else
    echo "⚠️  Frontend/.env.example already exists"
fi

echo "Done!"

