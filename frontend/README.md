# The Public Post — Frontend

React + Vite + Tailwind CSS frontend for The Public Post journalism platform.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (proxies API to localhost:5000)
npm run dev
```

App runs at: http://localhost:3000

## Requirements

Backend must be running at http://localhost:5000
```bash
# In your backend folder
docker compose up
```

## Pages

| Route | Description | Access |
|---|---|---|
| `/` | Article feed + subscription feed | Public |
| `/article/:id` | Full article with comments, tips, comparison | Public |
| `/journalist/:id` | Journalist profile + articles | Public |
| `/leaderboard` | Credibility rankings | Public |
| `/search` | Search articles | Public |
| `/login` | Sign in | Guest |
| `/register` | Sign up with quiz + house selection | Guest |
| `/profile` | My profile + journalist application | Auth |
| `/notifications` | Real-time notifications | Auth |
| `/write` | Write / edit article | Journalist |
| `/dashboard` | Analytics + article management | Journalist |
| `/apply-journalist` | Apply for journalist verification | Auth |
| `/factcheck` | Fact check queue | Fact Checker |
| `/admin` | Admin panel | Admin |

## Features

- Editorial design with Playfair Display serif headlines
- JWT auth with auto-refresh on 401
- Real-time notifications via SSE (Server-Sent Events)
- Side-by-side opposing article comparison
- Credibility score visualization
- Political leaning badges
- Fact-check verdict display
- Tip/reward system
- Article view tracking
- Responsive mobile layout
- Route guards by role/house
