# GauchoRSVP

Full-stack app with:

- `Frontend` (Next.js app)
- `Backend` (Convex functions + HTTP routes)

## Project Structure

```text
GauchoRSVP/
├── Frontend/
│   ├── app/
│   ├── components/
│   ├── .env.local
│   └── package.json
├── Backend/
│   ├── convex/
│   │   ├── http.ts
│   │   ├── auth.ts
│   │   └── schema.ts
│   ├── .env.local
│   └── package.json
└── README.md
```

## Run Frontend

From repo root:

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` by default.

## Run Backend

From repo root:

```bash
cd Backend
npm install
npx convex dev
```

Note: if you typed `cd Backned` by mistake, use `cd Backend` (folder name is `Backend`).

## First-Time Convex Setup

If this is your first time running the backend on your machine, do this once from `Backend`:

```bash
cd Backend
npx convex login
npx convex dev
```

What this does:

- `npx convex login` authenticates your local CLI with your Convex account.
- `npx convex dev` links/provisions the dev deployment and generates Convex local config.

## Frontend Environment (`Frontend/.env.local`)

Create/update `Frontend/.env.local`:

```env
NEXT_PUBLIC_CONVEX_HTTP_URL=<your-convex-database-link-here>
```

This is the base URL used by frontend auth requests (for `/signup`, `/login`, `/users`).

## Backend Environment (`Backend/.env.local`)

`npx convex dev` initializes `Backend/.env.local` with:

- `CONVEX_DEPLOYMENT`
- `CONVEX_URL`
- `CONVEX_SITE_URL`

You can keep these in the file. Also set:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_APP_URL=http://localhost:3000
```

## Required Convex Runtime Env Commands

For Convex cloud runtime, set env vars with these commands from `Backend`:

```bash
npx convex env set GOOGLE_CLIENT_ID "<your-client-id>"
npx convex env set GOOGLE_CLIENT_SECRET "<your-client-secret>"
npx convex env set FRONTEND_APP_URL "http://localhost:3000"
```

Confirm they are set:

```bash
npx convex env list
```

## Google OAuth Redirect URI

In Google Cloud OAuth client settings, add an Authorized redirect URI:

```text
<your-convex-database-link-here>
```

If your Convex deployment URL changes, update both:

- `NEXT_PUBLIC_CONVEX_HTTP_URL` in frontend
- Google OAuth Authorized redirect URI
