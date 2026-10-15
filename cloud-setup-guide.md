# AmazingDeal (`amazingdeal.co.in`) - Zero-Cost Cloud Deployment Runbook

This guide details how to launch the entire **AmazingDeal** multi-tenant platform onto production cloud infrastructure with **₹0 hosting cost** from day one.

---

## Architecture Topology

| Domain / Subdomain | Target Service | Cloud Provider | Free Tier Quota |
| :--- | :--- | :--- | :--- |
| `api.amazingdeal.co.in` | Spring Boot 3.3 Container | Render (or Oracle Cloud VM) | 512MB RAM free (or 24GB on OCI) |
| `admin.amazingdeal.co.in` | Merchant Admin SPA | Cloudflare Pages | Unlimited bandwidth, Anycast Edge |
| `*.amazingdeal.co.in` | Customer Dynamic Storefronts | Cloudflare Pages | Wildcard SSL, global edge CDN |
| `media.amazingdeal.co.in` | Image Storage | Cloudflare R2 | 10GB storage, 0 egress fees |
| *Database* | PostgreSQL 16 (Tenant-Scoped) | Neon Serverless | 0.5GB compute, autosuspend |
| *Uptime Keep-Alive* | Health Check Ping | Cron-job.org / UptimeRobot | Pings `/api/v1/health` every 10 mins |

---

## Step 1: Create Free Neon Serverless PostgreSQL Database

1. Navigate to [neon.tech](https://neon.tech) and sign up with GitHub / Google.
2. Click **Create Project**:
   - **Name:** `amazingdeal`
   - **Region:** Choose closest region (e.g. `Asia Pacific (Singapore)` or `AWS US East`).
3. Under **Dashboard -> Connection Details**, select **Parameters only** or **Connection String**:
   - Note down:
     - `Host`: e.g. `ep-cool-pond-123456.us-east-2.aws.neon.tech`
     - `Database`: `amazingdeal` (or `neondb`)
     - `User`: `neondb_owner`
     - `Password`: `<your-password>`
     - `JDBC URL`: `jdbc:postgresql://<host>:5432/<db>?sslmode=require`

---

## Step 2: Push Workspace to Your GitHub Repository

From your terminal in `c:\Users\drskp\Multitenant`:

```bash
git init
git add .
git commit -m "feat: complete multi-tenant cloud e-commerce core for amazingdeal.co.in"
git branch -M main
git remote add origin https://github.com/<your-username>/amazingdeal.git
git push -u origin main
```

---

## Step 3: Deploy Backend API on Render (Free Tier)

1. Sign in to [render.com](https://render.com) using your GitHub account.
2. Click **New +** -> **Web Service** -> Select your `amazingdeal` repository.
3. Configure the service:
   - **Name:** `amazingdeal-backend`
   - **Region:** Same region as your Neon database
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Context:** `backend`
   - **Instance Type:** `Free`
   - **Health Check Path:** `/api/v1/health`
4. Under **Environment Variables**, add:
   - `SPRING_PROFILES_ACTIVE` = `cloud`
   - `DATABASE_URL` = `jdbc:postgresql://<neon-host>:5432/<db>?sslmode=require`
   - `DB_USER` = `<neon-user>`
   - `DB_PASSWORD` = `<neon-password>`
   - `JWT_SECRET` = `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`
   - `R2_ACCOUNT_ID` = `<your-cloudflare-account-id>` (optional initially)
   - `R2_ACCESS_KEY_ID` = `<your-r2-access-key>`
   - `R2_SECRET_ACCESS_KEY` = `<your-r2-secret-key>`
5. Click **Create Web Service**. Render will automatically build the multi-stage Alpine Docker image and run it.
6. Once deployed, Render provides a URL like `https://amazingdeal-backend.onrender.com`.
7. Go to **Settings -> Custom Domains**, add `api.amazingdeal.co.in`.

---

## Step 4: Configure Cloudflare DNS & Wildcard SSL for `amazingdeal.co.in`

1. In your Cloudflare Dashboard, add the domain `amazingdeal.co.in`.
2. Update nameservers at your registrar to point to Cloudflare's nameservers.
3. Under **SSL/TLS -> Overview**, set encryption mode to **Full (strict)**.
4. Under **DNS -> Records**, add the following records:
   - `api` -> CNAME -> `amazingdeal-backend.onrender.com` (Proxy status: DNS only / Proxied)
   - `admin` -> CNAME -> `amazingdeal-admin.pages.dev` (Proxy status: Proxied)
   - `*` (wildcard) -> CNAME -> `amazingdeal-storefront.pages.dev` (Proxy status: Proxied)
   - `@` -> CNAME -> `amazingdeal-storefront.pages.dev` (Proxy status: Proxied)

---

## Step 5: Deploy Frontend Admin & Storefront to Cloudflare Pages

### A. Deploy Merchant Admin (`admin.amazingdeal.co.in`)
1. In Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Select repository `amazingdeal`.
3. Set build settings:
   - **Project Name:** `amazingdeal-admin`
   - **Framework Preset:** `Vite`
   - **Root directory:** `frontend-admin`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment Variables:**
     - `VITE_API_URL` = `https://api.amazingdeal.co.in`
4. Click **Save and Deploy**.
5. Go to **Custom Domains** -> Add `admin.amazingdeal.co.in`.

### B. Deploy Customer Storefront (`*.amazingdeal.co.in`)
1. Click **Create application** -> **Pages** -> **Connect to Git**.
2. Select repository `amazingdeal`.
3. Set build settings:
   - **Project Name:** `amazingdeal-storefront`
   - **Framework Preset:** `Vite`
   - **Root directory:** `frontend-storefront`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment Variables:**
     - `VITE_API_URL` = `https://api.amazingdeal.co.in`
4. Click **Save and Deploy**.
5. Go to **Custom Domains**:
   - Add `amazingdeal.co.in`
   - Add `*.amazingdeal.co.in` (Wildcard domain routing)

---

## Step 6: Setup Cloudflare R2 (Object Storage for Images)

1. In Cloudflare Dashboard, click **R2** -> **Create bucket**:
   - **Bucket name:** `amazingdeal-media`
2. Under **Bucket Settings** -> **Custom Domains**:
   - Connect domain: `media.amazingdeal.co.in`
3. Click **Manage R2 API Tokens** -> **Create API Token**:
   - Permissions: `Object Read & Write`
   - Copy `Access Key ID`, `Secret Access Key`, and your Cloudflare `Account ID`.
   - Update these in Render's environment variables.

---

## Step 7: Zero Cold-Start Keep-Alive Ping

Render's free tier spins down containers after 15 minutes of inactivity. To keep your backend warm 24/7 with instant sub-second response times:

1. Sign up free at [cron-job.org](https://cron-job.org) or [uptimerobot.com](https://uptimerobot.com).
2. Create a recurring HTTP monitor:
   - **URL:** `https://api.amazingdeal.co.in/api/v1/health`
   - **Schedule:** Every 10 minutes
   - **Expected Status:** `200 OK`
3. Your backend stays hot and responsive 24/7/365 at zero cost!
