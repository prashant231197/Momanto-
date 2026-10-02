# Step-by-Step Deployment to Railway with Custom Domain

## Prerequisites
- GitHub account with your code pushed
- Railway account (railway.app)
- Domain: momanto.in

---

## Step 1: Push Code to GitHub
1. Create a new GitHub repository
2. Push your code:
```
bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/momanto.git
git push -u origin main
```

---

## Step 2: Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) and login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your momanto repository
4. Click "Add Variable" and add:
   
```
   PORT=5000
   JWT_SECRET=anyrandomstring123
   NODE_ENV=production
   
```
5. Click "Deploy"
6. Wait for deployment → Copy your backend URL (e.g., `https://momanto-backend.up.railway.app`)

---

## Step 3: Deploy Frontend on Railway

1. In same project, click "New Service" → "GitHub Repo"
2. Select the same repository
3. Click "Add Variable" and add:
   
```
   NEXT_PUBLIC_API_URL=https://momanto-backend.up.railway.app
   NEXT_PUBLIC_SITE_URL=https://momanto.in
   
```
4. Under "Settings" → "Domains"
5. Click "Generate Domain" first (for railway.app URL)
6. Click "Add Domain" and enter: `momanto.in`
7. Click "Deploy"
8. Wait for deployment → Copy your frontend URL

---

## Step 4: Connect Your Domain (momanto.in)

### If buying domain from GoDaddy/BigRock/Cloudflare:

1. **In Railway Dashboard:**
   - Go to your frontend service
   - Settings → Domains
   - Click "Generate Domain" first
   - Copy the Railway-provided domain (e.g., `xyz.railway.app`)

2. **In Your Domain Provider (GoDaddy/BigRock):**
   - Login to your domain account
   - Go to DNS Settings
   - Add CNAME Record:
     - Name: @ or momanto
     - Value: `xyz.railway.app` (your railway domain)
   - Save

3. **Wait 5-30 minutes** for DNS to propagate

4. **In Railway:**
   - Add your custom domain `momanto.in` in the domains section
   - Enable HTTPS (Railway provides free SSL)

---

## Step 5: Update Backend CORS

1. In Railway, go to backend service
2. Add this variable:
   
```
   NEXT_PUBLIC_SITE_URL=https://momanto.in
   
```
3. Redeploy backend

---

## Step 6: Verify

1. Visit https://momanto.in
2. Test that the homepage loads
3. Test that packages load

---

## Quick Summary

| Step | Action | URL |
|------|--------|-----|
| 1 | Deploy Backend | railway.app → New Project → Backend |
| 2 | Deploy Frontend | railway.app → New Service → Frontend |
| 3 | Connect Domain | DNS settings → CNAME to railway.app |
| 4 | Add Custom Domain | Railway → Settings → Domains → momanto.in |

---

## Important Notes

- **Database Warning**: SQLite loses data on Railway redeploys. For production, upgrade to PostgreSQL.
- **Free Tier**: Railway free tier includes $5/month credit - enough for small sites.
- **SSL**: Railway provides free HTTPS certificates.
