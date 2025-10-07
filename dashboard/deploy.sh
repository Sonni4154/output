#!/bin/bash

# Marin Pest Control Dashboard - Deployment Script
# Deploys the project to /var/dashboard on the server

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/opt/dashboard"
BACKUP_DIR="/opt/backups/dashboard"
LOGS_DIR="/opt/log/dashboard"

# Function to log actions
log_action() {
    local action="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp]${NC} $action"
    echo "[$timestamp] $action" >> "$LOGS_DIR/deploy.log" 2>/dev/null || true
}

# Function to handle errors gracefully
handle_error() {
    local exit_code=$?
    local line_number=$1
    echo -e "${RED}Error occurred on line $line_number with exit code $exit_code${NC}"
    echo -e "${YELLOW}Would you like to continue? (y/n):${NC}"
    read -r continue_choice
    if [[ $continue_choice != "y" && $continue_choice != "Y" ]]; then
        exit $exit_code
    fi
}

# Set up error handling
trap 'handle_error $LINENO' ERR

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}This script must be run as root for deployment${NC}"
        echo -e "${YELLOW}Please run: sudo $0${NC}"
        exit 1
    fi
}

# Function to create necessary directories
create_directories() {
    log_action "Creating deployment directories"
    
    # Create main deployment directory
    mkdir -p "$DEPLOY_DIR"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Create logs directory
    mkdir -p "$LOGS_DIR"
    
    # Create nginx directory
    mkdir -p "/etc/nginx/sites-available"
    mkdir -p "/etc/nginx/sites-enabled"
    
    # Create systemd service directory
    mkdir -p "/etc/systemd/system"
    
    echo -e "${GREEN}✓ Directories created successfully${NC}"
}

# Function to backup existing deployment
backup_existing() {
    if [[ -d "$DEPLOY_DIR" && "$(ls -A "$DEPLOY_DIR" 2>/dev/null)" ]]; then
        log_action "Backing up existing deployment"
        
        local backup_name="dashboard-backup-$(date +%Y%m%d-%H%M%S)"
        local backup_path="$BACKUP_DIR/$backup_name"
        
        cp -r "$DEPLOY_DIR" "$backup_path"
        echo -e "${GREEN}✓ Backup created at $backup_path${NC}"
        
        # Keep only last 5 backups
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
    else
        echo -e "${BLUE}No existing deployment to backup${NC}"
    fi
}

# Function to copy project files
copy_project_files() {
    log_action "Copying project files to $DEPLOY_DIR"
    
    # Copy all project files
    cp -r "$PROJECT_ROOT"/* "$DEPLOY_DIR/"
    
    # Set proper ownership
    chown -R www-data:www-data "$DEPLOY_DIR" 2>/dev/null || true
    
    # Set proper permissions
    chmod -R 755 "$DEPLOY_DIR"
    chmod +x "$DEPLOY_DIR"/*.sh 2>/dev/null || true
    chmod +x "$DEPLOY_DIR"/*.bat 2>/dev/null || true
    
    echo -e "${GREEN}✓ Project files copied successfully${NC}"
}

# Function to install system dependencies
install_system_dependencies() {
    log_action "Installing system dependencies"
    
    # Update package list
    apt update
    
    # Install Node.js (if not already installed)
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${BLUE}Installing Node.js...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install PM2 globally
    if ! command -v pm2 >/dev/null 2>&1; then
        echo -e "${BLUE}Installing PM2...${NC}"
        npm install -g pm2
    fi
    
    # Install other dependencies
    local packages=("nginx" "certbot" "python3-certbot-nginx" "ufw" "fail2ban" "curl" "git" "openssl")
    for package in "${packages[@]}"; do
        if ! dpkg -l | grep -q "^ii  $package "; then
            echo -e "${BLUE}Installing $package...${NC}"
            apt-get install -y "$package"
        fi
    done
    
    echo -e "${GREEN}✓ System dependencies installed${NC}"
}

# Function to install project dependencies
install_project_dependencies() {
    log_action "Installing project dependencies"
    
    # Install frontend dependencies
    if [[ -d "$DEPLOY_DIR/frontend" ]]; then
        echo -e "${BLUE}Installing frontend dependencies...${NC}"
        cd "$DEPLOY_DIR/frontend"
        npm install --production
    fi
    
    # Install backend dependencies
    if [[ -d "$DEPLOY_DIR/backend" ]]; then
        echo -e "${BLUE}Installing backend dependencies...${NC}"
        cd "$DEPLOY_DIR/backend"
        npm install --production
    fi
    
    echo -e "${GREEN}✓ Project dependencies installed${NC}"
}

# Function to build applications
build_applications() {
    log_action "Building applications"
    
    # Build frontend
    if [[ -d "$DEPLOY_DIR/frontend" ]]; then
        echo -e "${BLUE}Building frontend...${NC}"
        cd "$DEPLOY_DIR/frontend"
        npm run build
    fi
    
    # Build backend
    if [[ -d "$DEPLOY_DIR/backend" ]]; then
        echo -e "${BLUE}Building backend...${NC}"
        cd "$DEPLOY_DIR/backend"
        npm run build
    fi
    
    echo -e "${GREEN}✓ Applications built successfully${NC}"
}

# Function to create environment files
create_environment_files() {
    log_action "Creating environment files"
    
    # Create backend .env if it doesn't exist
    if [[ ! -f "$DEPLOY_DIR/backend/.env" ]]; then
        if [[ -f "$DEPLOY_DIR/backend/env-template.txt" ]]; then
            cp "$DEPLOY_DIR/backend/env-template.txt" "$DEPLOY_DIR/backend/.env"
            echo -e "${YELLOW}⚠ Backend .env created from template. Please edit with your actual values.${NC}"
        else
            echo -e "${RED}✗ Backend env-template.txt not found${NC}"
        fi
    fi
    
    # Create frontend .env if it doesn't exist
    if [[ ! -f "$DEPLOY_DIR/frontend/.env" ]]; then
        if [[ -f "$DEPLOY_DIR/frontend/env.example" ]]; then
            cp "$DEPLOY_DIR/frontend/env.example" "$DEPLOY_DIR/frontend/.env"
            echo -e "${YELLOW}⚠ Frontend .env created from example. Please edit with your actual values.${NC}"
        else
            echo -e "${RED}✗ Frontend env.example not found${NC}"
        fi
    fi
    
    # Set proper permissions for .env files
    chmod 600 "$DEPLOY_DIR/backend/.env" 2>/dev/null || true
    chmod 600 "$DEPLOY_DIR/frontend/.env" 2>/dev/null || true
    
    echo -e "${GREEN}✓ Environment files created${NC}"
}

# Function to create nginx configuration
create_nginx_config() {
    log_action "Creating Nginx configuration"
    
    cat > "/etc/nginx/sites-available/dashboard" << 'EOF'
# Marin Pest Control Dashboard - Nginx Configuration

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=webhook:10m rate=5r/s;

# Main application
server {
    listen 80;
    listen [::]:80;
    server_name wemakemarin.com www.wemakemarin.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name wemakemarin.com www.wemakemarin.com;
    
    # SSL configuration (will be managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/wemakemarin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wemakemarin.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (React app)
    location / {
        root /var/dashboard/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# API subdomain
server {
    listen 80;
    listen [::]:80;
    server_name api.wemakemarin.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.wemakemarin.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/api.wemakemarin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.wemakemarin.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # API backend
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}

# Webhook subdomain (non-proxied for QuickBooks)
server {
    listen 80;
    listen [::]:80;
    server_name webhook.wemakemarin.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name webhook.wemakemarin.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/webhook.wemakemarin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webhook.wemakemarin.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Webhook endpoints
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting for webhooks
        limit_req zone=webhook burst=10 nodelay;
        
        # Quick response for webhooks
        proxy_read_timeout 5s;
        proxy_connect_timeout 2s;
    }
}

# Admin subdomain
server {
    listen 80;
    listen [::]:80;
    server_name admin.wemakemarin.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.wemakemarin.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/admin.wemakemarin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.wemakemarin.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Admin interface (same as main for now)
    location / {
        root /var/dashboard/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
EOF
    
    # Enable the site
    ln -sf "/etc/nginx/sites-available/dashboard" "/etc/nginx/sites-enabled/"
    
    # Remove default nginx site
    rm -f "/etc/nginx/sites-enabled/default"
    
    # Test nginx configuration
    if nginx -t; then
        echo -e "${GREEN}✓ Nginx configuration created and tested${NC}"
    else
        echo -e "${RED}✗ Nginx configuration test failed${NC}"
        return 1
    fi
}

# Function to create systemd service
create_systemd_service() {
    log_action "Creating systemd service"
    
    cat > "/etc/systemd/system/marin-dashboard.service" << EOF
[Unit]
Description=Marin Pest Control Dashboard
After=network.target

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/pm2 start $DEPLOY_DIR/backend/ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 stop all
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable marin-dashboard.service
    
    echo -e "${GREEN}✓ Systemd service created and enabled${NC}"
}

# Function to setup SSL certificates
setup_ssl_certificates() {
    log_action "Setting up SSL certificates"
    
    # Stop nginx temporarily
    systemctl stop nginx
    
    # Get certificates for all domains
    local domains=("wemakemarin.com" "api.wemakemarin.com" "webhook.wemakemarin.com" "admin.wemakemarin.com")
    
    for domain in "${domains[@]}"; do
        echo -e "${BLUE}Getting SSL certificate for $domain...${NC}"
        certbot certonly --standalone -d "$domain" --non-interactive --agree-tos --email admin@wemakemarin.com
    done
    
    # Start nginx
    systemctl start nginx
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
    
    echo -e "${GREEN}✓ SSL certificates setup completed${NC}"
}

# Function to configure firewall
configure_firewall() {
    log_action "Configuring firewall"
    
    # Enable UFW
    ufw --force enable
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow specific ports for development (optional)
    ufw allow 5000/tcp comment "Backend API"
    ufw allow 5173/tcp comment "Frontend Dev"
    
    echo -e "${GREEN}✓ Firewall configured${NC}"
}

# Function to start services
start_services() {
    log_action "Starting services"
    
    # Start nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Start the dashboard service
    systemctl start marin-dashboard.service
    
    echo -e "${GREEN}✓ Services started${NC}"
}

# Function to run health check
run_health_check() {
    log_action "Running deployment health check"
    
    # Check if services are running
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✓ Nginx is running${NC}"
    else
        echo -e "${RED}✗ Nginx is not running${NC}"
    fi
    
    if systemctl is-active --quiet marin-dashboard.service; then
        echo -e "${GREEN}✓ Dashboard service is running${NC}"
    else
        echo -e "${RED}✗ Dashboard service is not running${NC}"
    fi
    
    # Check if ports are listening
    if netstat -tuln | grep -q ":80 "; then
        echo -e "${GREEN}✓ Port 80 is listening${NC}"
    else
        echo -e "${RED}✗ Port 80 is not listening${NC}"
    fi
    
    if netstat -tuln | grep -q ":443 "; then
        echo -e "${GREEN}✓ Port 443 is listening${NC}"
    else
        echo -e "${RED}✗ Port 443 is not listening${NC}"
    fi
    
    if netstat -tuln | grep -q ":5000 "; then
        echo -e "${GREEN}✓ Port 5000 (Backend) is listening${NC}"
    else
        echo -e "${RED}✗ Port 5000 (Backend) is not listening${NC}"
    fi
}

# Main deployment function
main() {
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║                Marin Pest Control Dashboard                 ║${NC}"
    echo -e "${WHITE}║                   Deployment Script                        ║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Check if running as root
    check_root
    
    # Create necessary directories
    create_directories
    
    # Backup existing deployment
    backup_existing
    
    # Copy project files
    copy_project_files
    
    # Install system dependencies
    install_system_dependencies
    
    # Install project dependencies
    install_project_dependencies
    
    # Build applications
    build_applications
    
    # Create environment files
    create_environment_files
    
    # Create nginx configuration
    create_nginx_config
    
    # Create systemd service
    create_systemd_service
    
    # Configure firewall
    configure_firewall
    
    # Setup SSL certificates
    echo -e "${YELLOW}⚠ SSL certificate setup requires manual intervention${NC}"
    echo -e "${YELLOW}Please run: sudo certbot --nginx -d wemakemarin.com -d api.wemakemarin.com -d webhook.wemakemarin.com -d admin.wemakemarin.com${NC}"
    
    # Start services
    start_services
    
    # Run health check
    run_health_check
    
    echo
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Edit environment files:"
    echo "   - $DEPLOY_DIR/backend/.env"
    echo "   - $DEPLOY_DIR/frontend/.env"
    echo
    echo "2. Setup SSL certificates:"
    echo "   sudo certbot --nginx -d wemakemarin.com -d api.wemakemarin.com -d webhook.wemakemarin.com -d admin.wemakemarin.com"
    echo
    echo "3. Use the management script:"
    echo "   cd $DEPLOY_DIR && ./manage.sh"
    echo
    echo "4. Test your deployment:"
    echo "   curl https://wemakemarin.com"
    echo "   curl https://api.wemakemarin.com/health"
}

# Run main function
main "$@"
