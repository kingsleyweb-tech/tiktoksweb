# CyberMonitor GH Phishing Awareness Simulation Platform

A web application designed for organizations to run cybersecurity awareness training, social platform mock phishing simulations (Snapchat & TikTok), and video landing page gates.

The project is structured as a decoupled architecture:
- **`frontend/`**: Vite + React + Tailwind + Firebase Web SDK (Deployable to **Netlify**).
- **`backend/`**: Node.js + Express + Nodemailer + Firebase Admin SDK (Deployable to **Render**).

---

## 📁 Repository Structure

```
/
├── frontend/             # Single-page web application
│   ├── src/              # React components, pages, services
│   ├── public/           # Static assets & SPA redirection rules
│   ├── vite.config.ts    # Frontend Vite build configuration
│   └── package.json      # Frontend npm dependencies
│
├── backend/              # REST API Server
│   ├── src/
│   │   ├── server.ts     # Express entrypoint
│   │   ├── config/       # Configuration layers (Firebase Admin)
│   │   ├── routes/       # Endpoint routing (Email, SMS, Auth)
│   │   └── services/     # Business logic layers (SMTP, SMS Gateway)
│   ├── package.json      # Backend dependencies
│   └── tsconfig.json     # Node TypeScript compiler settings
│
├── package.json          # Root dev task orchestrator
├── .gitignore            # Multi-package ignore listings
└── README.md
```

---

## 🛠️ Getting Started (Local Development)

### 1. Prerequisite Installations
At the root level, install all dependencies for both directories:
```bash
npm run install:all
```

### 2. Configure Environment Variables

#### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and enter credentials:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# SMTP Configurations
SNAPCHAT_SMTP_USER=your-snapchat-gmail@gmail.com
SNAPCHAT_SMTP_PASSWORD=16-character-app-password
TIKTOK_SMTP_USER=your-tiktok-gmail@gmail.com
TIKTOK_SMTP_PASSWORD=16-character-app-password

# SMS Gateway credentials
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=your-sender-id
```

Place your Firebase `service-account.json` file in the `backend/` directory to configure password resets via Admin SDK.

#### Frontend (`frontend/.env.local`)
Copy `frontend/.env.example` to `frontend/.env.local` and configure your Firebase Web SDK config:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your-api-key
...
```

### 3. Run Dev Mode
Start both services in parallel:
```bash
npm run dev
```

The frontend will start at `http://localhost:5173` and the backend server at `http://localhost:5000`.

---

## 🚀 Production Deployment

### Frontend (Netlify)
1. Point Netlify to your GitHub repository.
2. Set the **Base Directory** to `frontend`.
3. Set the **Build Command** to `npm run build`.
4. Set the **Publish Directory** to `frontend/dist`.
5. Configure your Firebase settings and `VITE_API_URL` (pointing to your deployed backend URL) in Netlify Environment Variables.

### Backend (Render)
1. Select **Web Service** on Render.
2. Set the **Root Directory** to `backend`.
3. Set the **Build Command** to `npm install && npm run build`.
4. Set the **Start Command** to `npm start`.
5. Set environment variables on Render (SMS, SMTP, and Firebase settings).
