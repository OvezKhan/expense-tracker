# 🚀 SpendWise — Decoupled Architecture Deployment Guide

The project is structured into two completely independent, decoupled modules:
- **`server/`**: Express REST API backend with JSON DB / MongoDB persistence.
- **`client/`**: React + Vite frontend with Lucide icons and Recharts analytics.

---

## 💻 How to Run Locally

### Running Both Frontend & Backend Concurrently (Recommended)
From the project root:
```bash
# Run both Backend (Port 5000) and Frontend (Port 3000) simultaneously
npm run dev
```

### Running Modules Independently

#### 1. Backend Server Only (Port 5000)
```bash
# Option A: From root
npm run server

# Option B: Inside server directory
cd server
npm run dev
```

#### 2. Frontend Client Only (Port 3000)
```bash
# Option A: From root
npm run client

# Option B: Inside client directory
cd client
npm run dev
```

---

## ☁️ Independent Cloud Deployment Guide

### Option 1: Deploy Backend & Frontend Separately (Traditional MERN)
1. **Backend (Render / Railway / Heroku)**:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: `PORT=5000`, `MONGODB_URI` (optional)

2. **Frontend (Vercel / Netlify)**:
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

---

### Option 2: Deploy Combined on Render / Railway
- Build Command: `npm run setup && npm run build:client`
- Start Command: `npm start`
