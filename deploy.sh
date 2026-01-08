#!/bin/bash

################################################################################
# SellLocal Online AWS EC2 Deployment Script
# This script deploys the entire SellLocal Online application on an AWS EC2 instance
# It installs dependencies, sets up MongoDB, configures nginx, and starts services
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - Update these values
DOMAIN_NAME="${DOMAIN_NAME:-your-domain.com}"  # Set your domain or use EC2 public IP
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@selllocalonline.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Bloxham1!}"
ADMIN_PHONE="${ADMIN_PHONE:-+917838055426}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32 || echo 'change-this-secret-key-in-production')}"
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/selllocalonline}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

PROJECT_DIR="/opt/selllocalonline"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SellLocal Online Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Get EC2 public IP if domain not set
if [ "$DOMAIN_NAME" = "your-domain.com" ]; then
    PUBLIC_IP=$(curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
    if [ -z "$PUBLIC_IP" ]; then
        print_warning "Could not detect EC2 public IP. Please set DOMAIN_NAME environment variable."
        print_warning "Using 'localhost' as fallback. Update FRONTEND_URL in .env files after deployment."
        DOMAIN_NAME="localhost"
    else
        DOMAIN_NAME="$PUBLIC_IP"
        print_status "Using EC2 public IP: $PUBLIC_IP"
    fi
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

################################################################################
# Step 1: Update system packages
################################################################################
print_status "Updating system packages..."
apt-get update -y
apt-get upgrade -y

################################################################################
# Step 2: Install Node.js 20.x
################################################################################
print_status "Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    NODE_VERSION=$(node -v)
    print_status "Node.js already installed: $NODE_VERSION"
fi

# Verify installation
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_status "Node.js version: $NODE_VERSION"
print_status "npm version: $NPM_VERSION"

################################################################################
# Step 3: Install MongoDB
################################################################################
print_status "Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    # Import MongoDB public GPG key
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    
    # Create list file for MongoDB
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    # Update and install
    apt-get update -y
    apt-get install -y mongodb-org
    
    # Start and enable MongoDB
    systemctl daemon-reload
    systemctl start mongod
    systemctl enable mongod
    
    print_status "MongoDB installed and started"
else
    print_status "MongoDB already installed"
    systemctl start mongod 2>/dev/null || true
fi

# Verify MongoDB is running
if systemctl is-active --quiet mongod; then
    print_status "MongoDB is running"
else
    print_error "MongoDB failed to start"
    exit 1
fi

################################################################################
# Step 4: Install PM2 for process management
################################################################################
print_status "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
else
    print_status "PM2 already installed"
fi

################################################################################
# Step 5: Install Nginx
################################################################################
print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    print_status "Nginx already installed"
fi

################################################################################
# Step 6: Create project directory and setup
################################################################################
print_status "Setting up project directory..."
mkdir -p $PROJECT_DIR
mkdir -p $BACKEND_DIR
mkdir -p $FRONTEND_DIR
mkdir -p $BACKEND_DIR/uploads

# If code is in current directory, copy it
if [ -d "backend" ] && [ -d "frontend" ]; then
    print_status "Copying project files..."
    cp -r backend/* $BACKEND_DIR/
    cp -r frontend/* $FRONTEND_DIR/
else
    print_warning "Project files not found in current directory"
    print_warning "Please ensure backend/ and frontend/ directories exist"
    print_warning "Or upload your code to $PROJECT_DIR"
fi

################################################################################
# Step 7: Create backend .env file
################################################################################
print_status "Creating backend environment file..."
cat > $BACKEND_DIR/.env << EOF
# Server Configuration
PORT=$BACKEND_PORT
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=$MONGODB_URI

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://$DOMAIN_NAME

# Admin Configuration
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_PHONE=$ADMIN_PHONE
EOF

################################################################################
# Step 8: Install backend dependencies
################################################################################
print_status "Installing backend dependencies..."
cd $BACKEND_DIR
npm install --production

################################################################################
# Step 9: Create frontend .env file
################################################################################
print_status "Creating frontend environment file..."
cat > $FRONTEND_DIR/.env.production << EOF
NEXT_PUBLIC_API_URL=http://$DOMAIN_NAME/api
NODE_ENV=production
EOF

################################################################################
# Step 10: Install frontend dependencies and build
################################################################################
print_status "Installing frontend dependencies..."
cd $FRONTEND_DIR
npm install

print_status "Building frontend..."
npm run build

################################################################################
# Step 11: Update seed.js with provided credentials
################################################################################
print_status "Updating seed script with admin credentials..."
# Create a temporary seed script with environment variables
cat > $BACKEND_DIR/seed.js.tmp << 'SEEDEOF'
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selllocalonline');
    console.log('Connected to MongoDB');

    const desiredEmail = process.env.ADMIN_EMAIL || 'admin@selllocalonline.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Bloxham1!';
    const adminPhone = process.env.ADMIN_PHONE || '+917838055426';

    const existingAdmin =
      (await User.findOne({ email: desiredEmail })) ||
      (await User.findOne({ email: 'admin@selllocalonline' })) ||
      (await User.findOne({ role: 'admin' }));
    
    if (existingAdmin) {
      if (existingAdmin.email !== desiredEmail) {
        existingAdmin.email = desiredEmail;
      }
      existingAdmin.password = adminPassword;
      existingAdmin.name = existingAdmin.name || 'SellLocal Online Admin';
      existingAdmin.role = 'admin';
      existingAdmin.phone = adminPhone;
      existingAdmin.isApproved = true;
      existingAdmin.isActive = true;
      existingAdmin.phoneVerified = true;

      await existingAdmin.save();

      console.log('✅ Admin user updated successfully');
      console.log(`   Email: ${desiredEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      const admin = await User.create({
        email: desiredEmail,
        password: adminPassword,
        name: 'SellLocal Online Admin',
        role: 'admin',
        phone: adminPhone,
        isApproved: true,
        isActive: true,
        phoneVerified: true
      });

      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${desiredEmail}`);
      console.log(`   Password: ${adminPassword}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
SEEDEOF

mv $BACKEND_DIR/seed.js.tmp $BACKEND_DIR/seed.js

################################################################################
# Step 12: Seed database with admin user
################################################################################
print_status "Seeding database with admin user..."
cd $BACKEND_DIR
NODE_ENV=production node seed.js || {
    print_error "Failed to seed database"
    exit 1
}

################################################################################
# Step 13: Configure PM2 for backend
################################################################################
print_status "Configuring PM2 for backend..."
cd $BACKEND_DIR
pm2 delete selllocalonline-backend 2>/dev/null || true
pm2 start server.js --name selllocalonline-backend --env production
pm2 save

################################################################################
# Step 14: Configure PM2 for frontend
################################################################################
print_status "Configuring PM2 for frontend..."
cd $FRONTEND_DIR
pm2 delete selllocalonline-frontend 2>/dev/null || true
pm2 start npm --name selllocalonline-frontend -- start
pm2 save

################################################################################
# Step 15: Configure Nginx reverse proxy
################################################################################
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/selllocalonline << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    client_max_body_size 50M;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static uploads
    location /uploads {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Enable site and remove default
ln -sf /etc/nginx/sites-available/selllocalonline /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx || {
    print_error "Nginx configuration test failed"
    exit 1
}

################################################################################
# Step 16: Configure firewall (UFW)
################################################################################
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS (for future SSL setup)
    ufw --force enable 2>/dev/null || true
fi

################################################################################
# Step 17: Set proper permissions
################################################################################
print_status "Setting file permissions..."
chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod -R 755 $BACKEND_DIR/uploads

################################################################################
# Deployment Complete
################################################################################
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${GREEN}Application Details:${NC}"
echo -e "  Frontend URL: http://$DOMAIN_NAME"
echo -e "  Backend API: http://$DOMAIN_NAME/api"
echo -e "  Admin Email: $ADMIN_EMAIL"
echo -e "  Admin Password: $ADMIN_PASSWORD"
echo -e "\n${YELLOW}PM2 Status:${NC}"
pm2 list

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo -e "  View logs: pm2 logs"
echo -e "  Restart backend: pm2 restart selllocalonline-backend"
echo -e "  Restart frontend: pm2 restart selllocalonline-frontend"
echo -e "  View nginx logs: tail -f /var/log/nginx/error.log"
echo -e "  View MongoDB logs: tail -f /var/log/mongodb/mongod.log"

echo -e "\n${GREEN}Deployment successful! 🚀${NC}\n"
