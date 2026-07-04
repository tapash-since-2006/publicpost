# The Public Post — Full Stack

```
publicpost/
├── backend/   Node.js + Express + Neon PostgreSQL + Upstash Redis
├── frontend/  React + Vite + Tailwind CSS
└── ThePublicPost.postman_collection.json
```

## Run Backend
```bash
cd backend
docker compose up --build

# First time only
docker compose exec app npm run db:seed
# Creates: admin@gmail.com / admin123 + 6 quiz questions
```

## Run Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

## Quick Test
1. http://localhost:3000 → Register → quiz → house
2. Admin panel → approve journalist
3. Write article → submit
4. Fact check queue → submit verdict
5. Browse feed → tip, comment, compare

## What's Fixed in This Version
- Admin panel stats no longer crash
- AI pipeline now ~40% chance of needing human review (factcheck queue works)
- Document upload goes browser → Cloudinary directly (no Docker timeout)
- Navbar closes dropdown on outside click
- Apply as Journalist link shows for CITIZEN users in navbar
- Admin can also access fact check queue
- Quiz questions loaded from DB (editable in Admin → Quiz Config)
- Rate limiting completely off in development
- All unused imports removed
