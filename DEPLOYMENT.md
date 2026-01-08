# SellLocal Online AWS EC2 Deployment Guide

This guide will help you deploy the SellLocal Online application on an AWS EC2 instance.

## Prerequisites

1. An AWS EC2 instance running Ubuntu 22.04 LTS (or similar)
2. SSH access to the EC2 instance
3. Security Group configured to allow:
   - SSH (port 22)
   - HTTP (port 80)
   - HTTPS (port 443) - optional for SSL

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Connect to your EC2 instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Upload the project files to the server:**
   ```bash
   # From your local machine
   scp -i your-key.pem -r "C:\Bloom Base" ubuntu@your-ec2-ip:~/selllocalonline
   ```

3. **Run the deployment script:**
   ```bash
   # On the EC2 instance
   cd ~/selllocalonline
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

4. **Configure environment variables (optional):**
   ```bash
   export DOMAIN_NAME=your-domain.com
   export ADMIN_EMAIL=admin@selllocalonline.com
   export ADMIN_PASSWORD=Bloxham1!
   export ADMIN_PHONE=+917838055426
   export JWT_SECRET=$(openssl rand -base64 32)
   
   sudo -E ./deploy.sh
   ```

### Option 2: Manual Deployment

If you prefer to deploy manually, follow these steps:

1. **Update system packages:**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

2. **Install Node.js 20.x:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install MongoDB:**
   ```bash
   curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

4. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   pm2 startup systemd -u $USER --hp $HOME
   ```

5. **Install Nginx:**
   ```bash
   sudo apt-get install -y nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

6. **Setup project:**
   ```bash
   sudo mkdir -p /opt/selllocalonline
   sudo cp -r ~/selllocalonline/backend /opt/selllocalonline/
   sudo cp -r ~/selllocalonline/frontend /opt/selllocalonline/
   sudo mkdir -p /opt/selllocalonline/backend/uploads
   ```

7. **Create backend .env file:**
   ```bash
   sudo nano /opt/selllocalonline/backend/.env
   ```
   
   Add the following:
   ```env
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb://localhost:27017/selllocalonline
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://your-domain-or-ip
   ADMIN_PHONE=+917838055426
   ```

8. **Create frontend .env.production file:**
   ```bash
   sudo nano /opt/selllocalonline/frontend/.env.production
   ```
   
   Add the following:
   ```env
   NEXT_PUBLIC_API_URL=http://your-domain-or-ip/api
   NODE_ENV=production
   ```

9. **Install dependencies and build:**
   ```bash
   cd /opt/selllocalonline/backend
   sudo npm install --production
   
   cd /opt/selllocalonline/frontend
   sudo npm install
   sudo npm run build
   ```

10. **Seed database:**
    ```bash
    cd /opt/selllocalonline/backend
    sudo node seed.js
    ```

11. **Start with PM2:**
    ```bash
    cd /opt/selllocalonline/backend
    sudo pm2 start server.js --name selllocalonline-backend
    
    cd /opt/selllocalonline/frontend
    sudo pm2 start npm --name selllocalonline-frontend -- start
    
    sudo pm2 save
    ```

12. **Configure Nginx:**
    Create `/etc/nginx/sites-available/selllocalonline` with the configuration from the deploy script, then:
    ```bash
    sudo ln -s /etc/nginx/sites-available/selllocalonline /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
    ```

## Configuration

### Environment Variables

The deployment script uses these default values but can be overridden:

- `DOMAIN_NAME`: Your domain name or EC2 public IP (default: EC2 public IP)
- `ADMIN_EMAIL`: Admin email (default: admin@selllocalonline.com)
- `ADMIN_PASSWORD`: Admin password (default: Bloxham1!)
- `ADMIN_PHONE`: Admin phone (default: +917838055426)
- `JWT_SECRET`: JWT secret key (auto-generated if not provided)
- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017/selllocalonline)

### Custom Domain Setup

If you have a custom domain:

1. Point your domain's A record to your EC2 instance's public IP
2. Update `DOMAIN_NAME` in the deployment script or environment
3. For SSL (recommended), use Let's Encrypt:

   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Post-Deployment

### Check Status

```bash
# PM2 processes
pm2 list
pm2 logs

# Nginx status
sudo systemctl status nginx

# MongoDB status
sudo systemctl status mongod
```

### View Logs

```bash
# Application logs
pm2 logs selllocalonline-backend
pm2 logs selllocalonline-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Restart Services

```bash
# Restart backend
pm2 restart selllocalonline-backend

# Restart frontend
pm2 restart selllocalonline-frontend

# Restart Nginx
sudo systemctl restart nginx

# Restart MongoDB
sudo systemctl restart mongod
```

### Update Application

To update the application:

1. **Pull latest code or upload new files**
2. **Update dependencies:**
   ```bash
   cd /opt/selllocalonline/backend
   sudo npm install --production
   
   cd /opt/selllocalonline/frontend
   sudo npm install
   sudo npm run build
   ```

3. **Restart services:**
   ```bash
   pm2 restart selllocalonline-backend
   pm2 restart selllocalonline-frontend
   ```

## Troubleshooting

### Application not accessible

1. Check if services are running:
   ```bash
   pm2 list
   sudo systemctl status nginx
   ```

2. Check firewall:
   ```bash
   sudo ufw status
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. Check EC2 Security Group settings

### Database connection issues

1. Verify MongoDB is running:
   ```bash
   sudo systemctl status mongod
   ```

2. Check MongoDB logs:
   ```bash
   sudo tail -f /var/log/mongodb/mongod.log
   ```

### Port already in use

If ports 3000 or 5000 are already in use:

1. Find the process:
   ```bash
   sudo lsof -i :3000
   sudo lsof -i :5000
   ```

2. Kill the process or change ports in `.env` files

## Security Recommendations

1. **Set up SSL/HTTPS** using Let's Encrypt (see Custom Domain Setup)
2. **Change default admin password** after first login
3. **Keep system updated:**
   ```bash
   sudo apt-get update && sudo apt-get upgrade
   ```
4. **Configure MongoDB authentication** for production
5. **Set up regular backups** for MongoDB database
6. **Use strong JWT_SECRET** (auto-generated by deploy script)
7. **Restrict MongoDB to localhost** (default configuration)

## Backup and Restore

### Backup MongoDB

```bash
mongodump --out=/backup/$(date +%Y%m%d)
```

### Restore MongoDB

```bash
mongorestore /backup/20240101
```

### Backup Uploads

```bash
tar -czf uploads-backup.tar.gz /opt/selllocalonline/backend/uploads
```

## Support

For issues or questions, check the application logs first using the commands above.

---

**Default Admin Credentials:**
- Email: admin@selllocalonline.com
- Password: Bloxham1!

**⚠️ Important:** Change the admin password after first login!
