# DNS Configuration Guide

## Current DNS Setup

Your domain `wemakemarin.com` is configured with Cloudflare with the following records:

### Existing Records ✅
```
wemakemarin.com.             1    IN    A    23.128.116.9    ; cf_tags=cf-proxied:true
www.wemakemarin.com.         1    IN    CNAME wemakemarin.com. ; cf_tags=cf-proxied:true
api.wemakemarin.com.         1    IN    A    23.128.116.9    ; cf_tags=cf-proxied:true
admin.wemakemarin.com.       1    IN    A    23.128.116.9    ; cf_tags=cf-proxied:true
```

## Recommended Additional Records

### For Production Dashboard
```
dashboard.wemakemarin.com.   1    IN    A    23.128.116.9    ; cf_tags=cf-proxied:true
app.wemakemarin.com.         1    IN    A    23.128.116.9    ; cf_tags=cf-proxied:true
```

### For Webhooks (Critical for QuickBooks)
```
webhook.wemakemarin.com.     1    IN    A    23.128.116.9    ; cf_tags=cf-proxied:false
```

**Important**: The webhook subdomain should have `cf-proxied:false` (gray cloud) to ensure:
- Direct connection to your server
- No Cloudflare request processing delays
- Reliable webhook delivery from QuickBooks

### For Development/Staging (Optional)
```
dev.wemakemarin.com.         1    IN    A    23.128.116.9    ; cf_tags=cf-proxied:false
staging.wemakemarin.com.     1    IN    A    23.128.116.9    ; cf_tags=cf-proxied:false
```

## Cloudflare Configuration

### SSL/TLS Settings
1. Go to Cloudflare Dashboard → SSL/TLS → Overview
2. Set encryption mode to **"Full (strict)"**
3. Enable **"Always Use HTTPS"**
4. Enable **"HTTP Strict Transport Security (HSTS)"**

### Security Settings
1. Go to Security → Settings
2. Set Security Level to **"Medium"** or **"High"**
3. Enable **"Bot Fight Mode"**
4. Configure **"Rate Limiting"** for API endpoints

### Performance Settings
1. Go to Speed → Optimization
2. Enable **"Auto Minify"** for HTML, CSS, JS
3. Enable **"Brotli"** compression
4. Enable **"Rocket Loader"** (optional)

## Nginx Configuration

Based on your DNS setup, your Nginx configuration should handle:

### Main Application
- `wemakemarin.com` → Frontend (React app)
- `www.wemakemarin.com` → Redirect to `wemakemarin.com`

### API Endpoints
- `api.wemakemarin.com` → Backend API (Express.js)
- `webhook.wemakemarin.com` → Webhook endpoints

### Admin Interface
- `admin.wemakemarin.com` → Admin panel (if separate)

## Environment Variables

Update your backend `.env` file with:

```bash
# API Configuration
API_BASE_URL=https://api.wemakemarin.com
CORS_ORIGIN=https://wemakemarin.com

# Webhook Configuration
QBO_WEBHOOK_URL=https://webhook.wemakemarin.com/api/webhook/quickbooks

# Frontend Configuration
VITE_API_BASE_URL=https://api.wemakemarin.com
```

## QuickBooks Integration URLs

When setting up QuickBooks Online integration, use:

- **Application Launch URL**: `https://wemakemarin.com`
- **Redirect URL**: `https://api.wemakemarin.com/auth/quickbooks/callback`
- **Webhook URL**: `https://webhook.wemakemarin.com/api/webhook/quickbooks`
- **Application Disconnect URL**: `https://wemakemarin.com/disconnect`

## Testing DNS Configuration

Use the management script to test your DNS setup:

```bash
./manage.sh
# Select option 13 (Comprehensive Health Check)
# This will test all endpoints and connectivity
```

## Troubleshooting

### Common Issues

1. **Webhook Delivery Failures**
   - Ensure `webhook.wemakemarin.com` is NOT proxied (gray cloud)
   - Check that port 443 is open on your server
   - Verify SSL certificate is valid

2. **CORS Errors**
   - Ensure `CORS_ORIGIN` matches your frontend domain
   - Check that API subdomain is properly configured

3. **SSL Certificate Issues**
   - Use Let's Encrypt with Certbot
   - Ensure Cloudflare SSL mode is "Full (strict)"

### DNS Propagation Check

```bash
# Check DNS propagation
dig wemakemarin.com
dig api.wemakemarin.com
dig webhook.wemakemarin.com

# Test connectivity
curl -I https://wemakemarin.com
curl -I https://api.wemakemarin.com/health
curl -I https://webhook.wemakemarin.com/api/webhook/health
```

## Security Considerations

1. **Rate Limiting**: Configure Cloudflare rate limiting for API endpoints
2. **DDoS Protection**: Cloudflare provides automatic DDoS protection
3. **WAF Rules**: Set up Web Application Firewall rules for additional security
4. **IP Whitelisting**: Consider whitelisting your office IP for admin access

## Monitoring

Set up monitoring for:
- DNS resolution times
- SSL certificate expiration
- API endpoint availability
- Webhook delivery success rates
