# 🚂 Railway Deployment Guide - MOMANTO (Single-Service Full Stack)

Momanto is configured as a **single unified full-stack application** on Railway.
Express API and Next.js frontend both run together on one service, on a single port.

---

## ⚡ Quick Deployment Steps (10 Minutes)

### Step 1: Push Code to GitHub
Ensure all your project files are pushed to your GitHub repository:
```bash
git add .
git commit -m "Momanto ready for Railway deployment"
git push origin main
```

---

### Step 2: Create a Project on Railway
1. Go to [railway.com](https://railway.com) (or [railway.app](https://railway.app)) and login with your GitHub account.
2. Click **"+ New Project"**.
3. Select **"Deploy from GitHub repo"** and choose your `MOMANTO_INDIA` repository.

---

### Step 3: Add Database on Railway (Recommended: PostgreSQL)

On Railway, containers have an ephemeral filesystem. For production data persistence:

#### Option A (Best & 100% Automatic): Add Railway PostgreSQL
1. In your Railway project canvas, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**.
2. Railway will instantly provision PostgreSQL and automatically create a `DATABASE_URL` variable.
3. Click your **Momanto web service** → Go to the **"Variables"** tab.
4. Click **"Add Reference"** or add:
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
   *(Or simply copy the Postgres connection URL from the Postgres service and paste it as `DATABASE_URL`)*.
5. **Zero Setup Needed:** The app will automatically detect PostgreSQL, auto-create all tables (`supabase_schema.sql`), and seed all 20 planners and default celebration packages on startup!

#### Option B (Using SQLite with Railway Volume):
If you prefer using SQLite instead of PostgreSQL:
1. In your Momanto web service on Railway, go to the **"Volumes"** tab.
2. Click **"+ Add Volume"**.
3. Set the Mount Path to:
   ```
   /app/database
   ```
4. This ensures your `database/momanto.db` file is saved across redeployments.

---

### Step 4: Configure Environment Variables

In your Railway web service, open the **"Variables"** tab and add the following:

| Variable | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables optimized production mode |
| `JWT_SECRET` | `momanto-secret-key-2026-secure` | Any random secure string for tokens |
| `DATABASE_URL` | *(Reference to Railway PostgreSQL)* | Auto-creates tables & seeds planners/packages |
| `FAST2SMS_API_KEY` | *(Your Fast2SMS key from .env)* | Real SMS OTP delivery |
| `TELEGRAM_BOT_TOKEN` | *(Optional - from @BotFather)* | Instant order alerts to planners |
| `RAZORPAY_KEY_ID` | *(Optional)* | For real online payment gateway |
| `RAZORPAY_KEY_SECRET` | *(Optional)* | For real online payment gateway |

*(Note: Railway automatically provides and assigns the `PORT` variable. You do not need to set `PORT`.)*

---

### Step 5: Generate Public Domain

1. In your Momanto web service, click **"Settings"**.
2. Scroll to the **"Networking"** section.
3. Click **"Generate Domain"** (e.g. `momanto-production.up.railway.app`).
4. Update `NEXT_PUBLIC_SITE_URL` in the Variables tab to your generated URL (e.g. `https://momanto-production.up.railway.app`).

---

## 🛠️ How Railway Builds and Runs Momanto

Railway uses `railway.toml` and Nixpacks:
1. **Build Phase:** `npm install && npm run build` (builds Next.js pages)
2. **Deploy Phase:** `node backend/server.js` (starts Express + Next.js unified on Railway's `$PORT`)

---

## 🔐 Pre-Configured Planner Accounts for Testing

Once deployed, you can log in as a planner at `https://your-domain.railway.app/planner/login`:

| Email | Password | Business Name |
|---|---|---|
| `planner1@momanto.in` | `Plan@123` | Royal Events Raipur |
| `planner2@momanto.in` | `Plan@123` | Dream Celebrations |
| `planner3@momanto.in` | `Plan@123` | Elite Party Planners |

Test Customer OTP on the user side: Use code **`1234`** (or receive real SMS via Fast2SMS).
