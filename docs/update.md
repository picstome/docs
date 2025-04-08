# Update

This guide will walk you through the process of updating your Picstome installation to the latest version.

## Automatic Update

We've created a simple update script that handles the entire process automatically. This is the easiest and most reliable way to update Picstome.

### Step 1: Connect to Your Server

First, connect to your server via SSH:

### On Windows:
1. Open PuTTY
2. Enter your server's IP address
3. Click "Open" and enter your login details when prompted:
   - **Username**: root
   - **Password**: (your server password)

### On Mac or Linux:
1. Open Terminal
2. Type: `ssh root@YOUR_SERVER_IP` (replace `YOUR_SERVER_IP` with your actual IP)
3. Enter your password when prompted

### Step 2: Run the Update Script

Once connected to your server, run the following command:

```bash
curl -fsSL https://picstome.com/update.sh | sh
```

This script will:
- Pull the latest code from our repository
- Update all dependencies
- Run database migrations
- Rebuild assets
- Update permissions
- Restart necessary services

### Step 3: Verify the Update

After the update completes, visit your Picstome website to verify everything is working correctly.


## Troubleshooting Update Issues

If you encounter any issues during the update process:

1. **Check the logs**: Most errors will be recorded in Laravel's log file:
   ```bash
   tail -n 100 /var/www/picstome/storage/logs/laravel.log
   ```

2. **Database errors**: If you encounter database migration errors, try:
   ```bash
   php artisan migrate:status
   ```

3. **Permission issues**: If you're seeing permission errors, run:
   ```bash
   chown -R www-data:www-data /var/www/picstome
   chmod -R 775 /var/www/picstome/storage /var/www/picstome/bootstrap/cache
   ```

4. **Check for conflicts**: If you've made local changes, you might need to resolve git conflicts:
   ```bash
   git status
   ```

## Getting Help

If you continue to experience issues with the update process:

1. Visit our [GitHub repository](https://github.com/picstome/picstome/issues) to report the issue
2. Check our [documentation](https://picstome.com/docs) for more information
3. Review our [support options](./support.md) for additional assistance

Remember to include any error messages and details about your environment when seeking help.
