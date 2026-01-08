# Quick Deployment Steps - TL;DR Version

## 1. Connect to EC2

**In Cursor:**
1. Press `F1` → "Remote-SSH: Connect to Host"
2. Or use terminal: `ssh -i key.pem ubuntu@EC2_IP`

## 2. Upload Code

**From local terminal:**
```bash
scp -i key.pem -r "C:\Bloom Base" ubuntu@EC2_IP:~/selllocalonline
```

## 3. Deploy

**On EC2:**
```bash
cd ~/selllocalonline
chmod +x deploy.sh
sudo ./deploy.sh
```

## 4. Access

Visit: `http://YOUR_EC2_IP`

**Default Admin:**
- Email: `admin@selllocalonline.com`
- Password: `Bloxham1!`

---

That's it! See `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.
