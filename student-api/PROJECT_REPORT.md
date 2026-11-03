# CampusMitra — Project Report

**Repository:** `student-api`  
**Reviewed:** 25 October 2026  
**Scope:** Functional and technical overview of the current repository. This report is documentation only; no application code was changed.

---

## 1. At a Glance

CampusMitra is a full-stack **MERN campus networking and community platform** for MIT World Peace University students. Its tagline is **“Find Your People. Find Your Vibe.”** It combines student discovery and mutual matching with real-time chat, campus activities, community feeds, availability broadcasting, verification, and moderation.

| Item | Summary |
|---|---|
| **Backend** | Node.js, Express 5, MongoDB/Mongoose 9, Socket.IO 4 |
| **Current frontend** | React 19, Vite 6, React Router 7, Axios, Socket.IO Client, Lucide, Canvas Confetti |
| **Legacy frontend** | React 19 + Vite single-page app in `client/` |
| **Authentication** | University-email registration, bcrypt password hashing, JWT (7 days by default) |
| **Real-time** | Chat messages, typing, mutual-match celebrations, notifications, plan updates, Radar changes |
| **Storage** | MongoDB; local disk for profile photos and private student-ID documents |
| **Backend structure** | 16 route modules, 16 controllers, 18 Mongoose models |
| **Current frontend routes** | 18 pages plus a 404 page |
| **Testing** | 10 standalone Node/HTTP/Socket.IO integration suites |

**Main student journey:** register with a university email → complete onboarding/profile → discover compatible students → express interest → get a mutual match → chat → join or create Plans, Circles, Pulse discussions, and Radar availability.

---

## 2. Technology Stack

| Layer | Technologies | Role |
|---|---|---|
| **Frontend** | React 19, Vite 6, React Router 7, Axios | Page routing, protected routes, API communication |
| **UI/UX** | Vanilla CSS design system, Lucide React, canvas-confetti | Responsive glassmorphic dark theme, icons, match celebrations |
| **Backend** | Node.js, Express 5 | REST API, middleware, file uploads, error handling |
| **Database** | MongoDB, Mongoose 9 | Persistent documents, indexes, population, aggregations |
| **Real-time** | Socket.IO 4 (server and client) | Authenticated sockets, rooms, live chat and events |
| **Auth** | JSON Web Tokens, bcryptjs | Stateless sessions and salted password hashing |
| **Files** | Multer | Six-photo profile uploads and private student-ID uploads |
| **Tooling** | nodemon, Vite | Development server and hot reload |

---

## 3. Architecture

```text
React 19 + Vite (port 5173)
        │  REST /api + Socket.IO
        ▼
Node.js + Express 5 (port 5000)
        ├── Routes → Controllers → Mongoose models → MongoDB
        ├── JWT authentication / admin authorization
        ├── Socket.IO personal and conversation rooms
        └── Local /uploads storage
```

**Backend composition**

- `src/server.js` creates the Express app and HTTP server, initializes Socket.IO, configures CORS/JSON parsing, mounts all routes, protects sensitive verification uploads, serves profile photos, and installs 404/error handlers.
- `src/routes/` contains modular route definitions; `src/controllers/` contains business logic; `src/models/` contains schemas and indexes.
- `src/middleware/authMiddleware.js` verifies Bearer tokens, rejects banned accounts, and enforces the `admin` role where required.
- `src/middleware/dbCheck.js` returns **503 Service Unavailable** for the main CampusMitra API when MongoDB is disconnected, instead of silently accepting writes.
- `src/config/db.js` connects to local MongoDB or MongoDB Atlas using `MONGODB_URI`.
- `src/sockets/chatSocket.js` authenticates sockets with JWT, joins each user to a personal room, and authorizes conversation-room access.
- `src/utils/matchingEngine.js` calculates compatibility; `src/utils/token.js` issues JWTs; notification and Vibe helpers provide shared behavior.
- `src/scripts/seed.js` creates development test accounts.

**Repository layout**

- `src/` — Express backend.
- `frontend/` — current React Router application and primary UI.
- `client/` — older single-page React frontend retained for compatibility.
- `uploads/` — profile photos; `uploads/student_ids/` — private verification documents.
- `test-*.js` — standalone integration test suites.

---

## 4. Features

### 4.1 Accounts, Profiles, and Trust

- Registration is restricted to `@mitwpu.edu.in` addresses by both the frontend and backend; allowed domains can be configured through `ALLOWED_EMAIL_DOMAINS`.
- Passwords are hashed with bcrypt before storage. Login returns a JWT with a default seven-day expiry.
- Age is calculated from the date of birth on the server. Romantic/dating discovery is restricted to users aged 18+; under-18 users retain friendship, study, and project networking.
- Onboarding is a multi-step profile flow with persisted progress. Profiles support academic details, bio, six photos, interests, hobbies, languages, goals, lifestyle, personality, story prompts, privacy settings, and a completion percentage.
- Email verification uses a one-time token. A separate **student-ID verification** workflow lets students upload an ID document for admin review; documents are excluded from public static access.
- Profile photos are validated as JPEG, PNG, or WebP and limited to 5 MB each and six photos per profile.

### 4.2 Discovery and Mutual Matching

- `GET /api/discover` returns eligible profiles while excluding the current user, blocked users, and already-swiped students.
- Filters include categories such as all/for-you, same program, study, activities, music, gaming, dating, and new, plus text search.
- The matching engine produces a weighted compatibility score:
  - Interests 25%
  - Academic program/fields 15%
  - Looking-for goals 15%
  - Languages 15%
  - Lifestyle 15%
  - Personality 15%
- Scores are normalized with a base campus-synergy value and clamped to **52–98**.
- Swiping right records interest; swiping left records a pass. Reciprocal interest creates an accepted connection, a direct conversation, notifications, and a real-time `match_celebration` event.

### 4.3 Chat and Notifications

- Direct conversations are created through mutual matches; Plans also create dedicated group conversations.
- Chat supports message history, unread counts, read tracking, typing indicators, message editing/deletion, and real-time delivery through Socket.IO.
- Direct messaging checks for blocks in either direction. Conversation access is restricted to participants.
- Notifications cover interests, matches, messages, connections, plans, circles, Pulse, reports, and verification events. They can be marked read individually, marked all read, or deleted.

### 4.4 Campus Plans

- Students can create, browse, update, join, leave, cancel, and manage time-limited campus activities.
- Plans include title, description, category, date/time, duration, capacity, location, location type, tags, and optional Circle linkage.
- Capacity is validated between 2 and 50; past dates, invalid fields, overbooking, and duplicate joins are rejected.
- Creators can update or cancel plans and remove participants. Participants can leave.
- Each Plan has a group chat, and plan changes emit a `plan_updated` socket event.

### 4.5 Campus Circles

- Public and private student communities with owner, moderator, and member roles.
- Supports creation, discovery/filtering, joining, leaving, updating, archiving, member removal, and private-circle access control.
- Each Circle has a feed with posts (text and optional media URL), reactions, comments, author editing/deletion, and owner/moderator moderation.
- Plans can be linked to a Circle, connecting community discussion with real-world meetups.

### 4.6 Campus Pulse

- A campus-wide social feed with post types: **general, question, announcement, and poll**.
- Posts can be public, Circle-scoped, or private, and can link to a Plan or Circle.
- Supports likes, bookmarks/saved posts, comments, poll voting with one vote per user, editing/deletion, and feed filters such as for-you, questions, circles, plans, bookmarks, and search.
- Private Circle content and posting permissions are enforced.

### 4.7 Campus Radar

- Lets students publish temporary availability with intentions such as Study, Coffee, Sports, Coding, Campus events, Casual conversation, or Other.
- Availability expires after a configurable **0.5–12 hours** and can be limited to `everyone` or `connections_only`.
- The Radar feed combines available peers, relevant Plans, recommended people, and shared-vibe explanations.
- Availability changes are broadcast through `radar_availability_changed`.

### 4.8 Vibe Connect

- Integrated into Chat, Connections, and Radar rather than a standalone route.
- Produces factual shared-interest explanations across interests, goals, program, and languages.
- Generates deterministic, profile-aware icebreakers with shuffle pagination and fallbacks when overlap is low.
- Offers conversation games such as Would You Rather, This or That, and Quick Questions, and can send a game prompt directly into an authorized chat.

### 4.9 Safety, Moderation, and Administration

- Users can report profiles for spam, harassment, fake profiles, inappropriate content, impersonation, or other reasons, and can block other users.
- Admins can view platform metrics, list users, suspend/reactivate accounts, review and resolve reports, inspect audit logs, and review student-ID verification submissions.
- Sensitive verification documents are accessible only through an authenticated admin endpoint.
- Admin routes require both authentication and the `admin` role.

### 4.10 Preserved Student Directory

- A separate `/api/students` CRUD module demonstrates a classic student registry: list, read, create, update, and delete.
- It uses MongoDB when available and falls back to an in-memory sample array when MongoDB is offline, returning a `storageMode` indicator.
- This module is intentionally public and is not protected by the main JWT middleware; it is separate from CampusMitra student accounts.

---

## 5. API Surface

All endpoints below are prefixed with `/api`. Most CampusMitra routes require `Authorization: Bearer <JWT>`; admin routes additionally require the `admin` role.

| Module | Main endpoints |
|---|---|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `GET /auth/verify-email/:token` |
| **Profiles** | `GET/PUT /profiles/me`, `POST/DELETE /profiles/me/photos`, `PUT /profiles/me/photos/reorder` |
| **Interests** | `GET /interests`, `POST /interests/custom` |
| **Discover** | `GET /discover` |
| **Connections** | `POST /connections/interest`, `POST /connections/pass`, `GET /connections` |
| **Conversations** | `GET /conversations`, `GET/POST /conversations/:id/messages`, `PUT/DELETE /conversations/:id/messages/:messageId` |
| **Plans** | `GET/POST /plans`, `GET/PUT /plans/:id`, `POST /plans/:id/join`, `/leave`, `/cancel`, `/remove-participant` |
| **Circles** | `GET/POST /circles`, `GET/PUT /circles/:id`, `POST /:id/join`, `/leave`, `/archive`, `/remove-member`, plus post, reaction, and comment routes |
| **Pulse** | `GET/POST /pulse`, `GET/PUT/DELETE /pulse/:id`, `POST /:id/like`, `/bookmark`, `/vote`, `POST/DELETE` comment routes |
| **Radar** | `GET /radar/feed`, `GET/PUT /radar/availability/me`, `POST /radar/availability/disable` |
| **Vibe** | `GET /vibe/conversation/:conversationId`, `GET /vibe/profile/:targetUserId`, `POST /vibe/conversation/:conversationId/game-prompt` |
| **Notifications** | `GET /notifications`, `PUT /notifications/read-all`, `PUT /notifications/:id/read`, `DELETE /notifications/:id` |
| **Verification** | `POST /verifications/student-id`, `GET /verifications/status` |
| **Moderation** | `POST /moderation/blocks`, `POST /moderation/reports`; aliases `POST /blocks`, `POST /reports` |
| **Admin** | `GET /admin/metrics`, `/users`, `/reports`, `/audit-logs`, `/verifications`; `PUT /admin/users/:id/status`, `/reports/:id`, `/verifications/:id`; `GET /admin/verifications/:id/document` |
| **Students** | `GET/POST /students`, `GET/PUT/DELETE /students/:id` |

The root `GET /` endpoint returns API status, database availability, and a directory of mounted modules.

---

## 6. Data Model

The backend defines **18 Mongoose models**:

| Domain | Models | Purpose |
|---|---|---|
| **Identity** | `User`, `Profile`, `Verification`, `VerificationToken`, `Interest` | Accounts, hashed credentials, rich profiles, email/ID verification, interest catalog |
| **Social graph** | `Connection`, `Conversation`, `Message`, `Notification`, `Block`, `Report`, `AuditLog` | Swipes/matches, direct and group chats, alerts, safety actions, admin audit trail |
| **Campus life** | `Plan`, `Circle`, `CirclePost`, `PulsePost`, `Availability` | Meetups and group chat, communities and feeds, campus posts/polls, temporary Radar status |
| **Legacy registry** | `Student` | Standalone Student Directory CRUD record |

Key relationships: a `User` has one `Profile`; `Connection` links two users and tracks interested/passed/accepted status; `Conversation` links participants and may reference a `Plan`; `Message` belongs to a conversation; `Plan` and `PulsePost` can reference a `Circle`; `CirclePost` and `PulsePost` contain embedded comments/reactions/poll data.

---

## 7. Real-Time Design

| Direction | Event | Purpose |
|---|---|---|
| Client → server | `join_conversation` | Join an authorized conversation room |
| Client → server | `typing` | Broadcast typing state |
| Client → server | `send_message` | Create and broadcast a chat message |
| Server → client | `new_message` | Deliver a message to conversation participants |
| Server → client | `user_typing` | Show typing indicator |
| Server → client | `match_celebration` | Notify both users of a mutual match |
| Server → client | `new_notification` | Push an in-app notification |
| Server → client | `plan_updated` | Notify about Plan changes |
| Server → client | `radar_availability_changed` | Refresh Radar presence information |

Sockets are authenticated with the same JWT used by the REST API. Each connection joins a personal room for notifications; conversation rooms are joined only after participant authorization. Direct-message creation also checks blocks.

---

## 8. Frontend

### Current application (`frontend/`)

The React Router 7 application is the primary UI. It uses `AuthContext`, `SocketContext`, and `ToastContext`, a centralized Axios client with JWT handling, protected routes, and a shared `MainLayout`.

| Area | Routes |
|---|---|
| **Public** | `/`, `/login`, `/register`, `/directory` |
| **Onboarding** | `/onboarding` |
| **Student app** | `/dashboard`, `/discover`, `/connections`, `/radar`, `/plans`, `/circles`, `/pulse`, `/chat`, `/profile`, `/profile/edit`, `/notifications`, `/settings` |
| **Admin** | `/admin` |
| **Fallback** | `*` → 404 page |

The UI includes a tactile swipe deck, compatibility displays, profile photo management, Vibe Connect drawer, Plan/Circle/Pulse interfaces, admin dashboards, toast notifications, loading skeletons, and match celebrations.

### Legacy application (`client/`)

`client/` is an older React 19 + Vite single-page app using tab-based views and a custom fetch API client. It covers the original core experience (landing, home, discover, connections, chat, profile, admin, directory) but does not include the newer route-based Plans/Circles/Pulse/Radar/Vibe UI. The root `README.md` still primarily describes this legacy frontend.

Both frontends default to port **5173**, so only one can run on that port at a time without changing configuration.

---

## 9. Testing and Seed Data

The repository contains **10 standalone integration test scripts** at the root:

- `test-api.js` — baseline REST endpoint checks, wired to `npm test`.
- `test-campus-suite.js` — 40 checks covering registration, domain validation, hashing, age rules, JWT, onboarding, verification, admin, interests, discovery, matching, chat, notifications, blocking, and unauthorized access.
- `test-auth-fix-suite.js` — authentication and socket behavior.
- `test-plans-suite.js`, `test-circles-suite.js`, `test-pulse-suite.js`, `test-radar-suite.js`, `test-vibe-suite.js` — feature-level validation and cleanup.
- `test-regression-suite.js` — security, authorization, duplicate-match, messaging, blocking, and concurrency regression checks.
- `test-two-account-flow.js` — end-to-end two-account registration, discovery, matching, real-time chat, and notifications.

These are manual integration suites rather than a unit-test framework. They require a running backend, MongoDB, and usually seeded accounts. Only `test-api.js` is currently invoked by `npm test`.

**Development seed accounts** (`npm run seed`; names are marked `[TEST]` and emails are pre-verified):

| Account | Password | Role |
|---|---|---|
| `priya.test@mitwpu.edu.in` | `password123` | Student |
| `rahul.test@mitwpu.edu.in` | `password123` | Student |
| `sneha.test@mitwpu.edu.in` | `password123` | Student |
| `admin.moderator@mitwpu.edu.in` | `adminpassword123` | Admin |

These credentials are for local development only.

---

## 10. Setup and Run

**Prerequisites:** Node.js 18+, npm, and MongoDB running locally or a MongoDB Atlas URI.

1. Install backend dependencies:

   ```bash
   npm install
   ```

2. Configure the root `.env`:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/campusmitra
   JWT_SECRET=<a-long-random-secret>
   JWT_EXPIRES_IN=7d
   ALLOWED_EMAIL_DOMAINS=mitwpu.edu.in
   CLIENT_URL=http://localhost:5173
   ```

3. Optionally seed development accounts:

   ```bash
   npm run seed
   ```

4. Start the backend:

   ```bash
   npm run dev
   # http://localhost:5000
   ```

5. Start the current frontend in a second terminal:

   ```bash
   cd frontend
   npm install
   npm run dev
   # http://localhost:5173
   ```

6. To run the legacy frontend instead:

   ```bash
   cd client
   npm install
   npm run dev
   ```

The current frontend uses `VITE_API_URL=http://localhost:5000` and also has Vite proxies for `/api`, `/uploads`, and `/socket.io`.

---

## 11. Current Observations and Limitations

- **Two frontends:** `frontend/` is the newer, feature-complete application; `client/` is legacy. The root README is outdated and describes the old client and a smaller feature set.
- **Development security posture:** the JWT helper has a fallback secret, CORS currently accepts every origin, and no Helmet or rate-limiting middleware is present. These should be hardened before production.
- **Email verification is development-oriented:** the verification token is returned directly in the registration response, and no real email provider is configured.
- **Public Student Directory:** `/api/students` has unauthenticated CRUD and falls back to in-memory data that resets on restart. It is a separate demo module, but it is not suitable as a public production API in its current form.
- **Local file storage:** uploads are stored on local disk. Production deployment would need persistent/cloud storage, cleanup, and stronger upload scanning.
- **Seed content:** test profiles use remote Unsplash image URLs and are not production data.
- **Testing:** the suites are comprehensive but manually run and are not connected to CI; only the baseline API test is exposed through `npm test`.
- **Repository state:** the working tree contained uncommitted modifications and new helper/test files at review time. This report reflects the current files and changed no source code.

---

## 12. Conclusion

CampusMitra is a feature-rich academic MERN project with a coherent separation between routes, controllers, models, middleware, and real-time socket handling. Its strongest areas are the end-to-end campus journey, weighted compatibility matching, mutual-match chat, the Plans/Circles/Pulse/Radar community modules, and broad integration testing. Before production use, the main priorities would be security hardening, replacing development email/file-storage flows, consolidating the two frontends, updating documentation, and adding automated CI.
