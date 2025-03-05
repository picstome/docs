# Install
## How to Set Up Picstome on Your Own Server

## Step 1: Buy a VPS (Virtual Private Server)
To run Picstome, you need a VPS. We recommend Contabo for its balance of price and performance. Alternatively, you can use DigitalOcean, Linode, or any other VPS provider.

1. Go to [Contabo](https://contabo.com/) or your preferred VPS provider.
2. Choose a plan (Cloud VPS 1 with 400 GB SSD better for more storage and really cheap)
3. During the setup, select **Ubuntu 24.04** as the operating system.

---

## Step 2: Point Your Domain Name to Your VPS
You need to connect your domain (e.g., `yourdomain.com`) to your VPS's IP address.

1. **Find Your VPS IP Address**:
   - Log in to your VPS provider’s dashboard.
   - Look for the public IP address of your server (it will look like `192.168.X.X`).
   - Most times will be sent via email with the credentials to access the server.

2. **Update Your DNS Settings**:
   - Log in to your domain registrar (e.g., GoDaddy, Namecheap, Google Domains).
   - Go to the DNS settings for your domain.
   - Add an **A record**:
     - **Name**: `@` (for the root domain) or `picstome` (if using a subdomain like `picstome.example.com`).
     - **Value**: Your VPS IP address.
     - **TTL**: Leave the default or set it to 1 hour.

3. Wait for the DNS changes to propagate (this may take a few minutes to a few hours).

---

## Step 3: Access Your VPS Console
You’ll need to log into your VPS to run the installation script.

1. **Access the Console**:
   - If you’re using a desktop computer:
     - On **Windows**, open the Command Prompt.
     - On **macOS/Linux**, open the Terminal app.
   - Run the following command to connect to your VPS:
     ```bash
     ssh root@YOUR_SERVER_IP
     ```
     Replace `YOUR_SERVER_IP` with your VPS's public IP address.
   - When prompted, enter the password provided by your VPS provider.

2. If this is your first time logging in, you might be asked to change the root password. Follow the instructions to set a new password.

---

## Step 4: Run the Picstome Installation Script
Once logged into your VPS:

1. Run the following command to start the installation:
   ```bash
   curl -fsSL https://picstome.com/install.sh | sh
   ```
2. During the installation:
   - You’ll be asked to provide the domain name you want to use (e.g., `picstome.example.com`).
   - Ensure that the domain is already pointing to your VPS IP address (Step 2).

The script will:
- Install all necessary software (PHP, Node.js, Nginx, etc.).
- Set up an SSL certificate for secure connections.
- Deploy Picstome and configure it to work with your domain.

---

## Step 5: Access Your Picstome Dashboard
Once the installation is complete:
1. Open your browser and go to:
   ```
   https://yourdomain.com
   ```
   (Replace `yourdomain.com` with the domain you entered during the installation.)

2. Log in with the default credentials:
   - **Username**: `admin`
   - **Password**: `password`

3. For security, change your password immediately:
   - Go to the **Settings** page in the dashboard.
   - Update your password to something secure.

---

## Step 6: Ready to Use!
Your Picstome application is now live! 🎉

You can start uploading images, managing content, and using the full features of Picstome. If you encounter any issues, check our [documentation](https://picstome.com/) or contact support.
