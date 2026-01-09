# AWS EC2 Deployment Guide for SellLocal Online

Complete guide to deploy SellLocal Online on AWS EC2 with all dependencies and features.

## Prerequisites

1. **AWS EC2 Instance**
   - Ubuntu 22.04 LTS (recommended)
   - Minimum: t2.medium (2 vCPU, 4GB RAM)
   - Recommended: t3.medium or larger
   - Storage: 20GB+ SSD

2. **Security Group Configuration**
   - SSH (port 22) - from your IP
   - HTTP (port 80) - from anywhere (0.0.0.0/0)
   - HTTPS (port 443) - from anywhere (0.0.0.0/0)

3. **EC2 Key Pair**
   - Download your `.pem` key file
   - Set correct permissions: `chmod 400 your-key.pem`

## Quick Start

### 1. Upload Project to EC2

**From your local machine (Windows PowerShell):**
```powershell
# Navigate to project directory
cd "C:\Bloom Base"

# Upload entire project
scp -i "C:\path\to\your-key.pem" -r "C:\Bloom Base" ubuntu@YOUR_EC2_IP:~/selllocalonline
```

**From Mac/Linux:**
```bash
scp -i ~/path/to/your-key.pem -r "Bloom Base" ubuntu@YOUR_EC2_IP:~/selllocalonline
```

### 2. Connect to EC2 Instance

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### 3. Run Deployment Script

**Basic deployment (default credentials):**
```bash
cd ~/selllocalonline
chmod +x deploy.sh
sudo ./deploy.sh
```

**Custom deployment with environment variables:**
```bash
export DOMAIN_NAME=yourdomain.com
export ADMIN_EMAIL=admin@yourdomain.com
export ADMIN_PASSWORD=YourSecurePassword123!
export ADMIN_PHONE=+911234567890
export JWT_SECRET=$(openssl rand -base64 32)
export MONGODB_URI=mongodb://localhost:27017/selllocalonline

sudo -E ./deploy.sh
```

## What the Script Does

The deployment script automatically:

1. ✅ Updates system packages
2. ✅ Installs Node.js 20.x
3. ✅ Installs MongoDB 7.0
4. ✅ Installs PM2 (process manager)
5. ✅ Installs Nginx (reverse proxy)
6. ✅ Installs Sharp dependencies (libvips-dev, build tools)
7. ✅ Creates project directory structure
8. ✅ Sets up environment files (.env)
9. ✅ Installs all backend dependencies (including Sharp)
10. ✅ Installs all frontend dependencies
11. ✅ Builds Next.js frontend
12. ✅ Runs database migrations
13. ✅ Seeds admin user
14. ✅ Configures PM2 for backend and frontend
15. ✅ Configures Nginx reverse proxy
16. ✅ Sets up firewall rules
17. ✅ Sets proper file permissions

## Features Included

The deployment includes all latest features:

- ✅ **Image SEO (Lens Optimizer)** - Sharp library for image compression
- ✅ **Hyperlocal SEO** - Location-based SEO optimization
- ✅ **WhatsApp Broadcast** - Customer communication system
- ✅ **Google Merchant Feed** - Automatic product feed generation
- ✅ **Trial Expiry Notifications** - Admin contact integration
- ✅ **Area Specialist Schema** - Enhanced local business markup
- ✅ **Video Upload Support** - Seller intro videos
- ✅ **Bulk Upload** - Excel-based product import
- ✅ **Analytics Tracking** - Visitor and lead tracking

## Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/selllocalonline
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://yourdomain.com
ADMIN_EMAIL=admin@selllocalonline.com
ADMIN_PASSWORD=Bloxham1!
ADMIN_PHONE=+917838055426
ADMIN_WHATSAPP=+917838055426
```

### Frontend (.env.production)

```env
NEXT_PUBLIC_API_URL=http://yourdomain.com/api
NODE_ENV=production
```

## Post-Deployment

### Verify Services

```bash
# Check PM2 processes
pm2 list

# Check Nginx
sudo systemctl status nginx

# Check MongoDB
sudo systemctl status mongod
```

### Access Application

- **Frontend:** http://YOUR_EC2_IP or http://yourdomain.com
- **Backend API:** http://YOUR_EC2_IP/api
- **Admin Login:** Use credentials from deployment

### View Logs

```bash
# Application logs
pm2 logs

# Backend logs only
pm2 logs selllocalonline-backend

# Frontend logs only
pm2 logs selllocalonline-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## SSL/HTTPS Setup (Recommended)

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

After SSL setup, update environment variables:
```bash
sudo nano /opt/selllocalonline/backend/.env
# Change FRONTEND_URL to https://yourdomain.com

sudo nano /opt/selllocalonline/frontend/.env.production
# Change NEXT_PUBLIC_API_URL to https://yourdomain.com/api

# Restart services
pm2 restart all
```

## Updating the Application

### 1. Upload New Code

```bash
# From local machine
scp -i your-key.pem -r "C:\Bloom Base" ubuntu@YOUR_EC2_IP:~/selllocalonline
```

### 2. On EC2 Instance

```bash
cd ~/selllocalonline

# Copy to production directory
sudo cp -r backend/* /opt/selllocalonline/backend/
sudo cp -r frontend/* /opt/selllocalonline/frontend/

# Update backend dependencies
cd /opt/selllocalonline/backend
sudo npm install --production
npm rebuild sharp  # Rebuild Sharp if needed

# Update frontend dependencies and rebuild
cd /opt/selllocalonline/frontend
sudo npm install
sudo npm run build

# Run migrations if needed
cd /opt/selllocalonline/backend
sudo npm run migrate

# Restart services
pm2 restart all
```

## Troubleshooting

### Application Not Accessible

1. **Check Security Group:**
   - Ensure ports 80 and 443 are open
   - Check EC2 Security Group settings in AWS Console

2. **Check Firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **Check Services:**
   ```bash
   pm2 list
   sudo systemctl status nginx
   ```

### Sharp/Image Processing Issues

If image uploads fail:

```bash
cd /opt/selllocalonline/backend
npm rebuild sharp

# Or reinstall Sharp
npm uninstall sharp
npm install sharp
npm rebuild sharp
```

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 PID
```

### Out of Memory

If you encounter memory issues:

```bash
# Check memory usage
free -h

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Backup and Restore

### Backup MongoDB

```bash
# Create backup
mongodump --out=/backup/$(date +%Y%m%d)

# Restore from backup
mongorestore /backup/20240101
```

### Backup Uploads

```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /opt/selllocalonline/backend/uploads

# Restore uploads
tar -xzf uploads-backup-20240101.tar.gz -C /
```

## Security Recommendations

1. ✅ **Change default admin password** after first login
2. ✅ **Set up SSL/HTTPS** using Let's Encrypt
3. ✅ **Configure MongoDB authentication** for production
4. ✅ **Set up regular backups** (automated via cron)
5. ✅ **Keep system updated:**
   ```bash
   sudo apt-get update && sudo apt-get upgrade
   ```
6. ✅ **Use strong JWT_SECRET** (auto-generated by script)
7. ✅ **Restrict MongoDB to localhost** (default)

## Monitoring

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process list
pm2 list

# Detailed info
pm2 describe selllocalonline-backend
pm2 describe selllocalonline-frontend
```

### System Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Network
netstat -tulpn
```

## Default Credentials

After deployment:

- **Email:** admin@selllocalonline.com (or your custom ADMIN_EMAIL)
- **Password:** Bloxham1! (or your custom ADMIN_PASSWORD)

⚠️ **Important:** Change the admin password immediately after first login!

## Support

For issues:
1. Check application logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`
4. Verify services are running: `pm2 list && sudo systemctl status nginx mongod`

---

**Deployment Location:** `/opt/selllocalonline`
**Backend:** `/opt/selllocalonline/backend`
**Frontend:** `/opt/selllocalonline/frontend`
**Uploads:** `/opt/selllocalonline/backend/uploads`
