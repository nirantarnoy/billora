#!/bin/bash

# Setup Script for Billora Project on AlmaLinux 9 / RHEL 9 / CentOS Stream 9
# Run this script as root or with sudo

set -e # Exit immediately if a command exits with a non-zero status

echo "========================================================"
echo "   Billora Project Setup Script for AlmaLinux 9"
echo "========================================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or use sudo"
  exit 1
fi

# 1. Update System
echo "[1/7] Updating system packages..."
dnf update -y
# Install EPEL & Git & basic tools
dnf install epel-release git -y

# 2. Install Node.js 18 (LTS)
echo "[2/6] Installing Node.js 18..."
dnf module reset nodejs -y
dnf module enable nodejs:18 -y
dnf install nodejs -y

# 3. Install Development Tools
# Necessary for compiling native modules like bcrypt and usually required for node-gyp
echo "[3/6] Installing Development Tools (gcc, g++, make)..."
dnf groupinstall "Development Tools" -y
dnf install python3 -y

# 4. Install Dependencies for 'canvas' package
# These libraries are required for the image processing features
echo "[4/6] Installing dependencies for 'canvas' (Cairo, Pango, etc.)..."
dnf install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm-devel giflib-devel -y

# 5. Install MySQL/MariaDB Server (Database)
echo "[5/8] Installing MySQL/MariaDB Server..."
dnf install mariadb mariadb-server openssl -y
systemctl enable mariadb
systemctl start mariadb

# Auto-secure MariaDB (Set Root Password if not set)
echo "Checking MariaDB security status..."
# Try to connect as root without password
if mysql -u root -e "status" >/dev/null 2>&1; then
    echo "Detected fresh MariaDB installation. Securing..."
    
    # Generate a random strong password
    DB_ROOT_PASS=$(openssl rand -base64 12)
    
    # Apply security settings
    mysql -u root <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_ROOT_PASS}';
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test_%';
FLUSH PRIVILEGES;
EOF

    echo "========================================================"
    echo "   [IMPORTANT] MariaDB Root Password Set!"
    echo "========================================================"
    echo "   Password: ${DB_ROOT_PASS}"
    echo "========================================================"
    echo "   Please save this password securely."
    echo "========================================================"
else
    echo "MariaDB is already secured (or service is not running)."
fi

# 6. Install PM2 (Process Manager)
# Recommended for running Node.js apps in production
echo "[6/8] Installing PM2 (Process Manager)..."
npm install -g pm2

# 7. Install Nginx
echo "[7/8] Installing Nginx..."
dnf install nginx -y
systemctl enable nginx
systemctl start nginx

# 8. Install Certbot (SSL)
echo "[8/8] Installing Certbot (for free SSL)..."
dnf install certbot python3-certbot-nginx -y

# Setup Firewall (Optional - opens ports)
# echo "Configuring Firewall..."
# firewall-cmd --permanent --add-port=80/tcp
# firewall-cmd --permanent --add-port=443/tcp
# firewall-cmd --permanent --add-port=3000/tcp # If you still want direct access
# firewall-cmd --reload

echo "========================================================"
echo "   Setup Complete!"
echo "========================================================"
echo "Versions installed:"
echo "Node.js: $(node -v)"
echo "NPM:     $(npm -v)"
echo "PM2:     $(pm2 -v)"
echo "MySQL:   $(mysql --version)"
echo "--------------------------------------------------------"
echo "Next steps:"
echo "1. Upload your project files to the server."
echo "2. Run 'npm install' to install project dependencies."
echo "3. Update your .env file with production database credentials."
echo "4. Start the app using PM2: 'pm2 start server.js --name billora'"
