# Installation

## Easy Setup Guide for Your Own Server

This guide will help you install Picstome on your own server, even if you're not a technical expert.

## Step 1: Get a Server (VPS)

You need a server to host Picstome. We recommend Contabo for its excellent price/value.

1. Go to [Contabo](https://www.dpbolvw.net/click-101387264-15239531) and sign up
2. Select **Storage VPS 1** (this includes 600GB SSD - perfect for storing photos)
3. Important: Choose **Ubuntu 24.04** as your operating system
4. Complete your purchase

> 💡 **Alternative providers**: DigitalOcean, Linode, or Vultr also work well.

---

## Step 2: Connect Your Domain to Your Server

You'll need a domain name that points to your server.

1. **Find your server's IP address**
   - Check the welcome email from your hosting provider
   - The IP address looks like `123.45.67.89`

2. **Point your domain to this IP address**
   - Log in to your domain provider (GoDaddy, Namecheap, etc.)
   - Find the DNS settings or "Manage DNS" section
   - Add an **A record** with these settings:
     - **Host/Name**: Use `@` for your main domain or enter `picstome` for a subdomain
     - **Points to/Value**: Your server's IP address
     - **TTL**: Use default or "1 hour"

> ⏱️ **Note**: DNS changes can take 15 minutes to a few hours to work.

---

## Step 3: Connect to Your Server

Next, you'll need to access your server to run the installation.

### On Windows:
1. Download and install [PuTTY](https://www.putty.org/)
2. Open PuTTY and enter:
   - **Host Name**: Your server's IP address
   - **Port**: 22
   - **Connection type**: SSH
3. Click "Open" and enter your login details when prompted
   - **Username**: root
   - **Password**: (the password from your hosting provider)

### On Mac or Linux:
1. Open the Terminal app
2. Type: `ssh root@YOUR_SERVER_IP` (replace `YOUR_SERVER_IP` with your actual IP)
3. Enter your password when prompted

> 🔑 **First time login**: You might be asked to change the password. Create a strong password and save it somewhere secure!

---

## Step 4: Install Picstome

Once you're connected to your server, installation is simple:

1. Copy and paste this command exactly as shown:
   ```bash
   curl -fsSL https://picstome.com/install.sh | sh
   ```

2. When asked, type `y` to confirm installation

3. Enter your domain name when prompted
   - If you're using a main domain, enter: `yourdomain.com`
   - If you're using a subdomain, enter: `picstome.yourdomain.com`

4. Wait for installation to complete (about 5-10 minutes)
   - The script automatically installs everything needed
   - Sets up security with HTTPS
   - Configures your site to work correctly

> 🛑 **Important**: Make sure your domain is pointing to your server IP before running this step!

---

## Step 5: Log In to Your New Picstome Site

Once installation completes:

1. Open your web browser and go to your domain:
   ```
   https://yourdomain.com
   ```

2. Log in with these temporary credentials:
   - **Email**: `admin@example.com`
   - **Password**: `password`

3. **Immediately** change your password:
   - Go to Settings → Profile
   - Create a strong password

> 🎉 Congratulations! Your Picstome site is now ready to use!

---

## Troubleshooting

### Can't see your site yet?
- **DNS propagation**: It might take a few hours for your domain to connect to your server. Try again later.
- **Check the domain**: Make sure you typed the domain exactly as configured in DNS settings.

### Installation errors?
- Ensure your server is running Ubuntu 24.04
- Check that your domain is correctly pointing to your server's IP address
- Make sure you have the correct permissions (you should be logged in as root)

### Need more help?
- Visit our [documentation](https://picstome.com/docs)
