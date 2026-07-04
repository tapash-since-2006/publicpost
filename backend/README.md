# The Public Post — Backend API

A community-driven news platform backend built with **Node.js + Express + PostgreSQL + Prisma + Redis**.

---

## 🚀 Quick Start

### Option A — Docker (Recommended, easiest)

> Requires: [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

```bash
# 1. Clone and enter project
cd ThePublicPost

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Start everything (Postgres + Redis + App)
docker compose up --build

# App runs at: http://localhost:8012
```

That's it. Docker handles Postgres, Redis, and the app all together.

---

### Option B — Local Development (no Docker)

**Requirements:**
- Node.js 20+
- PostgreSQL running locally
- Redis running locally

**Install Redis locally (Windows):**
- Download from https://github.com/microsoftarchive/redis/releases
- Or use WSL: `sudo apt install redis-server && redis-server`

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill env
cp .env.example .env
# Edit DATABASE_URL and REDIS_URL to point to your local instances

# 3. Run DB migrations
npm run db:migrate

# 4. Start dev server
npm run dev
```

---

## 📁 Project Structure

```
├── server.js                  # Entry point
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── prisma/
│   └── schema.prisma          # Full DB schema
├── config/
│   ├── env.js                 # Env vars
│   ├── redis.js               # Redis client + helpers
│   └── cloudinary.js          # Cloudinary config
├── controllers/               # Request handlers
├── services/                  # Business logic
├── routes/                    # Route definitions
├── middleware/
│   └── auth.middleware.js     # JWT auth + role guard
└── utils/
    ├── jwt.js
    ├── hash.js
    ├── uploadToCloudinary.js
    └── aiPipeline.js
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default 8012) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d` |
| `ADMIN_EMAIL` | Email that gets auto-promoted to ADMIN |
| `CLOUDINARY_*` | Cloudinary credentials for media uploads |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | ✅ | Logout (blacklists token) |
| GET | `/api/auth/me` | ✅ | Get own profile |
| POST | `/api/auth/complete-registration` | — | Register + quiz + house |

### Quiz & House
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/quiz` | ✅ | Submit political quiz |
| POST | `/api/house` | ✅ | Choose house |

### Articles
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/articles` | — | Latest published articles |
| GET | `/api/articles/search` | — | Search articles |
| GET | `/api/articles/:articleId` | — | Get article by ID |
| GET | `/api/articles/journalist/:journalistId` | — | Journalist's articles |
| POST | `/api/articles` | ✅ JOURNALIST | Create / save draft |
| PATCH | `/api/articles/:articleId` | ✅ JOURNALIST | Update draft |
| POST | `/api/articles/:articleId/submit` | ✅ JOURNALIST | Submit draft for review |
| GET | `/api/articles/dashboard` | ✅ JOURNALIST | My articles dashboard |

### Fact Checking
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/factcheck/unverified` | ✅ FACT_CHECKER | Get articles to check |
| POST | `/api/factcheck/article/:articleId` | ✅ FACT_CHECKER | Submit fact check |
| GET | `/api/factcheck/article/:articleId` | ✅ | Get fact checks for article |

### Credibility
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/credibility/leaderboard` | — | Top journalists |
| GET | `/api/credibility/:journalistId` | ✅ | Get journalist score |
| GET | `/api/credibility/:journalistId/history` | ✅ | Score history |

### Side-by-Side Comparison
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/compare/:articleId` | ✅ | Get opposing article comparison |

### Comments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/comments/:articleId` | — | Get comments |
| POST | `/api/comments/:articleId` | ✅ | Add comment |
| DELETE | `/api/comments/comment/:commentId` | ✅ | Delete comment |

### Rewards & Tips
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/rewards/tip/:articleId` | ✅ | Tip an author |
| GET | `/api/rewards/tips/:articleId` | ✅ | Get article tips |
| GET | `/api/rewards/earnings` | ✅ JOURNALIST | My earnings |

### Subscriptions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/subscriptions/:journalistId` | ✅ | Subscribe |
| DELETE | `/api/subscriptions/:journalistId` | ✅ | Unsubscribe |
| GET | `/api/subscriptions` | ✅ | My subscriptions |
| GET | `/api/subscriptions/my/subscribers` | ✅ | My subscribers |
| GET | `/api/subscriptions/my/feed` | ✅ | My subscription feed |

### Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | ✅ | Get my notifications |
| PATCH | `/api/notifications/read` | ✅ | Mark notifications as read |
| PATCH | `/api/notifications/read-all` | ✅ | Mark all as read |
| DELETE | `/api/notifications/:id` | ✅ | Delete notification |

### Moderation
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/moderation/flag/:articleId` | ✅ | Flag an article |
| GET | `/api/moderation/flags/:articleId` | ✅ | Get article flags |
| GET | `/api/moderation/flagged` | ✅ ADMIN | All flagged articles |
| PATCH | `/api/moderation/takedown/:articleId` | ✅ ADMIN | Take down article |
| PATCH | `/api/moderation/restore/:articleId` | ✅ ADMIN | Restore article |
| POST | `/api/moderation/warn/:journalistId` | ✅ ADMIN | Warn journalist |
| GET | `/api/moderation/log` | ✅ ADMIN | Moderation log |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | ✅ ADMIN | Platform stats |
| GET | `/api/admin/journalists/pending` | ✅ ADMIN | Pending applications |
| PATCH | `/api/admin/journalists/:id/approve` | ✅ ADMIN | Approve journalist |
| DELETE | `/api/admin/journalists/:id/reject` | ✅ ADMIN | Reject journalist |
| GET | `/api/admin/articles/pending` | ✅ ADMIN | Pending articles |
| PATCH | `/api/admin/articles/:id/approve` | ✅ ADMIN | Approve article |
| PATCH | `/api/admin/articles/:id/reject` | ✅ ADMIN | Reject article |
| PATCH | `/api/admin/articles/:id/correct` | ✅ ADMIN | Request correction |

---

## 🔄 User Flow

```
Register → Political Quiz → Choose House
                                  ↓
               CITIZEN    JOURNALIST    FACT_CHECKER
                                  ↓
            Apply as Journalist → Admin Approves
                                  ↓
                    Write Article → Submit for Review
                                  ↓
              AI Fact Check → Human Fact Check → Published
                                  ↓
            Readers: Read, Comment, Tip, Subscribe, Flag
```

---

## 🏗️ Redis Usage

| Feature | Redis Key Pattern |
|---|---|
| Comparison cache | `comparison:{articleId}` |
| Credibility cache | `credibility:{journalistId}*` |
| Token blacklist | `bl:{token}` |
| Notifications pub/sub | `notifications:{userId}` |
| Rate limiting | handled by express-rate-limit |

---

## 🆕 New Features (v2)

### 📎 Journalist Document Upload

Apply as journalist now requires supporting documents.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/journalist/apply` | ✅ | Apply with documents (multipart/form-data) |
| GET | `/api/journalist/profile/:id` | — | Public journalist profile |
| GET | `/api/journalist/:id/documents` | ✅ ADMIN | View application documents |
| PATCH | `/api/journalist/documents/:docId/review` | ✅ ADMIN | Approve/reject a document |

**How to call `/api/journalist/apply`:**
```
Content-Type: multipart/form-data

fields:
  documents[]   → file (up to 5 files)
  docTypes[]    → string per file: PRESS_ID | GOVERNMENT_ID | EMPLOYMENT_LETTER | PORTFOLIO | OTHER
```

---

### 📡 Real-Time Notifications (SSE)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/sse/stream` | ✅ | Open SSE stream — keep connection alive |
| GET | `/api/sse/status` | ✅ ADMIN | Active connection count |

**Frontend usage:**
```javascript
const es = new EventSource('http://localhost:8012/api/sse/stream', {
  headers: { Authorization: `Bearer ${token}` }
});

es.addEventListener('notification', (e) => {
  const notification = JSON.parse(e.data);
  console.log(notification);
});

es.addEventListener('connected', (e) => {
  console.log('SSE connected', JSON.parse(e.data));
});
```

Every notification created via `createNotification()` or `notifyMany()` is instantly pushed to connected clients through Redis pub/sub → SSE stream.

---

### 📊 Audience Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/analytics/view/:articleId` | — | Record article view |
| GET | `/api/analytics/me` | ✅ JOURNALIST | Full journalist dashboard |
| GET | `/api/analytics/article/:articleId` | ✅ JOURNALIST | Per-article breakdown |
| GET | `/api/analytics/platform` | ✅ ADMIN | Platform-wide stats |

Views are automatically tracked on every `GET /api/articles/:articleId` call — no manual call needed.

**Deduplication:** Same user/IP won't be counted twice within 1 hour (Redis TTL key).

**Journalist dashboard returns:**
```json
{
  "overview": {
    "totalViews": 1240,
    "totalArticles": 8,
    "totalTips": 14,
    "totalTipAmount": 2800.00,
    "totalEarnings": 2520.00,
    "totalSubscribers": 312,
    "credibilityScore": 72.5
  },
  "topArticles": [...],
  "viewsOverTime": [{ "date": "2026-05-01", "views": 120 }, ...],
  "recentActivity": [...]
}
```
