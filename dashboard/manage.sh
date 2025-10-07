#!/bin/bash

# Marin Pest Control Dashboard - Linux Management Console
# Comprehensive server management and monitoring tool

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

# Use deployment directory if it exists, otherwise use project root
if [[ -d "$DEPLOY_DIR" ]]; then
    FRONTEND_DIR="$DEPLOY_DIR/frontend"
    BACKEND_DIR="$DEPLOY_DIR/backend"
    LOGS_DIR="$DEPLOY_DIR/logs"
    CHANGES_LOG="$DEPLOY_DIR/docs/changes.log"
else
    FRONTEND_DIR="$PROJECT_ROOT/frontend"
    BACKEND_DIR="$PROJECT_ROOT/backend"
    LOGS_DIR="$PROJECT_ROOT/logs"
    CHANGES_LOG="$PROJECT_ROOT/docs/changes.log"
fi

NGINX_DIR="/etc/nginx"
PM2_CONFIG="$BACKEND_DIR/ecosystem.config.js"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Logging function
log_action() {
    local action="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $action" >> "$CHANGES_LOG"
    echo -e "${GREEN}[$timestamp]${NC} $action"
}

# Error handling function
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
check_port() {
    local port=$1
    if command_exists netstat; then
        netstat -tuln | grep -q ":$port "
    elif command_exists ss; then
        ss -tuln | grep -q ":$port "
    else
        return 1
    fi
}

# Function to get service status
get_service_status() {
    local service=$1
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        echo -e "${GREEN}RUNNING${NC}"
    elif systemctl is-failed --quiet "$service" 2>/dev/null; then
        echo -e "${RED}FAILED${NC}"
    else
        echo -e "${YELLOW}STOPPED${NC}"
    fi
}

# Function to check if PM2 is running
check_pm2_status() {
    if command_exists pm2; then
        pm2 list 2>/dev/null | grep -q "online" && echo -e "${GREEN}RUNNING${NC}" || echo -e "${YELLOW}STOPPED${NC}"
    else
        echo -e "${RED}NOT INSTALLED${NC}"
    fi
}

# Function to set proper permissions
set_permissions() {
    log_action "Setting proper file permissions"
    
    # Set executable permissions for scripts
    chmod +x "$PROJECT_ROOT"/*.sh 2>/dev/null || true
    chmod +x "$PROJECT_ROOT"/*.bat 2>/dev/null || true
    
    # Set permissions for project directories
    chmod 755 "$PROJECT_ROOT" 2>/dev/null || true
    chmod 755 "$FRONTEND_DIR" 2>/dev/null || true
    chmod 755 "$BACKEND_DIR" 2>/dev/null || true
    
    # Set permissions for logs directory
    chmod 755 "$LOGS_DIR" 2>/dev/null || true
    
    # Set permissions for node_modules (if they exist)
    if [[ -d "$FRONTEND_DIR/node_modules" ]]; then
        chmod -R 755 "$FRONTEND_DIR/node_modules" 2>/dev/null || true
    fi
    if [[ -d "$BACKEND_DIR/node_modules" ]]; then
        chmod -R 755 "$BACKEND_DIR/node_modules" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Permissions set successfully${NC}"
}

# Function to check system requirements
check_requirements() {
    log_action "Checking system requirements"
    
    local missing_deps=()
    
    # Check for required commands
    local required_commands=("node" "npm" "git" "curl" "systemctl")
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check for optional but recommended commands
    local optional_commands=("pm2" "nginx" "certbot" "ufw" "fail2ban")
    for cmd in "${optional_commands[@]}"; do
        if ! command_exists "$cmd"; then
            echo -e "${YELLOW}⚠ $cmd not found (optional)${NC}"
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo -e "${RED}Missing required dependencies: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}Would you like to install them? (y/n):${NC}"
        read -r install_choice
        if [[ $install_choice == "y" || $install_choice == "Y" ]]; then
            install_dependencies "${missing_deps[@]}"
        else
            echo -e "${RED}Cannot continue without required dependencies${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✓ All required dependencies found${NC}"
    fi
}

# Function to install dependencies
install_dependencies() {
    local deps=("$@")
    log_action "Installing dependencies: ${deps[*]}"
    
    # Update package list
    sudo apt update
    
    for dep in "${deps[@]}"; do
        case $dep in
            "node")
                echo -e "${BLUE}Installing Node.js...${NC}"
                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                sudo apt-get install -y nodejs
                ;;
            "npm")
                # npm comes with node
                echo -e "${BLUE}npm will be installed with Node.js${NC}"
                ;;
            "git")
                sudo apt-get install -y git
                ;;
            "curl")
                sudo apt-get install -y curl
                ;;
            "systemctl")
                # systemctl comes with systemd
                echo -e "${BLUE}systemctl is part of systemd${NC}"
                ;;
            *)
                sudo apt-get install -y "$dep"
                ;;
        esac
    done
    
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
}

# Function to check database connectivity
check_database() {
    log_action "Checking database connectivity"
    
    if [[ -f "$BACKEND_DIR/.env" ]]; then
        source "$BACKEND_DIR/.env"
        if [[ -n "${DATABASE_URL:-}" ]]; then
            echo -e "${BLUE}Testing database connection...${NC}"
            if command_exists psql; then
                if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
                    echo -e "${GREEN}✓ Database connection successful${NC}"
                    return 0
                else
                    echo -e "${RED}✗ Database connection failed${NC}"
                    return 1
                fi
            else
                echo -e "${YELLOW}⚠ psql not available, cannot test database connection${NC}"
                return 1
            fi
        else
            echo -e "${RED}✗ DATABASE_URL not found in .env file${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Backend .env file not found${NC}"
        return 1
    fi
}

# Function to check API health
check_api_health() {
    log_action "Checking API health"
    
    local api_url="http://localhost:5000"
    if [[ -f "$BACKEND_DIR/.env" ]]; then
        source "$BACKEND_DIR/.env"
        api_url="${API_BASE_URL:-http://localhost:5000}"
    fi
    
    echo -e "${BLUE}Testing API health endpoint...${NC}"
    if curl -s -f "$api_url/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ API health check successful${NC}"
        curl -s "$api_url/health" | jq . 2>/dev/null || curl -s "$api_url/health"
        return 0
    else
        echo -e "${RED}✗ API health check failed${NC}"
        return 1
    fi
}

# Function to check webhook health
check_webhook_health() {
    log_action "Checking webhook health"
    
    local api_url="http://localhost:5000"
    if [[ -f "$BACKEND_DIR/.env" ]]; then
        source "$BACKEND_DIR/.env"
        api_url="${API_BASE_URL:-http://localhost:5000}"
    fi
    
    echo -e "${BLUE}Testing webhook health endpoint...${NC}"
    if curl -s -f "$api_url/api/webhook/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Webhook health check successful${NC}"
        curl -s "$api_url/api/webhook/health" | jq . 2>/dev/null || curl -s "$api_url/api/webhook/health"
        return 0
    else
        echo -e "${RED}✗ Webhook health check failed${NC}"
        return 1
    fi
}

# Function to start backend
start_backend() {
    log_action "Starting backend services"
    
    if [[ ! -d "$BACKEND_DIR" ]]; then
        echo -e "${RED}✗ Backend directory not found${NC}"
        return 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Check if .env exists
    if [[ ! -f ".env" ]]; then
        echo -e "${RED}✗ Backend .env file not found${NC}"
        echo -e "${YELLOW}Please create .env file from env-template.txt${NC}"
        return 1
    fi
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        echo -e "${BLUE}Installing backend dependencies...${NC}"
        npm install
    fi
    
    # Build if needed
    if [[ ! -d "dist" ]]; then
        echo -e "${BLUE}Building backend...${NC}"
        npm run build
    fi
    
    # Start with PM2 if available, otherwise use npm
    if command_exists pm2; then
        echo -e "${BLUE}Starting backend with PM2...${NC}"
        pm2 start ecosystem.config.js --env development
        pm2 save
    else
        echo -e "${BLUE}Starting backend with npm...${NC}"
        npm run dev:with-services &
        echo $! > "$LOGS_DIR/backend.pid"
    fi
    
    echo -e "${GREEN}✓ Backend started successfully${NC}"
}

# Function to stop backend
stop_backend() {
    log_action "Stopping backend services"
    
    if command_exists pm2; then
        echo -e "${BLUE}Stopping backend with PM2...${NC}"
        pm2 stop marin-pest-control-backend 2>/dev/null || true
        pm2 stop marin-token-refresher 2>/dev/null || true
        pm2 stop marin-qbo-sync 2>/dev/null || true
    fi
    
    # Kill any remaining processes
    if [[ -f "$LOGS_DIR/backend.pid" ]]; then
        local pid=$(cat "$LOGS_DIR/backend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
        fi
        rm -f "$LOGS_DIR/backend.pid"
    fi
    
    # Kill any node processes running on port 5000
    local port_pid=$(lsof -ti:5000 2>/dev/null || true)
    if [[ -n "$port_pid" ]]; then
        kill "$port_pid" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Backend stopped successfully${NC}"
}

# Function to restart backend
restart_backend() {
    log_action "Restarting backend services"
    stop_backend
    sleep 2
    start_backend
}

# Function to start frontend
start_frontend() {
    log_action "Starting frontend services"
    
    if [[ ! -d "$FRONTEND_DIR" ]]; then
        echo -e "${RED}✗ Frontend directory not found${NC}"
        return 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        echo -e "${BLUE}Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Start frontend
    echo -e "${BLUE}Starting frontend...${NC}"
    npm run dev &
    echo $! > "$LOGS_DIR/frontend.pid"
    
    echo -e "${GREEN}✓ Frontend started successfully${NC}"
}

# Function to stop frontend
stop_frontend() {
    log_action "Stopping frontend services"
    
    # Kill frontend process
    if [[ -f "$LOGS_DIR/frontend.pid" ]]; then
        local pid=$(cat "$LOGS_DIR/frontend.pid")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
        fi
        rm -f "$LOGS_DIR/frontend.pid"
    fi
    
    # Kill any node processes running on port 5173
    local port_pid=$(lsof -ti:5173 2>/dev/null || true)
    if [[ -n "$port_pid" ]]; then
        kill "$port_pid" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Frontend stopped successfully${NC}"
}

# Function to restart frontend
restart_frontend() {
    log_action "Restarting frontend services"
    stop_frontend
    sleep 2
    start_frontend
}

# Function to show service status
show_service_status() {
    echo -e "${WHITE}=== SERVICE STATUS ===${NC}"
    echo
    
    # Backend status
    echo -e "${BLUE}Backend Services:${NC}"
    if command_exists pm2; then
        pm2 list 2>/dev/null || echo -e "${YELLOW}PM2 not running${NC}"
    else
        if check_port 5000; then
            echo -e "${GREEN}Backend running on port 5000${NC}"
        else
            echo -e "${YELLOW}Backend not running${NC}"
        fi
    fi
    echo
    
    # Frontend status
    echo -e "${BLUE}Frontend Services:${NC}"
    if check_port 5173; then
        echo -e "${GREEN}Frontend running on port 5173${NC}"
    else
        echo -e "${YELLOW}Frontend not running${NC}"
    fi
    echo
    
    # Database status
    echo -e "${BLUE}Database:${NC}"
    if check_database; then
        echo -e "${GREEN}Database connected${NC}"
    else
        echo -e "${RED}Database disconnected${NC}"
    fi
    echo
    
    # API health
    echo -e "${BLUE}API Health:${NC}"
    if check_api_health; then
        echo -e "${GREEN}API healthy${NC}"
    else
        echo -e "${RED}API unhealthy${NC}"
    fi
    echo
    
    # Webhook health
    echo -e "${BLUE}Webhook Health:${NC}"
    if check_webhook_health; then
        echo -e "${GREEN}Webhook healthy${NC}"
    else
        echo -e "${RED}Webhook unhealthy${NC}"
    fi
    echo
}

# Function to show remote access status
show_remote_access() {
    echo -e "${WHITE}=== REMOTE ACCESS STATUS ===${NC}"
    echo
    
    # SSH
    echo -e "${BLUE}SSH:${NC}"
    if get_service_status ssh | grep -q "RUNNING"; then
        local ssh_port=$(ss -tuln | grep :22 | awk '{print $5}' | cut -d: -f2)
        echo -e "${GREEN}RUNNING${NC} on port ${ssh_port:-22}"
        echo -e "  Username: $(whoami)"
        echo -e "  Key-based auth: $(test -f ~/.ssh/authorized_keys && echo "Enabled" || echo "Disabled")"
    else
        echo -e "${YELLOW}STOPPED${NC}"
    fi
    echo
    
    # VNC
    echo -e "${BLUE}VNC:${NC}"
    if command_exists vncserver; then
        local vnc_processes=$(pgrep -f vncserver | wc -l)
        if [[ $vnc_processes -gt 0 ]]; then
            echo -e "${GREEN}RUNNING${NC}"
            echo -e "  Sessions: $vnc_processes"
        else
            echo -e "${YELLOW}STOPPED${NC}"
        fi
    else
        echo -e "${RED}NOT INSTALLED${NC}"
    fi
    echo
    
    # RDP (xrdp)
    echo -e "${BLUE}RDP (xrdp):${NC}"
    if get_service_status xrdp | grep -q "RUNNING"; then
        echo -e "${GREEN}RUNNING${NC} on port 3389"
        echo -e "  Username: $(whoami)"
    else
        echo -e "${YELLOW}STOPPED${NC}"
    fi
    echo
    
    # SFTP
    echo -e "${BLUE}SFTP:${NC}"
    if get_service_status ssh | grep -q "RUNNING"; then
        echo -e "${GREEN}AVAILABLE${NC} (via SSH)"
        echo -e "  Port: 22"
    else
        echo -e "${YELLOW}UNAVAILABLE${NC}"
    fi
    echo
    
    # NFS
    echo -e "${BLUE}NFS:${NC}"
    if get_service_status nfs-kernel-server | grep -q "RUNNING"; then
        echo -e "${GREEN}RUNNING${NC}"
        echo -e "  Exports: $(showmount -e localhost 2>/dev/null | wc -l) configured"
    else
        echo -e "${YELLOW}STOPPED${NC}"
    fi
    echo
    
    # SMB/CIFS
    echo -e "${BLUE}SMB/CIFS:${NC}"
    if get_service_status smbd | grep -q "RUNNING"; then
        echo -e "${GREEN}RUNNING${NC} on port 445"
        echo -e "  Shares: $(smbclient -L localhost -N 2>/dev/null | grep -c "Disk" || echo "0")"
    else
        echo -e "${YELLOW}STOPPED${NC}"
    fi
    echo
    
    # RSYNC
    echo -e "${BLUE}RSYNC:${NC}"
    if get_service_status rsync | grep -q "RUNNING"; then
        echo -e "${GREEN}RUNNING${NC} on port 873"
    else
        echo -e "${YELLOW}STOPPED${NC}"
    fi
    echo
}

# Function to manage remote access services
manage_remote_access() {
    while true; do
        echo -e "${WHITE}=== REMOTE ACCESS MANAGEMENT ===${NC}"
        echo "1. View Remote Access Status"
        echo "2. Start SSH Service"
        echo "3. Stop SSH Service"
        echo "4. Start VNC Server"
        echo "5. Stop VNC Server"
        echo "6. Start RDP (xrdp) Service"
        echo "7. Stop RDP (xrdp) Service"
        echo "8. Start NFS Service"
        echo "9. Stop NFS Service"
        echo "10. Start SMB/CIFS Service"
        echo "11. Stop SMB/CIFS Service"
        echo "12. Start RSYNC Service"
        echo "13. Stop RSYNC Service"
        echo "14. Configure SSH Keys"
        echo "15. Test Remote Connections"
        echo "0. Back to Main Menu"
        echo
        read -p "Select option: " choice
        
        case $choice in
            1) show_remote_access ;;
            2) sudo systemctl start ssh && log_action "SSH service started" ;;
            3) sudo systemctl stop ssh && log_action "SSH service stopped" ;;
            4) 
                echo -e "${BLUE}Starting VNC server...${NC}"
                vncserver :1 -geometry 1920x1080 -depth 24
                log_action "VNC server started"
                ;;
            5) 
                echo -e "${BLUE}Stopping VNC server...${NC}"
                vncserver -kill :1 2>/dev/null || true
                log_action "VNC server stopped"
                ;;
            6) sudo systemctl start xrdp && log_action "RDP service started" ;;
            7) sudo systemctl stop xrdp && log_action "RDP service stopped" ;;
            8) sudo systemctl start nfs-kernel-server && log_action "NFS service started" ;;
            9) sudo systemctl stop nfs-kernel-server && log_action "NFS service stopped" ;;
            10) sudo systemctl start smbd && log_action "SMB service started" ;;
            11) sudo systemctl stop smbd && log_action "SMB service stopped" ;;
            12) sudo systemctl start rsync && log_action "RSYNC service started" ;;
            13) sudo systemctl stop rsync && log_action "RSYNC service stopped" ;;
            14) configure_ssh_keys ;;
            15) test_remote_connections ;;
            0) break ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        echo
        read -p "Press Enter to continue..."
    done
}

# Function to configure SSH keys
configure_ssh_keys() {
    echo -e "${WHITE}=== SSH KEY CONFIGURATION ===${NC}"
    echo "1. Generate new SSH key pair"
    echo "2. Copy public key to remote server"
    echo "3. Add server to known hosts"
    echo "4. View current SSH keys"
    echo "0. Back"
    echo
    read -p "Select option: " choice
    
    case $choice in
        1)
            echo -e "${BLUE}Generating new SSH key pair...${NC}"
            ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
            log_action "New SSH key pair generated"
            ;;
        2)
            read -p "Enter remote server address: " server
            read -p "Enter username: " username
            ssh-copy-id "$username@$server"
            log_action "SSH key copied to $username@$server"
            ;;
        3)
            read -p "Enter server address: " server
            ssh-keyscan -H "$server" >> ~/.ssh/known_hosts
            log_action "Server $server added to known hosts"
            ;;
        4)
            echo -e "${BLUE}Current SSH keys:${NC}"
            ls -la ~/.ssh/id_*
            echo
            echo -e "${BLUE}Public key:${NC}"
            cat ~/.ssh/id_rsa.pub 2>/dev/null || echo "No public key found"
            ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

# Function to test remote connections
test_remote_connections() {
    echo -e "${WHITE}=== TESTING REMOTE CONNECTIONS ===${NC}"
    
    # Test SSH
    echo -e "${BLUE}Testing SSH connection...${NC}"
    if ssh -o ConnectTimeout=5 -o BatchMode=yes localhost exit 2>/dev/null; then
        echo -e "${GREEN}✓ SSH connection successful${NC}"
    else
        echo -e "${RED}✗ SSH connection failed${NC}"
    fi
    
    # Test VNC
    echo -e "${BLUE}Testing VNC connection...${NC}"
    if nc -z localhost 5901 2>/dev/null; then
        echo -e "${GREEN}✓ VNC port 5901 accessible${NC}"
    else
        echo -e "${YELLOW}⚠ VNC port 5901 not accessible${NC}"
    fi
    
    # Test RDP
    echo -e "${BLUE}Testing RDP connection...${NC}"
    if nc -z localhost 3389 2>/dev/null; then
        echo -e "${GREEN}✓ RDP port 3389 accessible${NC}"
    else
        echo -e "${YELLOW}⚠ RDP port 3389 not accessible${NC}"
    fi
    
    # Test SMB
    echo -e "${BLUE}Testing SMB connection...${NC}"
    if nc -z localhost 445 2>/dev/null; then
        echo -e "${GREEN}✓ SMB port 445 accessible${NC}"
    else
        echo -e "${YELLOW}⚠ SMB port 445 not accessible${NC}"
    fi
}

# Function to manage server services
manage_server_services() {
    while true; do
        echo -e "${WHITE}=== SERVER SERVICES MANAGEMENT ===${NC}"
        echo "1. Restart Nginx"
        echo "2. Renew SSL Certificates (Certbot)"
        echo "3. View/Change Logging Level"
        echo "4. Enable/Disable Services"
        echo "5. List Running Processes"
        echo "6. Kill Process by PID"
        echo "7. Inspect Non-Server Processes"
        echo "8. View System Logs"
        echo "9. Check for Intrusions"
        echo "10. System Resource Monitor"
        echo "11. Service Status Overview"
        echo "0. Back to Main Menu"
        echo
        read -p "Select option: " choice
        
        case $choice in
            1) restart_nginx ;;
            2) renew_ssl_certificates ;;
            3) manage_logging_level ;;
            4) manage_service_enable_disable ;;
            5) list_processes ;;
            6) kill_process ;;
            7) inspect_non_server_processes ;;
            8) view_system_logs ;;
            9) check_intrusions ;;
            10) system_resource_monitor ;;
            11) service_status_overview ;;
            0) break ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        echo
        read -p "Press Enter to continue..."
    done
}

# Function to restart nginx
restart_nginx() {
    log_action "Restarting Nginx"
    if command_exists nginx; then
        sudo systemctl restart nginx
        if systemctl is-active --quiet nginx; then
            echo -e "${GREEN}✓ Nginx restarted successfully${NC}"
        else
            echo -e "${RED}✗ Nginx restart failed${NC}"
            sudo systemctl status nginx
        fi
    else
        echo -e "${RED}✗ Nginx not installed${NC}"
    fi
}

# Function to renew SSL certificates
renew_ssl_certificates() {
    log_action "Renewing SSL certificates"
    if command_exists certbot; then
        echo -e "${BLUE}Renewing SSL certificates...${NC}"
        sudo certbot renew --dry-run
        echo -e "${YELLOW}Dry run completed. Run without --dry-run to actually renew.${NC}"
        echo -e "${YELLOW}Continue with actual renewal? (y/n):${NC}"
        read -r renew_choice
        if [[ $renew_choice == "y" || $renew_choice == "Y" ]]; then
            sudo certbot renew
            sudo systemctl reload nginx
            echo -e "${GREEN}✓ SSL certificates renewed${NC}"
        fi
    else
        echo -e "${RED}✗ Certbot not installed${NC}"
    fi
}

# Function to manage logging level
manage_logging_level() {
    echo -e "${WHITE}=== LOGGING LEVEL MANAGEMENT ===${NC}"
    echo "1. View current logging level"
    echo "2. Set logging level to DEBUG"
    echo "3. Set logging level to INFO"
    echo "4. Set logging level to WARN"
    echo "5. Set logging level to ERROR"
    echo "0. Back"
    echo
    read -p "Select option: " choice
    
    case $choice in
        1)
            echo -e "${BLUE}Current logging configuration:${NC}"
            if [[ -f "$BACKEND_DIR/.env" ]]; then
                grep LOG_LEVEL "$BACKEND_DIR/.env" || echo "LOG_LEVEL not set"
            fi
            ;;
        2|3|4|5)
            local levels=("" "DEBUG" "INFO" "WARN" "ERROR")
            local level="${levels[$choice]}"
            if [[ -f "$BACKEND_DIR/.env" ]]; then
                if grep -q "LOG_LEVEL" "$BACKEND_DIR/.env"; then
                    sed -i "s/LOG_LEVEL=.*/LOG_LEVEL=$level/" "$BACKEND_DIR/.env"
                else
                    echo "LOG_LEVEL=$level" >> "$BACKEND_DIR/.env"
                fi
                echo -e "${GREEN}✓ Logging level set to $level${NC}"
                log_action "Logging level changed to $level"
            else
                echo -e "${RED}✗ Backend .env file not found${NC}"
            fi
            ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

# Function to manage service enable/disable
manage_service_enable_disable() {
    echo -e "${WHITE}=== SERVICE ENABLE/DISABLE ===${NC}"
    echo "1. Enable service"
    echo "2. Disable service"
    echo "3. View service status"
    echo "0. Back"
    echo
    read -p "Select option: " choice
    
    case $choice in
        1)
            read -p "Enter service name: " service
            sudo systemctl enable "$service"
            echo -e "${GREEN}✓ Service $service enabled${NC}"
            ;;
        2)
            read -p "Enter service name: " service
            sudo systemctl disable "$service"
            echo -e "${GREEN}✓ Service $service disabled${NC}"
            ;;
        3)
            read -p "Enter service name: " service
            sudo systemctl status "$service"
            ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

# Function to list processes
list_processes() {
    echo -e "${WHITE}=== RUNNING PROCESSES ===${NC}"
    echo "1. All processes"
    echo "2. Node.js processes"
    echo "3. PM2 processes"
    echo "4. Nginx processes"
    echo "5. Database processes"
    echo "0. Back"
    echo
    read -p "Select option: " choice
    
    case $choice in
        1) ps aux --sort=-%cpu | head -20 ;;
        2) ps aux | grep node | grep -v grep ;;
        3) pm2 list 2>/dev/null || echo "PM2 not running" ;;
        4) ps aux | grep nginx | grep -v grep ;;
        5) ps aux | grep -E "(postgres|mysql|mongo)" | grep -v grep ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

# Function to kill process
kill_process() {
    read -p "Enter PID to kill: " pid
    if [[ -n "$pid" && "$pid" =~ ^[0-9]+$ ]]; then
        echo -e "${YELLOW}Killing process $pid...${NC}"
        if kill "$pid" 2>/dev/null; then
            echo -e "${GREEN}✓ Process $pid killed${NC}"
            log_action "Process $pid killed"
        else
            echo -e "${RED}✗ Failed to kill process $pid${NC}"
        fi
    else
        echo -e "${RED}Invalid PID${NC}"
    fi
}

# Function to inspect non-server processes
inspect_non_server_processes() {
    echo -e "${WHITE}=== NON-SERVER PROCESSES ===${NC}"
    echo -e "${BLUE}Processes that might not belong on a server:${NC}"
    
    # Look for GUI applications
    ps aux | grep -E "(firefox|chrome|gedit|libreoffice|vlc)" | grep -v grep
    
    # Look for development tools that shouldn't be on production
    ps aux | grep -E "(code|atom|sublime|phpstorm)" | grep -v grep
    
    # Look for suspicious processes
    ps aux | grep -E "(mining|crypto|bitcoin)" | grep -v grep
    
    echo
    echo -e "${YELLOW}Review these processes and kill any that shouldn't be running${NC}"
}

# Function to view system logs
view_system_logs() {
    echo -e "${WHITE}=== SYSTEM LOGS ===${NC}"
    echo "1. System logs (journalctl)"
    echo "2. Nginx logs"
    echo "3. PM2 logs"
    echo "4. Application logs"
    echo "5. Authentication logs"
    echo "6. Error logs"
    echo "0. Back"
    echo
    read -p "Select option: " choice
    
    case $choice in
        1) sudo journalctl -f ;;
        2) sudo tail -f /var/log/nginx/error.log ;;
        3) pm2 logs 2>/dev/null || echo "PM2 not running" ;;
        4) tail -f "$LOGS_DIR"/*.log 2>/dev/null || echo "No application logs found" ;;
        5) sudo tail -f /var/log/auth.log ;;
        6) sudo journalctl -p err -f ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

# Function to check for intrusions
check_intrusions() {
    echo -e "${WHITE}=== INTRUSION DETECTION ===${NC}"
    
    # Check for failed login attempts
    echo -e "${BLUE}Failed login attempts (last 24h):${NC}"
    sudo grep "Failed password" /var/log/auth.log | tail -10
    
    # Check for suspicious network connections
    echo -e "${BLUE}Active network connections:${NC}"
    netstat -tuln | grep -E "(LISTEN|ESTABLISHED)"
    
    # Check for unusual processes
    echo -e "${BLUE}Processes with high CPU usage:${NC}"
    ps aux --sort=-%cpu | head -10
    
    # Check for rootkits
    if command_exists rkhunter; then
        echo -e "${BLUE}Running rootkit scan...${NC}"
        sudo rkhunter --check --skip-keypress
    else
        echo -e "${YELLOW}rkhunter not installed. Install with: sudo apt install rkhunter${NC}"
    fi
    
    # Check file integrity
    echo -e "${BLUE}Checking for modified system files...${NC}"
    sudo find /etc -type f -mtime -1 -ls | head -10
}

# Function to monitor system resources
system_resource_monitor() {
    echo -e "${WHITE}=== SYSTEM RESOURCE MONITOR ===${NC}"
    
    # CPU usage
    echo -e "${BLUE}CPU Usage:${NC}"
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
    
    # Memory usage
    echo -e "${BLUE}Memory Usage:${NC}"
    free -h
    
    # Disk usage
    echo -e "${BLUE}Disk Usage:${NC}"
    df -h
    
    # Network usage
    echo -e "${BLUE}Network Usage:${NC}"
    if command_exists iftop; then
        sudo iftop -t -s 10
    else
        echo -e "${YELLOW}iftop not installed. Install with: sudo apt install iftop${NC}"
    fi
    
    # Load average
    echo -e "${BLUE}Load Average:${NC}"
    uptime
}

# Function to show service status overview
service_status_overview() {
    echo -e "${WHITE}=== SERVICE STATUS OVERVIEW ===${NC}"
    
    local services=("nginx" "ssh" "postgresql" "mysql" "redis" "mongodb" "docker")
    
    for service in "${services[@]}"; do
        if systemctl list-unit-files | grep -q "$service"; then
            echo -e "${BLUE}$service:${NC} $(get_service_status "$service")"
        fi
    done
    
    echo
    echo -e "${BLUE}PM2 Status:${NC} $(check_pm2_status)"
    echo -e "${BLUE}Port 5000:${NC} $(check_port 5000 && echo -e "${GREEN}IN USE${NC}" || echo -e "${YELLOW}FREE${NC}")"
    echo -e "${BLUE}Port 5173:${NC} $(check_port 5173 && echo -e "${GREEN}IN USE${NC}" || echo -e "${YELLOW}FREE${NC}")"
}

# Function to run comprehensive health check
run_health_check() {
    log_action "Running comprehensive health check"
    
    echo -e "${WHITE}=== COMPREHENSIVE HEALTH CHECK ===${NC}"
    echo
    
    # System requirements
    echo -e "${BLUE}1. System Requirements:${NC}"
    check_requirements
    echo
    
    # File permissions
    echo -e "${BLUE}2. File Permissions:${NC}"
    set_permissions
    echo
    
    # Database connectivity
    echo -e "${BLUE}3. Database Connectivity:${NC}"
    check_database
    echo
    
    # API health
    echo -e "${BLUE}4. API Health:${NC}"
    check_api_health
    echo
    
    # Webhook health
    echo -e "${BLUE}5. Webhook Health:${NC}"
    check_webhook_health
    echo
    
    # Service status
    echo -e "${BLUE}6. Service Status:${NC}"
    show_service_status
    
    echo -e "${GREEN}✓ Health check completed${NC}"
}

# Function to test webhook
test_webhook() {
    log_action "Testing webhook endpoint"
    
    if [[ -f "$BACKEND_DIR/test-webhook.js" ]]; then
        cd "$BACKEND_DIR"
        echo -e "${BLUE}Running webhook test...${NC}"
        node test-webhook.js
    else
        echo -e "${RED}✗ Webhook test script not found${NC}"
        echo -e "${YELLOW}Creating webhook test script...${NC}"
        create_webhook_test_script
    fi
}

# Function to test DNS configuration
test_dns_configuration() {
    log_action "Testing DNS configuration"
    
    echo -e "${WHITE}=== DNS CONFIGURATION TEST ===${NC}"
    echo
    
    local domains=("wemakemarin.com" "api.wemakemarin.com" "webhook.wemakemarin.com" "admin.wemakemarin.com")
    
    for domain in "${domains[@]}"; do
        echo -e "${BLUE}Testing $domain:${NC}"
        
        # Test DNS resolution
        if nslookup "$domain" >/dev/null 2>&1; then
            echo -e "  DNS Resolution: ${GREEN}✓${NC}"
            local ip=$(nslookup "$domain" | grep "Address:" | tail -1 | awk '{print $2}')
            echo -e "  IP Address: $ip"
        else
            echo -e "  DNS Resolution: ${RED}✗${NC}"
        fi
        
        # Test HTTPS connectivity
        if curl -s -I "https://$domain" >/dev/null 2>&1; then
            echo -e "  HTTPS Connectivity: ${GREEN}✓${NC}"
        else
            echo -e "  HTTPS Connectivity: ${RED}✗${NC}"
        fi
        
        echo
    done
    
    # Test specific endpoints
    echo -e "${BLUE}Testing API endpoints:${NC}"
    if curl -s -f "https://api.wemakemarin.com/health" >/dev/null 2>&1; then
        echo -e "  API Health: ${GREEN}✓${NC}"
    else
        echo -e "  API Health: ${RED}✗${NC}"
    fi
    
    if curl -s -f "https://webhook.wemakemarin.com/api/webhook/health" >/dev/null 2>&1; then
        echo -e "  Webhook Health: ${GREEN}✓${NC}"
    else
        echo -e "  Webhook Health: ${RED}✗${NC}"
    fi
    
    echo
    echo -e "${YELLOW}Note: If webhook.wemakemarin.com fails, ensure it's not proxied through Cloudflare${NC}"
}

# Function to check SSL certificates
check_ssl_certificates() {
    log_action "Checking SSL certificates"
    
    echo -e "${WHITE}=== SSL CERTIFICATE CHECK ===${NC}"
    echo
    
    local domains=("wemakemarin.com" "api.wemakemarin.com" "webhook.wemakemarin.com" "admin.wemakemarin.com")
    
    for domain in "${domains[@]}"; do
        echo -e "${BLUE}Checking SSL for $domain:${NC}"
        
        if command_exists openssl; then
            local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
            if [[ -n "$cert_info" ]]; then
                echo -e "  Certificate: ${GREEN}Valid${NC}"
                echo "$cert_info" | grep "notAfter" | sed 's/notAfter=/  Expires: /'
            else
                echo -e "  Certificate: ${RED}Invalid or not found${NC}"
            fi
        else
            echo -e "  Certificate: ${YELLOW}Cannot check (openssl not available)${NC}"
        fi
        
        echo
    done
}

# Function to create webhook test script
create_webhook_test_script() {
    cat > "$BACKEND_DIR/test-webhook.js" << 'EOF'
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: './.env' });

const WEBHOOK_URL = process.env.QBO_WEBHOOK_URL || 'http://localhost:5000/api/webhook/quickbooks';
const WEBHOOK_VERIFIER_TOKEN = process.env.QBO_WEBHOOK_VERIFIER_TOKEN || 'your_webhook_verifier_token';

const generateSignature = (payload, verifierToken) => {
    const hmac = crypto.createHmac('sha256', verifierToken);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('base64');
};

const testWebhook = async () => {
    const payload = {
        eventNotifications: [
            {
                realmId: process.env.QBO_REALM_ID || 'test_realm_id',
                dataChangeEvent: {
                    entities: [
                        {
                            name: 'Customer',
                            id: '1',
                            operation: 'Create',
                            lastUpdated: new Date().toISOString(),
                        },
                        {
                            name: 'Invoice',
                            id: '2',
                            operation: 'Update',
                            lastUpdated: new Date().toISOString(),
                        },
                    ],
                },
            },
        ],
    };

    const signature = generateSignature(payload, WEBHOOK_VERIFIER_TOKEN);

    try {
        console.log(`Sending test webhook to: ${WEBHOOK_URL}`);
        const response = await axios.post(WEBHOOK_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Intuit-Signature': signature,
            },
        });

        console.log('Webhook Test Response Status:', response.status);
        console.log('Webhook Test Response Data:', response.data);
    } catch (error) {
        console.error('Webhook Test Failed:', error.response ? error.response.data : error.message);
    }
};

testWebhook();
EOF
    
    echo -e "${GREEN}✓ Webhook test script created${NC}"
    test_webhook
}

# Main menu
main_menu() {
    while true; do
        clear
        echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${WHITE}║                Marin Pest Control Dashboard                 ║${NC}"
        echo -e "${WHITE}║                   Management Console                        ║${NC}"
        echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo
        echo -e "${CYAN}Development & Production:${NC}"
        echo "1. Start Development (Frontend + Backend)"
        echo "2. Start Production (PM2)"
        echo "3. Start Backend Only"
        echo "4. Stop All Services"
        echo "5. Restart All Services"
        echo
        echo -e "${CYAN}Service Management:${NC}"
        echo "6. Service Status Overview"
        echo "7. Start Backend"
        echo "8. Stop Backend"
        echo "9. Restart Backend"
        echo "10. Start Frontend"
        echo "11. Stop Frontend"
        echo "12. Restart Frontend"
        echo
        echo -e "${CYAN}Health & Monitoring:${NC}"
        echo "13. Comprehensive Health Check"
        echo "14. Check Database Connectivity"
        echo "15. Check API Health"
        echo "16. Check Webhook Health"
        echo "17. Test Webhook"
        echo "18. Test DNS Configuration"
        echo "19. Check SSL Certificates"
        echo
        echo -e "${CYAN}Build & Dependencies:${NC}"
        echo "20. Install All Dependencies"
        echo "21. Build Applications"
        echo "22. Update Dependencies"
        echo
        echo -e "${CYAN}Debug & Troubleshooting:${NC}"
        echo "23. Debug Menu"
        echo "24. View Logs"
        echo "25. System Resource Monitor"
        echo
        echo -e "${CYAN}Remote Access:${NC}"
        echo "26. Remote Access Management"
        echo
        echo -e "${CYAN}Server Services:${NC}"
        echo "27. Server Services Management"
        echo
        echo -e "${CYAN}System Management:${NC}"
        echo "28. System Management"
        echo "29. SSH Management"
        echo "30. Nginx Management"
        echo
        echo -e "${CYAN}Security & Monitoring:${NC}"
        echo "31. Dependencies & Security"
        echo "32. Hardware Monitor"
        echo "33. User Management"
        echo "34. Cron & Systemd"
        echo
        echo -e "${CYAN}Utilities:${NC}"
        echo "35. Export Changes Log"
        echo "36. Quick Setup Guide"
        echo "0. Exit"
        echo
        read -p "Select option: " choice
        
        case $choice in
            1) start_development ;;
            2) start_production ;;
            3) start_backend_only ;;
            4) stop_all_services ;;
            5) restart_all_services ;;
            6) show_service_status ;;
            7) start_backend ;;
            8) stop_backend ;;
            9) restart_backend ;;
            10) start_frontend ;;
            11) stop_frontend ;;
            12) restart_frontend ;;
            13) run_health_check ;;
            14) check_database ;;
            15) check_api_health ;;
            16) check_webhook_health ;;
            17) test_webhook ;;
            18) install_all_dependencies ;;
            19) build_applications ;;
            20) update_dependencies ;;
            21) debug_menu ;;
            22) view_logs ;;
            23) system_resource_monitor ;;
            24) manage_remote_access ;;
            25) manage_server_services ;;
            26) system_management_menu ;;
            27) ssh_management_menu ;;
            28) nginx_management_menu ;;
            29) security_menu ;;
            30) hardware_monitor_menu ;;
            31) user_management_menu ;;
            32) cron_systemd_menu ;;
            33) export_changes_log ;;
            34) quick_setup_guide ;;
            0) 
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        echo
        read -p "Press Enter to continue..."
    done
}

# Function to start development
start_development() {
    log_action "Starting development environment"
    set_permissions
    start_backend
    sleep 3
    start_frontend
    echo -e "${GREEN}✓ Development environment started${NC}"
}

# Function to start production
start_production() {
    log_action "Starting production environment"
    set_permissions
    build_applications
    if command_exists pm2; then
        cd "$BACKEND_DIR"
        pm2 start ecosystem.config.js --env production
        pm2 save
        echo -e "${GREEN}✓ Production environment started with PM2${NC}"
    else
        echo -e "${RED}✗ PM2 not installed. Install with: npm install -g pm2${NC}"
    fi
}

# Function to start backend only
start_backend_only() {
    log_action "Starting backend only"
    set_permissions
    start_backend
    echo -e "${GREEN}✓ Backend started${NC}"
}

# Function to stop all services
stop_all_services() {
    log_action "Stopping all services"
    stop_backend
    stop_frontend
    if command_exists pm2; then
        pm2 stop all 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ All services stopped${NC}"
}

# Function to restart all services
restart_all_services() {
    log_action "Restarting all services"
    stop_all_services
    sleep 3
    start_development
    echo -e "${GREEN}✓ All services restarted${NC}"
}

# Function to install all dependencies
install_all_dependencies() {
    log_action "Installing all dependencies"
    set_permissions
    
    if [[ -d "$FRONTEND_DIR" ]]; then
        echo -e "${BLUE}Installing frontend dependencies...${NC}"
        cd "$FRONTEND_DIR"
        npm install
    fi
    
    if [[ -d "$BACKEND_DIR" ]]; then
        echo -e "${BLUE}Installing backend dependencies...${NC}"
        cd "$BACKEND_DIR"
        npm install
    fi
    
    echo -e "${GREEN}✓ All dependencies installed${NC}"
}

# Function to build applications
build_applications() {
    log_action "Building applications"
    set_permissions
    
    if [[ -d "$FRONTEND_DIR" ]]; then
        echo -e "${BLUE}Building frontend...${NC}"
        cd "$FRONTEND_DIR"
        npm run build
    fi
    
    if [[ -d "$BACKEND_DIR" ]]; then
        echo -e "${BLUE}Building backend...${NC}"
        cd "$BACKEND_DIR"
        npm run build
    fi
    
    echo -e "${GREEN}✓ Applications built successfully${NC}"
}

# Function to update dependencies
update_dependencies() {
    log_action "Updating dependencies"
    
    if [[ -d "$FRONTEND_DIR" ]]; then
        echo -e "${BLUE}Updating frontend dependencies...${NC}"
        cd "$FRONTEND_DIR"
        npm update
    fi
    
    if [[ -d "$BACKEND_DIR" ]]; then
        echo -e "${BLUE}Updating backend dependencies...${NC}"
        cd "$BACKEND_DIR"
        npm update
    fi
    
    echo -e "${GREEN}✓ Dependencies updated${NC}"
}

# Function to view logs
view_logs() {
    echo -e "${WHITE}=== LOG VIEWER ===${NC}"
    echo "1. Backend logs"
    echo "2. Frontend logs"
    echo "3. PM2 logs"
    echo "4. System logs"
    echo "5. Nginx logs"
    echo "0. Back"
    echo
    read -p "Select option: " choice
    
    case $choice in
        1) 
            if command_exists pm2; then
                pm2 logs marin-pest-control-backend
            else
                tail -f "$LOGS_DIR/backend.log" 2>/dev/null || echo "No backend logs found"
            fi
            ;;
        2) tail -f "$LOGS_DIR/frontend.log" 2>/dev/null || echo "No frontend logs found" ;;
        3) pm2 logs 2>/dev/null || echo "PM2 not running" ;;
        4) sudo journalctl -f ;;
        5) sudo tail -f /var/log/nginx/error.log ;;
        0) return ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
}

# Placeholder functions for additional menus (to be implemented)
debug_menu() {
    echo -e "${YELLOW}Debug menu - To be implemented${NC}"
}

system_management_menu() {
    echo -e "${YELLOW}System management menu - To be implemented${NC}"
}

ssh_management_menu() {
    echo -e "${YELLOW}SSH management menu - To be implemented${NC}"
}

nginx_management_menu() {
    echo -e "${YELLOW}Nginx management menu - To be implemented${NC}"
}

security_menu() {
    echo -e "${YELLOW}Security menu - To be implemented${NC}"
}

hardware_monitor_menu() {
    echo -e "${YELLOW}Hardware monitor menu - To be implemented${NC}"
}

user_management_menu() {
    echo -e "${YELLOW}User management menu - To be implemented${NC}"
}

cron_systemd_menu() {
    echo -e "${YELLOW}Cron & Systemd menu - To be implemented${NC}"
}

export_changes_log() {
    echo -e "${BLUE}Exporting changes log...${NC}"
    if [[ -f "$CHANGES_LOG" ]]; then
        cp "$CHANGES_LOG" "$PROJECT_ROOT/changes-export-$(date +%Y%m%d-%H%M%S).txt"
        echo -e "${GREEN}✓ Changes log exported${NC}"
        cat "$CHANGES_LOG"
    else
        echo -e "${YELLOW}No changes log found${NC}"
    fi
}

quick_setup_guide() {
    echo -e "${WHITE}=== QUICK SETUP GUIDE ===${NC}"
    echo
    echo "1. Install system dependencies:"
    echo "   sudo apt update && sudo apt install -y nodejs npm git curl"
    echo
    echo "2. Install PM2 globally:"
    echo "   npm install -g pm2"
    echo
    echo "3. Set up environment variables:"
    echo "   cp backend/env-template.txt backend/.env"
    echo "   cp frontend/env.example frontend/.env"
    echo
    echo "4. Install project dependencies:"
    echo "   ./manage.sh (option 18)"
    echo
    echo "5. Run health check:"
    echo "   ./manage.sh (option 13)"
    echo
    echo "6. Start development:"
    echo "   ./manage.sh (option 1)"
    echo
}

# Main execution
main() {
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        echo -e "${RED}This script should not be run as root${NC}"
    #    exit 1
    fi
    
    # Create necessary directories
    mkdir -p "$LOGS_DIR"
    mkdir -p "$PROJECT_ROOT/docs"
    
    # Set proper permissions
    set_permissions
    
    # Check requirements
    check_requirements
    
    # Start main menu
    main_menu
}

# Run main function
main "$@"
