# Server Deployment Guide

## Quick Setup for /var/dashboard

### 1. Upload Project Files

Upload your project files to the server at `/var/dashboard`:

```bash
# On your local machine, compress the project
tar -czf dashboard.tar.gz --exclude=node_modules --exclude=.git --exclude=dist .

# Upload to server (replace with your server details)
scp dashboard.tar.gz user@your-server:/tmp/

# On the server, extract to /var/dashboard
sudo mkdir -p /var/dashboard
sudo tar -xzf /tmp/dashboard.tar.gz -C /var/dashboard
sudo chown -R www-data:www-data /var/dashboard
sudo chmod -R 755 /var/dashboard
```

### 2. Run Deployment Script

```bash
# Make the deployment script executable
sudo chmod +x /var/dashboard/deploy.sh

# Run the deployment script
sudo /var/dashboard/deploy.sh
```

### 3. Configure Environment Variables

Edit the environment files with your actual values:

```bash
# Backend environment
sudo nano /var/dashboard/backend/.env

# Frontend environment  
sudo nano /var/dashboard/frontend/.env
```

**Required Backend Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_HjVGMveC67BO@ep-holy-scene-afwzz2d6-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

# Stack Auth
STACK_AUTH_URL=https://api.stack-auth.com
STACK_PROJECT_ID=5fb1ffdb-d2a3-4a10-8824-7cfd62ab0f06
STACK_SECRET_SERVER_KEY=ssk_ze312w133kthnbmdwfv6w1vbbsjew1ftpm5nwr9vxp1d8
STACK_AUTH_AUDIENCE=https://api.stack-auth.com/api/v1/projects/5fb1ffdb-d2a3-4a10-8824-7cfd62ab0f06

# QuickBooks
QBO_CLIENT_ID=your_quickbooks_client_id
QBO_CLIENT_SECRET=your_quickbooks_client_secret
QBO_REDIRECT_URI=https://api.wemakemarin.com/auth/quickbooks/callback
QBO_REALM_ID=your_realm_id
QBO_ENV=sandbox
QBO_WEBHOOK_URL=https://webhook.wemakemarin.com/api/webhook/quickbooks
QBO_WEBHOOK_VERIFIER_TOKEN=your_webhook_verifier_token

# Server Configuration
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://wemakemarin.com
LOG_LEVEL=info
```

**Required Frontend Environment Variables:**
```bash
VITE_API_BASE_URL=https://api.wemakemarin.com
VITE_STACK_AUTH_URL=https://api.stack-auth.com
VITE_STACK_PROJECT_ID=5fb1ffdb-d2a3-4a10-8824-7cfd62ab0f06
VITE_STACK_PUBLISHABLE_CLIENT_KEY=pck_h8mejt0bh4277fgzhc0r0ap5w2dx6a2y3bz74dngp70r0
VITE_DEV_MODE=false
VITE_MOCK_AUTH=false
```

### 4. Setup SSL Certificates

```bash
# Get SSL certificates for all domains
sudo certbot --nginx -d wemakemarin.com -d api.wemakemarin.com -d webhook.wemakemarin.com -d admin.wemakemarin.com

# Test certificate renewal
sudo certbot renew --dry-run
```

### 5. Start Services

```bash
# Use the management script
cd /var/dashboard
sudo chmod +x manage.sh
./manage.sh

# Or start services manually
sudo systemctl start marin-dashboard.service
sudo systemctl start nginx
```

### 6. Verify Deployment

```bash
# Test main site
curl https://wemakemarin.com

# Test API
curl https://api.wemakemarin.com/health

# Test webhook endpoint
curl https://webhook.wemakemarin.com/api/webhook/health

# Check service status
sudo systemctl status marin-dashboard.service
sudo systemctl status nginx
```

## Management Script Usage

The management script (`./manage.sh`) provides comprehensive server management:

### Key Features:
- **Service Management**: Start/stop/restart backend and frontend
- **Health Monitoring**: Database, API, and webhook health checks
- **DNS Testing**: Verify DNS configuration and SSL certificates
- **Remote Access**: Manage SSH, VNC, RDP, SFTP, NFS, SMB, RSYNC
- **Server Services**: Nginx, Certbot, logging, process management
- **Security**: Intrusion detection, firewall management
- **Debugging**: Comprehensive troubleshooting tools

### Common Commands:
```bash
# Start development environment
./manage.sh  # Select option 1

# Run comprehensive health check
./manage.sh  # Select option 13

# Test DNS configuration
./manage.sh  # Select option 18

# Check SSL certificates
./manage.sh  # Select option 19

# View service status
./manage.sh  # Select option 6
```

## Troubleshooting

### Common Issues:

1. **Permission Errors**
   ```bash
   sudo chown -R www-data:www-data /var/dashboard
   sudo chmod -R 755 /var/dashboard
   ```

2. **Port Already in Use**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

3. **SSL Certificate Issues**
   ```bash
   sudo certbot renew --force-renewal
   sudo systemctl reload nginx
   ```

4. **Database Connection Issues**
   - Verify DATABASE_URL in backend/.env
   - Check network connectivity to NeonDB
   - Verify SSL mode is set to 'require'

5. **QuickBooks Webhook Issues**
   - Ensure webhook.wemakemarin.com is NOT proxied (gray cloud in Cloudflare)
   - Verify QBO_WEBHOOK_URL matches your DNS configuration
   - Check webhook endpoint responds with 200 OK immediately

### Logs and Monitoring:

```bash
# View application logs
sudo journalctl -u marin-dashboard.service -f

# View nginx logs
sudo tail -f /var/log/nginx/error.log

# View PM2 logs
pm2 logs

# System resource monitoring
htop
```

## Security Considerations

1. **Firewall**: UFW is configured to allow only necessary ports
2. **SSL**: All traffic is encrypted with Let's Encrypt certificates
3. **Rate Limiting**: Nginx rate limiting prevents abuse
4. **Process Management**: PM2 ensures service reliability
5. **Logging**: Comprehensive logging for monitoring and debugging

## Backup and Recovery

```bash
# Create backup
sudo tar -czf /var/backups/dashboard-$(date +%Y%m%d).tar.gz /var/dashboard

# Restore from backup
sudo systemctl stop marin-dashboard.service
sudo tar -xzf /var/backups/dashboard-YYYYMMDD.tar.gz -C /
sudo systemctl start marin-dashboard.service
```

## Updates and Maintenance

```bash
# Update dependencies
cd /var/dashboard
./manage.sh  # Select option 22 (Update Dependencies)

# Rebuild applications
./manage.sh  # Select option 21 (Build Applications)

# Restart services
./manage.sh  # Select option 5 (Restart All Services)
```
