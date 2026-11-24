# Mini Online Test App (MERN)

A small full-stack online test app built with MongoDB, Express, React, and Node.js.

## Features
- Student signup/login with email and password (bcrypt + JWT)
- 10 multiple-choice questions loaded from MongoDB
- 10-minute countdown with auto-submit
- Results with score, selected answers, and correct answers
- Attempt history with score and date
- Optional admin question creation endpoint/page (set `VITE_ADMIN_MODE=true` to show it)

## Project structure
```text
mini-online-test-app/
  backend/
  frontend/
```

## Requirements
- Node.js 18+
- MongoDB local instance or MongoDB Atlas connection string

## 1. Configure the backend
```bash
cd backend
copy .env.example .env
npm install
```
Edit `.env` and set `MONGO_URI`, `JWT_SECRET`, and (optionally) `ADMIN_EMAIL`.

Seed 10 sample questions:
```bash
npm run seed
```
Start API:
```bash
npm run dev
```
API runs on `http://localhost:5000`.

## 2. Configure the frontend
Open another terminal:
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```
Open the Vite URL shown in your terminal (normally `http://localhost:5173`).

## Default workflow
1. Sign up with an email and password.
2. Log in.
3. Start the test and answer the 10 questions.
4. Submit or wait for the timer to auto-submit.
5. Review the result and open History to see previous attempts.

## Admin bonus
The backend allows question creation only for the configured `ADMIN_EMAIL`.
Set `ADMIN_EMAIL=your-email@example.com` in `backend/.env`, then sign up using that email.
Set `VITE_ADMIN_MODE=true` in `frontend/.env` to display the Admin tab.
The admin endpoint is `POST /api/questions` and requires a JWT for the admin account.

## API routes
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/questions` (returns 10 random questions, without answers)
- `POST /api/questions` (admin only)
- `POST /api/attempts` (submit attempt; score is calculated by backend)
- `GET /api/attempts/me` (current user's attempt history)

## Deployment notes
- Deploy `backend` as a Node web service (Render, for example) and set `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `CLIENT_ORIGIN`.
- Deploy `frontend` as a static site (Vercel/Netlify) and set `VITE_API_URL` to your deployed backend URL, ending without a trailing slash.
- Add your frontend domain to `CLIENT_ORIGIN` on the backend.
- This starter project is ready for local development; you still need to create your own GitHub repository and deploy it to obtain live links.
