#!/bin/bash
set -e  # Exit on error

echo "🔄 Starting Picstome update process..."

# Ensure the script is run as root
if [[ "$EUID" -ne 0 ]]; then
    echo "⚠️ Please run this script as root or using sudo."
    exit 1
fi

# Check if we're in the correct directory
if [ ! -d "/var/www/picstome" ]; then
    echo "❌ Error: Picstome directory not found at /var/www/picstome"
    exit 1
fi

# Navigate to Picstome directory
cd /var/www/picstome

# Check if it's a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: /var/www/picstome is not a git repository"
    exit 1
fi

echo "📥 Pulling latest changes from repository..."
git pull origin main

echo "🔧 Updating Composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

echo "🏗️ Updating NPM dependencies and building assets..."
npm ci
npm run build

echo "⚙️ Running Laravel optimization commands..."
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "🗄️ Running database migrations..."
php artisan migrate --force

echo "🔄 Restarting queue workers..."
php artisan queue:restart

# Set correct permissions
echo "🔒 Updating permissions..."
chown -R www-data:www-data /var/www/picstome
chmod -R 775 /var/www/picstome/storage /var/www/picstome/bootstrap/cache

# Restart PHP-FPM
PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
echo "🔄 Restarting PHP ${PHP_VERSION}-FPM..."
systemctl restart php${PHP_VERSION}-fpm

# Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo ""
echo "✅ Update complete!"
echo "Your Picstome installation is now running the latest version."
echo ""
