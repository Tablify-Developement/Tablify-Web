#!/bin/bash

# This script sets up the VPS for running the Tablify application
# Run as root on a fresh Ubuntu 22.04 LTS server

# Exit on any error
set -e

# Update package lists
echo "Updating package lists..."
apt-get update

# Install necessary packages
echo "Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    fail2ban \
    unattended-upgrades

# Setup automatic security updates
echo "Setting up automatic security updates..."
dpkg-reconfigure --priority=low unattended-upgrades

# Configure firewall
echo "Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
echo "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Add Docker repository for Debian properly
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update packages and install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create a non-root user for running the application
echo "Creating application user..."
useradd -m -s /bin/bash tablify
usermod -aG docker tablify

# Create application directory
echo "Creating application directory..."
mkdir -p /opt/tablify
chown tablify:tablify /opt/tablify

# Setup Nginx for reverse proxy (optional)
read -p "Would you like to install Nginx as a reverse proxy? (y/n): " install_nginx
if [[ $install_nginx =~ ^[Yy]$ ]]; then
    echo "Installing Nginx..."
    apt-get install -y nginx

    # Create Nginx configuration
    cat > /etc/nginx/sites-available/tablify <<EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable the site
    ln -s /etc/nginx/sites-available/tablify /etc/nginx/sites-enabled/

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default

    # Test Nginx configuration
    nginx -t

    # Restart Nginx
    systemctl restart nginx

    echo "Would you like to setup HTTPS with Let's Encrypt? (y/n): "
    read setup_ssl
    if [[ $setup_ssl =~ ^[Yy]$ ]]; then
        apt-get install -y certbot python3-certbot-nginx
        echo "Please enter your domain name: "
        read domain_name
        certbot --nginx -d $domain_name
    fi
fi

echo "VPS setup completed successfully!"
echo "Now you can deploy your application to /opt/tablify directory."