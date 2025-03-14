"use strict";(self.webpackChunkpicstome_docs=self.webpackChunkpicstome_docs||[]).push([[777],{4118:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>d,contentTitle:()=>l,default:()=>a,frontMatter:()=>t,metadata:()=>r,toc:()=>c});const r=JSON.parse('{"id":"install","title":"Installation","description":"Easy Setup Guide for Your Own Server","source":"@site/docs/install.md","sourceDirName":".","slug":"/install","permalink":"/docs/install","draft":false,"unlisted":false,"tags":[],"version":"current","frontMatter":{},"sidebar":"tutorialSidebar","previous":{"title":"About","permalink":"/docs/about"}}');var o=s(4848),i=s(8453);const t={},l="Installation",d={},c=[{value:"Easy Setup Guide for Your Own Server",id:"easy-setup-guide-for-your-own-server",level:2},{value:"Step 1: Get a Server (VPS)",id:"step-1-get-a-server-vps",level:2},{value:"Step 2: Connect Your Domain to Your Server",id:"step-2-connect-your-domain-to-your-server",level:2},{value:"Step 3: Connect to Your Server",id:"step-3-connect-to-your-server",level:2},{value:"On Windows:",id:"on-windows",level:3},{value:"On Mac or Linux:",id:"on-mac-or-linux",level:3},{value:"Step 4: Install Picstome",id:"step-4-install-picstome",level:2},{value:"Step 5: Log In to Your New Picstome Site",id:"step-5-log-in-to-your-new-picstome-site",level:2},{value:"Troubleshooting",id:"troubleshooting",level:2},{value:"Can&#39;t see your site yet?",id:"cant-see-your-site-yet",level:3},{value:"Installation errors?",id:"installation-errors",level:3},{value:"Need more help?",id:"need-more-help",level:3}];function h(e){const n={a:"a",blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.header,{children:(0,o.jsx)(n.h1,{id:"installation",children:"Installation"})}),"\n",(0,o.jsx)(n.h2,{id:"easy-setup-guide-for-your-own-server",children:"Easy Setup Guide for Your Own Server"}),"\n",(0,o.jsx)(n.p,{children:"This guide will help you install Picstome on your own server, even if you're not a technical expert."}),"\n",(0,o.jsx)(n.h2,{id:"step-1-get-a-server-vps",children:"Step 1: Get a Server (VPS)"}),"\n",(0,o.jsx)(n.p,{children:"You need a server to host Picstome. We recommend Contabo for its excellent price/value."}),"\n",(0,o.jsxs)(n.ol,{children:["\n",(0,o.jsxs)(n.li,{children:["Go to ",(0,o.jsx)(n.a,{href:"https://contabo.com/",children:"Contabo"})," and sign up"]}),"\n",(0,o.jsxs)(n.li,{children:["Select ",(0,o.jsx)(n.strong,{children:"Storage VPS 1"})," (this includes 600GB SSD - perfect for storing photos)"]}),"\n",(0,o.jsxs)(n.li,{children:["Important: Choose ",(0,o.jsx)(n.strong,{children:"Ubuntu 24.04"})," as your operating system"]}),"\n",(0,o.jsx)(n.li,{children:"Complete your purchase"}),"\n"]}),"\n",(0,o.jsxs)(n.blockquote,{children:["\n",(0,o.jsxs)(n.p,{children:["\ud83d\udca1 ",(0,o.jsx)(n.strong,{children:"Alternative providers"}),": DigitalOcean, Linode, or Vultr also work well."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h2,{id:"step-2-connect-your-domain-to-your-server",children:"Step 2: Connect Your Domain to Your Server"}),"\n",(0,o.jsx)(n.p,{children:"You'll need a domain name that points to your server."}),"\n",(0,o.jsxs)(n.ol,{children:["\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Find your server's IP address"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:"Check the welcome email from your hosting provider"}),"\n",(0,o.jsxs)(n.li,{children:["The IP address looks like ",(0,o.jsx)(n.code,{children:"123.45.67.89"})]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:(0,o.jsx)(n.strong,{children:"Point your domain to this IP address"})}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:"Log in to your domain provider (GoDaddy, Namecheap, etc.)"}),"\n",(0,o.jsx)(n.li,{children:'Find the DNS settings or "Manage DNS" section'}),"\n",(0,o.jsxs)(n.li,{children:["Add an ",(0,o.jsx)(n.strong,{children:"A record"})," with these settings:","\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Host/Name"}),": Use ",(0,o.jsx)(n.code,{children:"@"})," for your main domain or enter ",(0,o.jsx)(n.code,{children:"picstome"})," for a subdomain"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Points to/Value"}),": Your server's IP address"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"TTL"}),': Use default or "1 hour"']}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.blockquote,{children:["\n",(0,o.jsxs)(n.p,{children:["\u23f1\ufe0f ",(0,o.jsx)(n.strong,{children:"Note"}),": DNS changes can take 15 minutes to a few hours to work."]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h2,{id:"step-3-connect-to-your-server",children:"Step 3: Connect to Your Server"}),"\n",(0,o.jsx)(n.p,{children:"Next, you'll need to access your server to run the installation."}),"\n",(0,o.jsx)(n.h3,{id:"on-windows",children:"On Windows:"}),"\n",(0,o.jsxs)(n.ol,{children:["\n",(0,o.jsxs)(n.li,{children:["Download and install ",(0,o.jsx)(n.a,{href:"https://www.putty.org/",children:"PuTTY"})]}),"\n",(0,o.jsxs)(n.li,{children:["Open PuTTY and enter:","\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Host Name"}),": Your server's IP address"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Port"}),": 22"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Connection type"}),": SSH"]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:['Click "Open" and enter your login details when prompted',"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Username"}),": root"]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Password"}),": (the password from your hosting provider)"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,o.jsx)(n.h3,{id:"on-mac-or-linux",children:"On Mac or Linux:"}),"\n",(0,o.jsxs)(n.ol,{children:["\n",(0,o.jsx)(n.li,{children:"Open the Terminal app"}),"\n",(0,o.jsxs)(n.li,{children:["Type: ",(0,o.jsx)(n.code,{children:"ssh root@YOUR_SERVER_IP"})," (replace ",(0,o.jsx)(n.code,{children:"YOUR_SERVER_IP"})," with your actual IP)"]}),"\n",(0,o.jsx)(n.li,{children:"Enter your password when prompted"}),"\n"]}),"\n",(0,o.jsxs)(n.blockquote,{children:["\n",(0,o.jsxs)(n.p,{children:["\ud83d\udd11 ",(0,o.jsx)(n.strong,{children:"First time login"}),": You might be asked to change the password. Create a strong password and save it somewhere secure!"]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h2,{id:"step-4-install-picstome",children:"Step 4: Install Picstome"}),"\n",(0,o.jsx)(n.p,{children:"Once you're connected to your server, installation is simple:"}),"\n",(0,o.jsxs)(n.ol,{children:["\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:"Copy and paste this command exactly as shown:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-bash",children:"curl -fsSL https://picstome.com/install.sh | sh\n"})}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsxs)(n.p,{children:["When asked, type ",(0,o.jsx)(n.code,{children:"y"})," to confirm installation"]}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:"Enter your domain name when prompted"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:["If you're using a main domain, enter: ",(0,o.jsx)(n.code,{children:"yourdomain.com"})]}),"\n",(0,o.jsxs)(n.li,{children:["If you're using a subdomain, enter: ",(0,o.jsx)(n.code,{children:"picstome.yourdomain.com"})]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:"Wait for installation to complete (about 5-10 minutes)"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:"The script automatically installs everything needed"}),"\n",(0,o.jsx)(n.li,{children:"Sets up security with HTTPS"}),"\n",(0,o.jsx)(n.li,{children:"Configures your site to work correctly"}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.blockquote,{children:["\n",(0,o.jsxs)(n.p,{children:["\ud83d\uded1 ",(0,o.jsx)(n.strong,{children:"Important"}),": Make sure your domain is pointing to your server IP before running this step!"]}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h2,{id:"step-5-log-in-to-your-new-picstome-site",children:"Step 5: Log In to Your New Picstome Site"}),"\n",(0,o.jsx)(n.p,{children:"Once installation completes:"}),"\n",(0,o.jsxs)(n.ol,{children:["\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:"Open your web browser and go to your domain:"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"https://yourdomain.com\n"})}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsx)(n.p,{children:"Log in with these temporary credentials:"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Email"}),": ",(0,o.jsx)(n.code,{children:"admin@example.com"})]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Password"}),": ",(0,o.jsx)(n.code,{children:"password"})]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.li,{children:["\n",(0,o.jsxs)(n.p,{children:[(0,o.jsx)(n.strong,{children:"Immediately"})," change your password:"]}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:"Go to Settings \u2192 Profile"}),"\n",(0,o.jsx)(n.li,{children:"Create a strong password"}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,o.jsxs)(n.blockquote,{children:["\n",(0,o.jsx)(n.p,{children:"\ud83c\udf89 Congratulations! Your Picstome site is now ready to use!"}),"\n"]}),"\n",(0,o.jsx)(n.hr,{}),"\n",(0,o.jsx)(n.h2,{id:"troubleshooting",children:"Troubleshooting"}),"\n",(0,o.jsx)(n.h3,{id:"cant-see-your-site-yet",children:"Can't see your site yet?"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"DNS propagation"}),": It might take a few hours for your domain to connect to your server. Try again later."]}),"\n",(0,o.jsxs)(n.li,{children:[(0,o.jsx)(n.strong,{children:"Check the domain"}),": Make sure you typed the domain exactly as configured in DNS settings."]}),"\n"]}),"\n",(0,o.jsx)(n.h3,{id:"installation-errors",children:"Installation errors?"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:"Ensure your server is running Ubuntu 24.04"}),"\n",(0,o.jsx)(n.li,{children:"Check that your domain is correctly pointing to your server's IP address"}),"\n",(0,o.jsx)(n.li,{children:"Make sure you have the correct permissions (you should be logged in as root)"}),"\n"]}),"\n",(0,o.jsx)(n.h3,{id:"need-more-help",children:"Need more help?"}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsxs)(n.li,{children:["Visit our ",(0,o.jsx)(n.a,{href:"https://picstome.com/docs",children:"documentation"})]}),"\n"]})]})}function a(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(h,{...e})}):h(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>t,x:()=>l});var r=s(6540);const o={},i=r.createContext(o);function t(e){const n=r.useContext(i);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:t(e.components),r.createElement(i.Provider,{value:n},e.children)}}}]);