# GauchoRSVP Backend (Convex)

This backend uses Convex HTTP Actions and exposes:

- `POST /signup`
- `POST /login`
- `GET /users`

## Setup

1. Install dependencies:
   - `npm install`
2. Login to Convex (first time only):
   - `npx convex login`
3. Start dev backend:
   - `npm run dev`

Convex will generate files under `convex/_generated` and print your deployment URL.

## Notes

- Set `NEXT_PUBLIC_CONVEX_HTTP_URL` in frontend to your Convex site URL.
- You can view all users in Convex Data after deploy (`users` table), or call `GET /users` from your Convex site URL.
- For Google OAuth redirect flow, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `FRONTEND_APP_URL` in backend `.env.local`.
- Configure your Google OAuth app redirect URI as:
  - `https://<your-deployment>.convex.site/oauth/google/callback`
