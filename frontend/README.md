# 🎓 CampusMitra — Frontend Application

Modern React 19 + Vite frontend for the CampusMitra platform.

---

## 🚀 Quick Start

From the root project directory:

```bash
# Terminal 1: Start Backend (Port 5000)
npm run dev

# Terminal 2: Start Frontend (Port 5173)
cd frontend
npm install
npm run dev
```

Then open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 🛠️ Architecture & Tech Stack

| Layer | Library / Tool | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19 + Vite | Ultra-fast HMR and reactive component tree |
| **Routing** | React Router v7 | Protected client-side routing and history |
| **API Client** | Axios | Centralized JWT auth interceptors & timeout |
| **Real-time** | Socket.IO Client | Live messaging, typing indicators, match events |
| **Styling** | Vanilla CSS Design System | Glassmorphic dark theme, custom responsive tokens |
| **Icons & Effects** | Lucide React + Canvas Confetti | Modern UI icons & mutual match celebrations |

---

## 📁 Project Directory

```text
frontend/
├── src/
│   ├── api/             # Centralized Axios client & API endpoints
│   ├── components/      # Reusable UI (Navbar, Modals, Skeletons, Toasts)
│   ├── context/         # AuthContext, SocketContext, ToastContext
│   ├── hooks/           # Custom React hooks (useAuth, useSocket, useToast)
│   ├── layouts/         # MainLayout with header, notices & footer
│   ├── pages/           # Real pages (Dashboard, Discover, Chat, Directory, etc.)
│   ├── App.jsx          # Route definitions & protected guards
│   ├── main.jsx         # React DOM mounting
│   └── index.css        # Complete CampusMitra design system
├── .env                 # Environment variables (VITE_API_URL)
├── package.json
└── vite.config.js       # Vite proxy & dev server config
```
