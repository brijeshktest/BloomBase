# AWS EC2 Deployment Guide for SellLocal Online

This guide will help you connect Cursor to your AWS EC2 instance and deploy the SellLocal Online application.

## Prerequisites

1. AWS EC2 instance running (Ubuntu 22.04 LTS recommended)
2. EC2 Key Pair (.pem file) downloaded
3. Security Group configured to allow:
   - SSH (port 22) from your IP
   - HTTP (port 80) from anywhere
   - HTTPS (port 443) from anywhere (optional)

## Step 1: Configure SSH Connection in Cursor

### Option A: Using Cursor's Remote SSH Extension

1. **Install Remote SSH Extension** (if not already installed):
   - Open Cursor
   - Go to Extensions (Ctrl+Shift+X or Cmd+Shift+X)
   - Search for "Remote - SSH"
   - Install it

2. **Configure SSH Connection**:
   - Press `F1` or `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
   - Type "Remote-SSH: Connect to Host"
   - Select "Configure SSH Hosts"
   - Choose your SSH config file (usually `~/.ssh/config`)

3. **Add EC2 Instance to Config**:
   Add this configuration to your SSH config file:

   ```
   Host selllocalonline-ec2
       HostName YOUR_EC2_PUBLIC_IP
       User ubuntu
       IdentityFile /path/to/your/key.pem
       StrictHostKeyChecking no
   ```

   Replace:
   - `YOUR_EC2_PUBLIC_IP` with your EC2 instance's public IP
   - `/path/to/your/key.pem` with the full path to your .pem file

4. **Set Correct Permissions** (Important on Linux/Mac):
   ```bash
   chmod 400 /path/to/your/key.pem
   ```

5. **Connect**:
   - Press `F1` → "Remote-SSH: Connect to Host"
   - Select "selllocalonline-ec2"
   - Cursor will connect to your EC2 instance

### Option B: Using Terminal in Cursor

1. Open integrated terminal in Cursor (Ctrl+` or View → Terminal)
2. SSH directly to your EC2 instance:
   ```bash
   ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```

## Step 2: Upload Project Files to EC2

### Option A: Using SCP from Your Local Machine

Open a **local terminal** (not SSH'd into EC2) and run:

**Windows (PowerShell):**
```powershell
# Navigate to project root
cd "C:\Bloom Base"

# Upload entire project
scp -i "C:\path\to\your-key.pem" -r "C:\Bloom Base" ubuntu@YOUR_EC2_IP:~/selllocalonline
```

**Mac/Linux:**
```bash
# Navigate to project root
cd /path/to/Bloom\ Base

# Upload entire project
scp -i ~/path/to/your-key.pem -r "Bloom Base" ubuntu@YOUR_EC2_IP:~/selllocalonline
```

### Option B: Using Git (Recommended)

If your code is in a Git repository:

1. **On EC2** (via SSH):
   ```bash
   cd ~
   git clone YOUR_REPO_URL selllocalonline
   cd selllocalonline
   ```

2. **Or push to GitHub and clone**:
   ```bash
   cd ~
   git clone https://github.com/yourusername/selllocalonline.git
   cd selllocalonline
   ```

### Option C: Using VS Code/Cursor Remote

If you connected via Remote SSH:
1. Open the folder directly on the remote server
2. Files will sync automatically

## Step 3: Run the Deployment Script

Once files are uploaded to EC2:

1. **SSH into your EC2 instance** (if not already connected)

2. **Navigate to project directory**:
   ```bash
   cd ~/selllocalonline
   ```

3. **Make deployment script executable**:
   ```bash
   chmod +x deploy.sh
   ```

4. **Run the deployment script**:

   **Basic deployment (default credentials):**
   ```bash
   sudo ./deploy.sh
   ```

   **Custom deployment with environment variables:**
   ```bash
   export DOMAIN_NAME=yourdomain.com
   export ADMIN_EMAIL=admin@yourdomain.com
   export ADMIN_PASSWORD=YourSecurePassword123!
   export ADMIN_PHONE=+911234567890
   export JWT_SECRET=$(openssl rand -base64 32)
   
   sudo -E ./deploy.sh
   ```

5. **Wait for deployment to complete** (5-10 minutes)
   - Script will install Node.js, MongoDB, PM2, Nginx
   - Set up environment files
   - Build frontend
   - Seed database
   - Start services

## Step 4: Verify Deployment

1. **Check if services are running**:
   ```bash
   pm2 list
   sudo systemctl status nginx
   sudo systemctl status mongod
   ```

2. **Test the application**:
   - Visit `http://YOUR_EC2_IP` in your browser
   - You should see the SellLocal Online landing page

3. **Check logs if needed**:
   ```bash
   pm2 logs selllocalonline-backend
   pm2 logs selllocalonline-frontend
   ```

## Step 5: Configure Domain Name (Optional)

1. **Point your domain to EC2**:
   - Add an A record in your DNS settings
   - Point to your EC2 public IP

2. **Update environment variables**:
   ```bash
   sudo nano /opt/selllocalonline/backend/.env
   # Update FRONTEND_URL to your domain
   
   sudo nano /opt/selllocalonline/frontend/.env.production
   # Update NEXT_PUBLIC_API_URL to your domain
   ```

3. **Update Nginx configuration**:
   ```bash
   sudo nano /etc/nginx/sites-available/selllocalonline
   # Update server_name to your domain
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Restart services**:
   ```bash
   pm2 restart all
   ```

## Step 6: Set Up SSL (HTTPS) - Recommended

1. **Install Certbot**:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Get SSL Certificate**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Auto-renewal is set up automatically**

## Troubleshooting

### Cannot Connect via SSH

**Issue**: Connection timeout or permission denied

**Solutions**:
- Check Security Group allows SSH from your IP
- Verify .pem file permissions: `chmod 400 key.pem`
- Check EC2 instance is running
- Verify correct username (ubuntu for Ubuntu AMI)

### Deployment Script Fails

**Issue**: Script stops with errors

**Solutions**:
- Check logs in terminal output
- Ensure you're running with `sudo`
- Verify internet connection on EC2
- Check disk space: `df -h`

### Application Not Accessible

**Issue**: Cannot access site at http://EC2_IP

**Solutions**:
- Check Security Group allows HTTP (port 80)
- Verify Nginx is running: `sudo systemctl status nginx`
- Check PM2 processes: `pm2 list`
- View Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Port Already in Use

**Issue**: Port 3000 or 5000 already in use

**Solutions**:
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 PID
```

### MongoDB Connection Issues

**Issue**: Database connection errors

**Solutions**:
- Check MongoDB status: `sudo systemctl status mongod`
- Restart MongoDB: `sudo systemctl restart mongod`
- Check logs: `sudo tail -f /var/log/mongodb/mongod.log`

## Quick Commands Reference

```bash
# View application logs
pm2 logs

# Restart services
pm2 restart all
sudo systemctl restart nginx

# Update application (after code changes)
cd /opt/selllocalonline/backend
sudo npm install --production

cd /opt/selllocalonline/frontend
sudo npm install
sudo npm run build
pm2 restart all

# Check service status
pm2 status
sudo systemctl status nginx
sudo systemctl status mongod

# View recent logs
pm2 logs --lines 100
sudo tail -f /var/log/nginx/access.log
```

## Post-Deployment Checklist

- [ ] Application accessible at http://EC2_IP
- [ ] Admin can login with credentials
- [ ] Seller registration works
- [ ] Products can be added
- [ ] Store microsite accessible
- [ ] WhatsApp checkout works
- [ ] SSL certificate installed (if using domain)
- [ ] Domain points to EC2 (if applicable)
- [ ] Sitemap submitted to Google Search Console
- [ ] Monitoring set up (optional)

## Next Steps

1. **Set up monitoring** (optional):
   - PM2 monitoring: `pm2 monit`
   - Set up CloudWatch or similar

2. **Configure backups**:
   - MongoDB backups
   - Upload folder backups

3. **Optimize performance**:
   - Enable CloudFront CDN (optional)
   - Set up load balancer (for high traffic)

---

**Need Help?** Check the deployment script output for specific error messages, or review the application logs using the commands above.
