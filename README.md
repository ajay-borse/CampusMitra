# 🎓 CampusMitra — Full-Stack Campus Social & Networking Platform

> **Tagline:** "Find Your People. Find Your Vibe."  
> **Disclaimer:** CampusMitra is an independent student project created for campus networking, academic project collaboration, and social discovery. It is **not** an official MIT World Peace University (MIT-WPU) service or university-endorsed platform.

---

## 📌 Project Overview

**CampusMitra** is a full-stack **MERN** application designed for students to connect over shared academic interests, hackathons, coding projects, and campus life.

Built with a **React (Vite)** frontend and a **Node.js + Express + MongoDB** backend with **Socket.IO** real-time messaging, CampusMitra transforms student networking into a modern, tactile, and safe experience while also housing a complete, interview-ready **Student Directory CRUD API**.

---

## ✨ Key Features

### 1. 🛡️ University Verification & Safety
- **Strict Domain Validation:** Registration is restricted to `@mitwpu.edu.in` student email addresses on both frontend and backend.
- **Age-Gated Dating Guardrail:** Age is computed server-side from Date of Birth. Romantic dating features require students to be **18+**; students under 18 can freely use study groups, project partnerships, and friendship circles.
- **Moderation & Safety:** Built-in reporting system (`/api/moderation/reports`), blocking system (`/api/moderation/blocks`), and an administrative console with audit logs.

### 2. 🎴 Tactile Profile Discovery Deck
- **Zero-Fake Data Guarantee:** Every profile, photo, and match percentage comes directly from MongoDB queries and deterministic compatibility calculations.
- **Dynamic Matching Engine:** Evaluates shared taxonomy interests, academic departments, graduation year, and study goals to compute a 0–100% compatibility score.
- **Interactive Gestures:** Tactile swipe-right ("Interested" 💜) and swipe-left ("Pass" ✕) with smooth spring transitions and status stamps.

### 3. 💫 Real Mutual Matches & Celebrations
- **No Unsolicited Spam:** Conversations can only be initiated when both students have expressed mutual interest.
- **Real-Time Match Modal:** Triggers a confetti celebration and soundless animated modal via Socket.IO `match_celebration` event.

### 4. 💬 Live Campus Messenger (Socket.IO)
- Real-time peer-to-peer chat with typing indicators (`user_typing`), active conversation selection, timestamping, and quick campus prompts ("Chai break? ☕", "Hackathon prep 🚀", "Library study 📚").

### 5. 📷 6-Photo Complete Profiles
- 6-slot photo gallery supporting photo uploads via **Multer** (`POST /api/profiles/me/photos`), photo deletion, and primary photo highlights.
- Real-time profile completion score (0% -> 100%) celebrating milestones with celebratory confetti.

### 6. 🛡️ Admin & Safety Console
- Dedicated administrator dashboard displaying real database aggregates (total registered students, verified emails, mutual matches, completed profiles, and safety reports).
- Actionable account suspension/reactivation and report resolution.

### 7. 🎓 Preserved Student Directory (MERN CRUD)
- Fully functional student registry (`/api/students`) with Create, Read, Update, Delete, live search filtering, and seamless in-memory fallback for interview demos.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, Vite, Vanilla CSS | Reactive UI, glassmorphic dark design system, micro-interactions, swipe deck |
| **Real-Time** | Socket.IO Client & Server (`^4.8`) | Real-time chat messages, typing events, mutual match celebrations |
| **Backend** | Node.js, Express (`^5.x`) | REST API routing, controllers, authentication middleware, Multer file handling |
| **Database** | MongoDB & Mongoose (`^9.x`) | Document database, compound indexing, population, dynamic aggregation |
| **Auth & Security** | JWT (`jsonwebtoken`), bcryptjs | Stateless bearer tokens, salted password hashing, university domain validation |
| **File Storage** | Multer | Multipart/form-data image uploads stored in `/uploads` with static express serving |

---

## 📁 Repository Directory Structure

```text
student-api/
├── client/                               # React 19 Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # Header with live badges & tab routing
│   │   │   ├── LandingView.jsx           # Unauthenticated landing page
│   │   │   ├── HomeView.jsx              # Dashboard with real counters & recommendations
│   │   │   ├── DiscoverView.jsx          # Tactile swipe card deck
│   │   │   ├── ConnectionsView.jsx       # Accepted connections & study buddies
│   │   │   ├── ChatView.jsx              # Real-time messenger with Socket.IO
│   │   │   ├── ProfileView.jsx           # 6-slot photo editor & academic fields
│   │   │   ├── AdminView.jsx             # Admin metrics, user moderation & audit logs
│   │   │   ├── StudentDirectoryView.jsx  # Student Directory CRUD dashboard
│   │   │   ├── AuthModal.jsx             # University login & registration modal
│   │   │   ├── MatchModal.jsx            # Celebratory mutual match modal
│   │   │   ├── OnboardingModal.jsx       # Campus tour journey
│   │   │   ├── NotificationsDrawer.jsx   # Slide-out real-time notifications
│   │   │   ├── EditStudentModal.jsx      # Student edit modal
│   │   │   └── DeleteConfirmModal.jsx    # Student deletion confirm modal
│   │   ├── services/
│   │   │   ├── campusApi.js              # REST client for all CampusMitra endpoints
│   │   │   ├── socket.js                 # Socket.IO client instance
│   │   │   └── api.js                    # REST client for Student Directory CRUD
│   │   ├── utils/
│   │   │   └── confetti.js               # Canvas confetti particle generator
│   │   ├── App.jsx                       # Root application orchestrator
│   │   └── index.css                     # Premium dark glassmorphic stylesheet
│   └── package.json
│
├── src/                                  # Express Backend
│   ├── config/
│   │   └── db.js                         # Mongoose connection & status checker
│   ├── controllers/
│   │   ├── authController.js             # Register, login, getMe, verifyEmail
│   │   ├── profileController.js          # Profile update, Multer photo upload/delete
│   │   ├── discoverController.js         # Peer recommendations & matching calculation
│   │   ├── connectionController.js       # Interest, pass, mutual match auto-trigger
│   │   ├── chatController.js             # Conversations, message history, send message
│   │   ├── notificationController.js     # Unread alerts & markAllRead
│   │   ├── moderationController.js       # User block & user report
│   │   ├── adminController.js            # Aggregation metrics, user bans, audit logs
│   │   └── studentController.js          # Preserved Student CRUD controller
│   ├── middleware/
│   │   ├── authMiddleware.js             # JWT bearer verification & requireAdmin
│   │   ├── dbCheck.js                    # 503 guard if MongoDB is unavailable
│   │   ├── uploadMiddleware.js           # Multer diskStorage for 6 profile photos
│   │   └── errorHandler.js               # Centralized Express error handler
│   ├── models/
│   │   ├── User.js                       # Account credentials & @mitwpu.edu.in validation
│   │   ├── Profile.js                    # 6-slot photos, bio, interests, lookingFor
│   │   ├── Connection.js                 # Compound indexed peer connections
│   │   ├── Conversation.js               # Participant references & lastMessage
│   │   ├── Message.js                    # Chat messages with readBy tracking
│   │   ├── Notification.js               # In-app alerts
│   │   ├── Block.js                      # Moderation blocks
│   │   ├── Report.js                     # Moderation safety reports
│   │   ├── AuditLog.js                   # Admin security audit trails
│   │   └── studentModel.js               # Student CRUD schema
│   ├── routes/                           # Modular Express routes
│   ├── scripts/
│   │   └── seed.js                       # Database seed script for test accounts
│   ├── sockets/
│   │   └── chatSocket.js                 # Socket.IO connection & messaging handler
│   ├── utils/
│   │   ├── matchingEngine.js             # Dynamic compatibility calculation
│   │   └── token.js                      # JWT generation helper
│   └── server.js                         # Express + HTTP + Socket.IO server initialization
│
├── uploads/                              # Uploaded profile photos
├── .env                                  # Environment configuration
└── README.md
```

---

## 📡 REST API Reference

**Base URL:** `http://localhost:5000`

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new student (`@mitwpu.edu.in` required) | No |
| `POST` | `/api/auth/login` | Log in student & return JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated student profile | Yes (Bearer) |
| `GET` | `/api/auth/verify-email/:token` | Verify student email address | No |

### Profiles (`/api/profiles`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/profiles/me` | Retrieve current student's full profile | Yes |
| `PUT` | `/api/profiles/me` | Update bio, program, graduationYear, lookingFor, interests | Yes |
| `POST` | `/api/profiles/me/photos` | Upload a photo (Multer, max 6) | Yes |
| `DELETE` | `/api/profiles/me/photos` | Delete photo by index | Yes |
| `PUT` | `/api/profiles/me/photos/reorder` | Reorder photo slots (slot 0 = primary) | Yes |

### Discovery & Connections (`/api/discover`, `/api/connections`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/discover` | Fetch unswiped candidates with computed compatibility | Yes |
| `POST` | `/api/connections/interest` | Swipe right (records interest, detects mutual match) | Yes |
| `POST` | `/api/connections/pass` | Swipe left (passes on candidate) | Yes |
| `GET` | `/api/connections` | Get accepted mutual connections & study buddies | Yes |

### Real-Time Chat & Notifications (`/api/conversations`, `/api/notifications`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/conversations` | Get conversations with real unread counts & peer info | Yes |
| `GET` | `/api/conversations/:id/messages` | Get message history (marks messages as read) | Yes |
| `POST` | `/api/conversations/:id/messages` | Send message (emits `new_message` to Socket.IO) | Yes |
| `GET` | `/api/notifications` | Fetch student notification alerts | Yes |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read | Yes |

### Safety & Admin (`/api/moderation`, `/api/admin`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/moderation/blocks` | Block a user | Yes |
| `POST` | `/api/moderation/reports` | Submit safety report against a user | Yes |
| `GET` | `/api/admin/metrics` | Real MongoDB aggregate platform metrics | Yes (Admin) |
| `GET` | `/api/admin/users` | List all registered students | Yes (Admin) |
| `PUT` | `/api/admin/users/:id/status` | Suspend or reactivate student account | Yes (Admin) |
| `GET` | `/api/admin/reports` | List pending student reports | Yes (Admin) |
| `PUT` | `/api/admin/reports/:id` | Resolve or dismiss report | Yes (Admin) |
| `GET` | `/api/admin/audit-logs` | Retrieve administrative security audit trail | Yes (Admin) |

### Preserved Student Directory CRUD (`/api/students`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/students` | Get all students (MongoDB or in-memory fallback) |
| `GET` | `/api/students/:id` | Get student by ID |
| `POST` | `/api/students` | Create student |
| `PUT` | `/api/students/:id` | Update student |
| `DELETE` | `/api/students/:id` | Delete student |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (bundled with Node.js)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/campusmitra`) or a **MongoDB Atlas** connection string.

### 1. Environment Configuration
Verify the root `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campusmitra
JWT_SECRET=supersecret_campusmitra_jwt_key_2026
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

*(Note: For MongoDB Atlas, set `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/campusmitra?retryWrites=true&w=majority`)*

### 2. Install Dependencies
```bash
# Root backend dependencies
npm install

# Client frontend dependencies
cd client
npm install
cd ..
```

### 3. (Optional) Seed Test Accounts
To populate your MongoDB instance with verified test student accounts:
```bash
npm run seed
```
This creates:
- **Priya Verma**: `priya.test@mitwpu.edu.in` / `password123` (B.Tech CSE, 6 photos)
- **Aditya Kulkarni**: `aditya.test@mitwpu.edu.in` / `password123` (MCA, 6 photos)
- **Sneha Joshi**: `sneha.test@mitwpu.edu.in` / `password123` (B.Tech Robotics, 6 photos)
- **Rohan Patil**: `rohan.test@mitwpu.edu.in` / `password123` (MBA Tech, 6 photos)
- **Admin**: `admin.moderator@mitwpu.edu.in` / `adminpassword123` (Admin Role)

### 4. Running Locally
Run the backend and frontend in two separate terminals:

**Terminal 1 (Backend):**
```bash
npm run dev
# Starts server with nodemon at http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# Starts Vite dev server at http://localhost:5173
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🎓 Technical Interview / Viva Topics

### 1. How does CampusMitra prevent fake data and calculate match percentages?
Every user profile stores an array of standardized interest tags and academic details in MongoDB. When a student requests the Discover feed (`GET /api/discover`), `matchingEngine.js` calculates Jaccard similarity across shared interests, program proximity, and goal alignment to determine a genuine compatibility score (0–100%).

### 2. How is real-time mutual matching implemented with Socket.IO?
When Student A swipes right, the backend records an `interested` connection. If Student B previously swiped right on Student A, the backend detects the reciprocal interest, updates the status to `accepted`, creates a `Conversation` record, generates in-app notifications, and emits a `match_celebration` event directly to both students' Socket.IO rooms.

### 3. How does the system handle database unavailability?
In accordance with production integrity standards, the `requireDB` middleware checks the active Mongoose connection state before handling requests. If MongoDB is offline, it returns an explicit `503 Service Unavailable` with guidance to start MongoDB or provide a MongoDB Atlas URI, preventing silent failures or phantom saves. Meanwhile, the legacy Student Directory (`/api/students`) retains an in-memory fallback for standalone CRUD viva demonstrations.
