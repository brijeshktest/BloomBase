# Quick Deployment Guide

## Prerequisites

1. AWS EC2 Ubuntu 22.04 instance
2. SSH access configured
3. Security Group allows ports 22, 80, 443

## One-Command Deployment

### Basic Deployment (Default Credentials)

```bash
# On your EC2 instance
cd ~/selllocalonline  # or wherever you uploaded the project
chmod +x deploy.sh
sudo ./deploy.sh
```

**Default Admin:**
- Email: `admin@selllocalonline.com`
- Password: `Bloxham1!`

### Custom Deployment (Custom Credentials)

```bash
# Set your custom values
export DOMAIN_NAME=yourdomain.com
export ADMIN_EMAIL=your-admin@email.com
export ADMIN_PASSWORD=YourSecurePassword123!
export ADMIN_PHONE=+911234567890
export JWT_SECRET=$(openssl rand -base64 32)

# Run deployment
sudo -E ./deploy.sh
```

## Upload Project to EC2

From your local machine:

```bash
# Windows (PowerShell)
scp -i your-key.pem -r "C:\Bloom Base" ubuntu@your-ec2-ip:~/selllocalonline

# Mac/Linux
scp -i your-key.pem -r /path/to/Bloom\ Base ubuntu@your-ec2-ip:~/selllocalonline
```

## Post-Deployment

1. **Access your application:**
   - Visit: `http://your-ec2-ip` or `http://yourdomain.com`
   - Login with admin credentials

2. **Check status:**
   ```bash
   pm2 list
   sudo systemctl status nginx
   ```

3. **View logs:**
   ```bash
   pm2 logs
   ```

## Troubleshooting

**Can't access the site?**
- Check security group: ports 80 and 443 open
- Check firewall: `sudo ufw status`
- Check services: `pm2 list` and `sudo systemctl status nginx`

**Database errors?**
- Check MongoDB: `sudo systemctl status mongod`
- Restart: `sudo systemctl restart mongod`

**Need to restart?**
```bash
pm2 restart all
sudo systemctl restart nginx
```

## Full Documentation

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.
