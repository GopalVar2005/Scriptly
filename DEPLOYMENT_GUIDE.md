# 🚀 Scriptly — Complete Deployment Guide

> **Architecture**: React frontend on Vercel + Node.js backend on Render + MongoDB Atlas
> **Time required**: ~1 hour
> **Cost**: $0 (all free tiers)

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Phase 1: MongoDB Atlas (Database)](#2-phase-1-mongodb-atlas-database)
3. [Phase 2: Push to GitHub](#3-phase-2-push-to-github)
4. [Phase 3: Deploy Backend on Render](#4-phase-3-deploy-backend-on-render)
5. [Phase 4: Deploy Frontend on Vercel](#5-phase-4-deploy-frontend-on-vercel)
6. [Phase 5: Connect Everything](#6-phase-5-connect-everything)
7. [Phase 6: Smoke Test](#7-phase-6-smoke-test)
8. [Troubleshooting](#8-troubleshooting)
9. [Post-Deployment](#9-post-deployment)

---

## 1. Pre-Deployment Checklist

Before starting, verify these are ready:

```
✅ GitHub account (you have: GopalVar2005)
✅ Git repo connected (origin: https://github.com/GopalVar2005/Scriptly.git)
✅ Groq API key (from console.groq.com)
✅ Gemini API key (from aistudio.google.com)
✅ YouTube Data API key (from console.cloud.google.com)
✅ Render account (render.com — sign up with GitHub)
✅ Vercel account (vercel.com — sign up with GitHub)
```

### Generate a Session Secret

Run this in your terminal right now and save the output — you'll need it later:

```bash
openssl rand -hex 32
```

This produces something like: `a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1`

**Save this string.** You'll use it as `SESSION_SECRET` on Render.

---

## 2. Phase 1: MongoDB Atlas (Database)

Your local `.env` uses `mongodb://localhost:27017/scriptly` — this won't work on Render.
You need a cloud MongoDB instance.

### Step 1: Create an Atlas Account

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign up (free) or log in

### Step 2: Create a Free Cluster

1. Click **"Build a Database"**
2. Select **M0 Free Tier**
3. Provider: **AWS** (or Google Cloud — doesn't matter)
4. Region: Choose the one **closest to your Render region** (typically `US East` or `Mumbai/AP South 1` for you)
5. Cluster Name: `scriptly-cluster` (or leave default)
6. Click **"Create Deployment"**

### Step 3: Create a Database User

1. You'll be prompted to create a database user
2. **Username**: `scriptly-admin` (or anything you want)
3. **Password**: Click **"Autogenerate Secure Password"**
4. **⚠️ COPY THIS PASSWORD NOW** — you can't see it again
5. Click **"Create Database User"**

### Step 4: Set Network Access

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
4. Click **"Confirm"**

> ⚠️ This allows any IP to connect. It's fine because the password protects access.
> Render's IPs change dynamically, so you need this.

### Step 5: Get Your Connection String

1. Go to **Database** → click **"Connect"** on your cluster
2. Select **"Drivers"**
3. Copy the connection string. It looks like:

```
mongodb+srv://scriptly-admin:<password>@scriptly-cluster.abc123.mongodb.net/?retryWrites=true&w=majority
```

4. **Replace `<password>`** with the password you copied in Step 3
5. **Add the database name** before the `?`:

```
mongodb+srv://scriptly-admin:YOUR_ACTUAL_PASSWORD@scriptly-cluster.abc123.mongodb.net/scriptly?retryWrites=true&w=majority
```

**Save this full connection string.** This is your `MONGO_URI`.

---

## 3. Phase 2: Push to GitHub

Your changes need to be on GitHub for Render and Vercel to pick them up.

### Step 1: Stage and Commit

Open terminal in your project root:

```bash
cd /Users/gopalvarshney/Documents/Super150/Self-Webd/ScriptlyProject/ScriptlyAdvance1.0
```

```bash
# Verify .env is NOT being tracked (should show nothing)
git status server/.env

# Add all changes
git add -A

# Verify .env is NOT staged (should NOT appear in the list below)
git diff --cached --name-only | grep ".env"
# If this prints "server/.env", run: git reset HEAD server/.env
```

### Step 2: Commit and Push

```bash
git commit -m "Production hardening: CORS, rate limiting, session store, auth guards, deployment config"
git push origin main
```

> If your branch is `master` instead of `main`, use `git push origin master`.

### Step 3: Verify on GitHub

1. Go to [https://github.com/GopalVar2005/Scriptly](https://github.com/GopalVar2005/Scriptly)
2. Verify you see `client/` and `server/` folders
3. Verify there is **NO** `server/.env` file (only `server/.env.example`)

> 🔴 **CRITICAL**: If `server/.env` appears on GitHub, your API keys are exposed!
> Immediately rotate ALL keys (Groq, Gemini, YouTube) and remove the file from git:
> ```bash
> git rm --cached server/.env
> git commit -m "Remove .env from tracking"
> git push
> ```

---

## 4. Phase 3: Deploy Backend on Render

### Step 1: Create a Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up with your **GitHub account** (easiest — auto-connects your repos)

### Step 2: Create a New Web Service

1. From the Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: **GopalVar2005/Scriptly**
3. Give it a name: `scriptly-backend` (this becomes part of your URL)

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Name** | `scriptly-backend` |
| **Region** | Same as your Atlas cluster (e.g., Oregon or Singapore) |
| **Branch** | `main` (or `master`) |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### Step 4: Set Environment Variables

In the same page, scroll down to **"Environment Variables"** and add each one:

| Key | Value |
|-----|-------|
| `MONGO_URI` | `mongodb+srv://scriptly-admin:YOUR_PASSWORD@cluster.abc123.mongodb.net/scriptly?retryWrites=true&w=majority` |
| `SESSION_SECRET` | *(the 64-char hex string you generated earlier)* |
| `GROQ_API_KEY` | *(your Groq API key)* |
| `GEMINI_API_KEY` | *(your Gemini API key)* |
| `YOUTUBE_API_KEY` | *(your YouTube Data API key)* |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` *(placeholder — you'll update this after Vercel deploy)* |

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render starts building. Watch the logs.
3. **Expected logs**:
   ```
   ==> Building...
   ==> npm install
   ==> Starting service with `npm start`
   Server running on port 10000
   DB connected successfully
   ```
4. Build takes ~2-3 minutes

### Step 6: Verify Backend is Running

Once deployed, Render gives you a URL like:
```
https://scriptly-backend.onrender.com
```

Test the health endpoint:
```
https://scriptly-backend.onrender.com/health
```

You should see:
```json
{"status":"OK","timestamp":"2026-04-22T..."}
```

**🎉 Backend is live!** Copy this URL — you'll need it for the frontend.

> ⚠️ **First load may take 30-50 seconds** — Render free tier "spins up" on first request.

---

## 5. Phase 4: Deploy Frontend on Vercel

### Step 1: Create a Vercel Account

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with your **GitHub account**

### Step 2: Import Project

1. From the Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find and import your repo: **GopalVar2005/Scriptly**

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Project Name** | `scriptly` (or whatever you want) |
| **Framework Preset** | `Vite` (Vercel auto-detects this) |
| **Root Directory** | Click **"Edit"** → type `client` → click **"Continue"** |
| **Build Command** | `npm run build` *(auto-filled)* |
| **Output Directory** | `dist` *(auto-filled)* |

### Step 4: Set Environment Variable

Expand **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://scriptly-backend.onrender.com/api` |

> ⚠️ **This is your Render backend URL + `/api`**
> Make sure there's NO trailing slash!
> ✅ `https://scriptly-backend.onrender.com/api`
> ❌ `https://scriptly-backend.onrender.com/api/`

### Step 5: Deploy

1. Click **"Deploy"**
2. Build takes ~30-60 seconds
3. Vercel gives you a URL like:
   ```
   https://scriptly-abc123.vercel.app
   ```

**🎉 Frontend is live!** Copy this URL.

---

## 6. Phase 5: Connect Everything

Now you need to tell the backend which frontend URL to accept (CORS).

### Step 1: Update ALLOWED_ORIGINS on Render

1. Go to your Render dashboard → `scriptly-backend` service
2. Click **"Environment"** tab
3. Find `ALLOWED_ORIGINS` and update it to:
   ```
   https://scriptly-abc123.vercel.app
   ```
   *(Replace with YOUR actual Vercel URL)*

   > **No trailing slash!**
   > If you have a custom domain later, add it comma-separated:
   > `https://scriptly-abc123.vercel.app,https://scriptly.com`

4. Click **"Save Changes"**
5. Render will **automatically redeploy** with the new setting

### Step 2: Wait for Redeploy

Watch the Render logs. Once you see `Server running on port ...` and `DB connected successfully`, you're ready.

---

## 7. Phase 6: Smoke Test

Test every critical flow. Open your Vercel URL in a browser.

### Test 1: Registration
1. Go to `/register`
2. Create a new account
3. ✅ Should register successfully

### Test 2: Login
1. Go to `/login`
2. Login with your credentials
3. ✅ Should redirect to `/workspace`
4. ✅ Navbar should show your email and "Sign out" button

### Test 3: Audio Recording + Transcription
1. On `/workspace`, click 🎙️ Record
2. Speak for 10-15 seconds
3. Click Stop
4. ✅ Should transcribe and show transcript

### Test 4: Summarization
1. With a transcript showing, select a mode (e.g., "First Pass")
2. Click "Summarize"
3. ✅ Should generate structured study guide

### Test 5: Save Note
1. Click "💾 Save Note"
2. ✅ Should show success banner (not an alert popup!)
3. Go to `/notes`
4. ✅ Note should appear in list

### Test 6: YouTube Processing
1. Go to `/workspace` → YouTube tab
2. Paste a YouTube URL with captions (e.g., a Khan Academy video)
3. Click "Process"
4. ✅ Should fetch transcript via captions

### Test 7: Quiz Generation
1. Open a saved note
2. Click "Generate Quiz"
3. ✅ Should generate MCQ quiz

### Test 8: Rate Limiting
1. Rapidly click "Summarize" or any AI button many times
2. ✅ After ~30 rapid requests, should see "AI request limit reached" error

### Test 9: Health Check
1. Visit: `https://scriptly-backend.onrender.com/health`
2. ✅ Should return `{"status":"OK","timestamp":"..."}`

---

## 8. Troubleshooting

### ❌ "CORS not allowed" Error in Browser Console

**Cause**: `ALLOWED_ORIGINS` on Render doesn't match your Vercel URL exactly.

**Fix**:
1. Open browser DevTools → Console
2. Look at the error — it shows the blocked origin
3. Go to Render → Environment → update `ALLOWED_ORIGINS` to match exactly
4. Common mistakes:
   - Trailing slash: `https://scriptly.vercel.app/` (remove the `/`)
   - HTTP vs HTTPS: `http://scriptly.vercel.app` (Vercel is always HTTPS)
   - Typo in the URL

---

### ❌ Login Works But Next Request Returns 401

**Cause**: Cross-origin cookies not working.

**Checklist**:
1. ✅ `ALLOWED_ORIGINS` matches Vercel URL
2. ✅ Backend has `trust proxy` set (it does — we added it)
3. ✅ Session cookie has `secure: true` and `sameSite: 'none'` (it does)
4. ✅ Frontend sends `credentials: 'include'` on fetch (it does)
5. Check browser — some browsers block third-party cookies by default:
   - **Safari**: Settings → Privacy → uncheck "Prevent cross-site tracking"
   - **Chrome**: Should work by default
   - **Firefox**: Should work by default

---

### ❌ "DB error: connect ECONNREFUSED 127.0.0.1:27017"

**Cause**: `MONGO_URI` is still set to `mongodb://localhost:27017/scriptly`.

**Fix**: Update `MONGO_URI` on Render to your Atlas connection string.

---

### ❌ Server Crashes with "Missing required environment variables"

**Cause**: One or more environment variables not set on Render.

**Fix**: Go to Render → Environment tab → verify all 7 variables are set:
`MONGO_URI`, `SESSION_SECRET`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `YOUTUBE_API_KEY`, `NODE_ENV`, `ALLOWED_ORIGINS`

---

### ❌ YouTube Audio Download Times Out (502 Error)

**Cause**: Render free tier has a 30-second proxy timeout. Audio download + transcription exceeds this for most videos.

**This is expected behavior on the free tier.**

**Impact**: Videos **with captions** work fine (2-5 second response). Videos **without captions** (audio fallback) will likely timeout.

**Options**:
1. Accept it — most educational videos have captions
2. Upgrade to Render Starter ($7/month) for configurable timeout
3. Add a note in your demo: "Works best with captioned videos"

---

### ❌ Frontend Returns 404 on Page Refresh

**Cause**: Vercel doesn't know about React Router's client-side routes.

**Fix**: We already created `client/vercel.json` with rewrites. If it's still happening:
1. Verify `vercel.json` is in the `client/` directory (not root)
2. Redeploy on Vercel

---

### ❌ Build Fails on Render: "nodemon: not found"

**Cause**: Old `package.json` still has `"start": "nodemon app.js"`.

**Fix**: We already changed this to `"start": "node app.js"`. Make sure your latest commit is pushed.

---

### ❌ "MongoStore.create is not a function"

**Cause**: `connect-mongo` v6 exports differently.

**Fix**: We already fixed this — the import is `require('connect-mongo').default`. Verify your latest code is pushed.

---

### ❌ yt-dlp Binary Errors on Render

**Cause**: Bundled macOS binary doesn't work on Linux (Render).

**Fix**: We already fixed this — the service auto-downloads the correct platform binary on first use. If it still fails, check Render logs for the specific error.

---

## 9. Post-Deployment

### Your Live URLs

After deployment, you'll have:

| Component | URL |
|-----------|-----|
| **Frontend** | `https://scriptly-abc123.vercel.app` |
| **Backend API** | `https://scriptly-backend.onrender.com/api` |
| **Health Check** | `https://scriptly-backend.onrender.com/health` |
| **Database** | MongoDB Atlas dashboard |

### Add to Your Resume/Portfolio

```
Scriptly — AI-Powered Study Assistant
Live: https://scriptly-abc123.vercel.app
GitHub: https://github.com/GopalVar2005/Scriptly

• Full-stack app: React + Node.js + Express + MongoDB
• Multi-model AI: Gemini primary + Groq fallback for 99%+ uptime
• YouTube → Captions/Audio → Whisper → AI Summarization pipeline
• Production hardened: CORS whitelist, rate limiting, MongoDB sessions, auth guards
```

### Keep Render Awake (Optional)

Render free tier sleeps after 15 minutes of inactivity. To prevent cold starts:

1. Go to [https://uptimerobot.com](https://uptimerobot.com) (free)
2. Create a new HTTP(s) monitor
3. URL: `https://scriptly-backend.onrender.com/health`
4. Interval: 5 minutes
5. This pings your server every 5 minutes, keeping it warm

### Rotate API Keys (If Exposed)

If your keys were ever pushed to GitHub:

1. **Groq**: [console.groq.com](https://console.groq.com) → API Keys → Regenerate
2. **Gemini**: [aistudio.google.com](https://aistudio.google.com) → API Keys → Create new
3. **YouTube**: [console.cloud.google.com](https://console.cloud.google.com) → Credentials → Create new key & delete old

Update the new keys on Render → Environment tab.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│           SCRIPTLY DEPLOYMENT MAP           │
├─────────────────────────────────────────────┤
│                                             │
│  User's Browser                             │
│       │                                     │
│       ▼                                     │
│  ┌─────────────┐    VITE_API_URL    ┌──────────────┐
│  │   Vercel     │ ────────────────► │    Render     │
│  │  (Frontend)  │   credentials:    │   (Backend)   │
│  │  client/     │   include         │   server/     │
│  └─────────────┘                    └──────┬───────┘
│                                            │
│                          MONGO_URI         │
│                                            ▼
│                                    ┌──────────────┐
│                                    │ MongoDB Atlas │
│                                    │   (Database)  │
│                                    └──────────────┘
│                                             │
│  Environment Variables:                     │
│  ─────────────────────                     │
│  Vercel:  VITE_API_URL                     │
│  Render:  MONGO_URI, SESSION_SECRET,       │
│           GROQ_API_KEY, GEMINI_API_KEY,    │
│           YOUTUBE_API_KEY, NODE_ENV,       │
│           ALLOWED_ORIGINS                  │
└─────────────────────────────────────────────┘
```

---

*Guide created: April 22, 2026*
*Project: Scriptly v1.0 — AI-Powered Study Assistant*
