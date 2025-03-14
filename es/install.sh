#!/bin/bash
set -e  # Exit on error

echo "🖼️  Welcome to the Picstome installer!"
echo "This script will install Picstome on your server and configure it with a custom domain and HTTPS."

read -p "Do you want to continue? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" ]]; then
    echo "❌ Installation aborted."
    exit 1
fi

# Check for Ubuntu version
if command -v lsb_release &> /dev/null; then
    UBUNTU_VERSION=$(lsb_release -rs)
    if [[ "$UBUNTU_VERSION" != "24.04" && "$UBUNTU_VERSION" != "22.04" ]]; then
        echo "⚠️ This script is optimized for Ubuntu 24.04, but may work on 22.04. Detected version: $UBUNTU_VERSION"
        read -p "Continue anyway? (y/n): " VERSION_CONFIRM
        if [[ "$VERSION_CONFIRM" != "y" ]]; then
            echo "❌ Installation aborted."
            exit 1
        fi
    fi
else
    echo "⚠️ Unable to determine Ubuntu version. This script is designed for Ubuntu 24.04."
    read -p "Continue anyway? (y/n): " VERSION_CONFIRM
    if [[ "$VERSION_CONFIRM" != "y" ]]; then
        echo "❌ Installation aborted."
        exit 1
    fi
fi

# Ensure the script is run as root
if [[ "$EUID" -ne 0 ]]; then
    echo "⚠️ Please run this script as root or using sudo."
    exit 1
fi

# Prompt for the domain name
read -p "Enter the domain name you want to use (e.g., picstome.example.com): " DOMAIN_NAME

# Validate domain name format (basic check)
if [[ ! "$DOMAIN_NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo "❌ Invalid domain name format. Please provide a valid domain name."
    exit 1
fi

echo "📦 Updating system and installing dependencies..."
apt update && apt upgrade -y
apt install -y nginx php-fpm php-sqlite3 php-cli php-mbstring php-xml php-curl php-zip \
    php-gd unzip curl git certbot python3-certbot-nginx supervisor

# Install Node.js (using NodeSource for latest LTS)
echo "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Puppeteer and its dependencies
echo "🌐 Installing Puppeteer and its dependencies..."
apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    libpangocairo-1.0-0 libcairo2 libpango-1.0-0 fonts-liberation \
    libappindicator3-1 xdg-utils

# Download and set up Picstome
echo "📥 Downloading and setting up Picstome..."
cd /var/www
if [ -d "picstome" ]; then
    echo "⚠️ Directory /var/www/picstome already exists. Backing it up..."
    mv picstome picstome_backup_$(date +%Y%m%d%H%M%S)
fi

git clone https://github.com/picstome/picstome.git picstome
cd picstome

# Install Composer
echo "🎼 Installing Composer..."
if [ ! -f "/usr/local/bin/composer" ]; then
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
fi

# Install dependencies
echo "🔧 Installing Composer and NPM dependencies..."
composer install --no-dev --optimize-autoloader
npm ci --production

# Install Puppeteer globally
npm install -g puppeteer
npx puppeteer browsers install chrome

# Configure Laravel
echo "⚙️ Configuring Laravel environment..."
cp .env.example .env
sed -i "s|APP_URL=.*|APP_URL=https://$DOMAIN_NAME|g" .env
sed -i "s|DB_CONNECTION=.*|DB_CONNECTION=sqlite|g" .env
sed -i "s|DB_DATABASE=.*|DB_DATABASE=/var/www/picstome/database/database.sqlite|g" .env

# Generate unique app key
php artisan key:generate

# Set up SQLite database
echo "🗄️ Setting up SQLite database..."
mkdir -p database
touch database/database.sqlite
php artisan migrate --force --seed
php artisan storage:link

# Build assets
echo "🏗️ Building frontend assets..."
npm run build

# Set correct permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data /var/www/picstome
chmod -R 775 /var/www/picstome/storage /var/www/picstome/bootstrap/cache
chmod -R 775 /var/www/picstome/database

# Configure Supervisor for Laravel Queue
echo "⏱️ Setting up background job processing..."
cat > /etc/supervisor/conf.d/picstome-worker.conf <<EOL
[program:picstome-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/picstome/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/picstome/storage/logs/worker.log
stopwaitsecs=3600
EOL

# Configure Supervisor for Laravel Scheduler
cat > /etc/supervisor/conf.d/picstome-scheduler.conf <<EOL
[program:picstome-scheduler]
process_name=%(program_name)s_%(process_num)02d
command=/bin/bash -c "while [ true ]; do php /var/www/picstome/artisan schedule:run --verbose --no-interaction & sleep 60; done"
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/picstome/storage/logs/scheduler.log
EOL

# Reload Supervisor to apply changes
supervisorctl reread
supervisorctl update
supervisorctl start all

# Determine PHP FPM version (for socket path)
PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
PHP_FPM_SOCK="/var/run/php/php${PHP_VERSION}-fpm.sock"

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/picstome <<EOL
server {
    listen 80;
    server_name $DOMAIN_NAME;
    root /var/www/picstome/public;
    index index.php index.html;

    client_max_body_size 50M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:${PHP_FPM_SOCK};
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Add security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'";
}
EOL

if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
fi

ln -s /etc/nginx/sites-available/picstome /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Install SSL with Let's Encrypt
echo "🔐 Setting up HTTPS with Let's Encrypt..."
certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos -m admin@$DOMAIN_NAME
systemctl reload nginx

# Set up cron for Certbot renewal
echo "0 0,12 * * * certbot renew --quiet" > /etc/cron.d/certbot-renewal

# Final instructions
echo ""
echo "✅ Installation complete!"
echo ""
echo "🌐 Visit https://$DOMAIN_NAME to access your Picstome application."
echo ""
echo "🔑 Default login credentials:"
echo "  Username: admin@example.com"
echo "  Password: password"
echo ""
echo "⚠️ IMPORTANT: Log in and change your default password immediately."
echo ""
echo "📖 For more information and documentation, visit https://picstome.com/docs"
echo ""
