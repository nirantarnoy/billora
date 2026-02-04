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
echo "[1/6] Updating system packages..."
dnf update -y

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

# 5. Install MySQL/MariaDB Client
# Required for the system's Auto Backup feature (mysqldump)
echo "[5/6] Installing MySQL/MariaDB Client..."
dnf install mariadb -y

# 6. Install PM2 (Process Manager)
# Recommended for running Node.js apps in production
echo "[6/6] Installing PM2 (Process Manager)..."
npm install -g pm2

# Setup Firewall (Optional - opens port 3000)
# echo "Configuring Firewall..."
# firewall-cmd --permanent --add-port=3000/tcp
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
