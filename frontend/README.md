# Pixora Frontend

Next.js (App Router) + TypeScript + Tailwind frontend for Pixora — search by image.

## Stack
- **Next.js 14** (App Router) + React 18 + TypeScript
- **Tailwind CSS** — bubble / sky-blue / white theme
- **Firebase Auth (client SDK)** — Google, GitHub, Email/Password + verification
- **Server-Sent Events** (native `fetch` + `ReadableStream`) for streaming search answers
- **lucide-react** — icon set (no emojis, per design brief)
- lucide-react + hand-drawn pixel-art rabbit mascot (SVG, no image assets needed)

## Pages
| Route | Access | Purpose |
|---|---|---|
| `/login` | public | Login / signup, Google + GitHub + email, "Last used" badge |
| `/intro` | protected | One-time animated bubble welcome after login |
| `/app` | protected | Main search interface (Picture Search / Internet Search) |
| `/history` | protected | Past searches, expandable, deletable |

## Local setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:
- `NEXT_PUBLIC_API_URL` — your backend URL (`http://localhost:8000` locally, your Railway URL in prod)
- `NEXT_PUBLIC_FIREBASE_*` — from Firebase Console → Project Settings → General → **Your apps → Web app**
  (this is the *client* config — public by design, different from the backend's admin service-account JSON)

Enable Google + GitHub sign-in providers under Firebase Console → Authentication → Sign-in method,
if you haven't already (needed for the social buttons to work).

```bash
npm run dev
```

Visit `http://localhost:3000`.

## How it talks to the backend

- Every protected request sends `Authorization: Bearer <firebase_id_token>` (see `lib/api.ts`)
- `/api/v1/search` is called with `stream=true` and parsed as Server-Sent Events:
  `description` → `sources` → `token`* → `done` | `error` (see `streamSearch()` in `lib/api.ts`
  and `ChatShell.tsx` for how each event updates the UI live)
- Make sure the backend's `ALLOWED_ORIGINS` includes this app's URL (`http://localhost:3000`
  locally, your Vercel URL in production) or requests will be blocked by CORS.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel → New Project.
3. Add the same env vars from `.env.local.example` under Project Settings → Environment Variables.
4. Deploy. Then update the backend's `ALLOWED_ORIGINS` to include your `*.vercel.app` URL.

## Design tokens

Palette, type, and animation tokens live in `tailwind.config.ts`:
- **sky** — primary blue scale
- **iris** / **mint** — iridescent bubble accents (used sparingly, in the intro bubble and sheens)
- **ink** — text colors (navy-tinted, not pure black, to stay in the blue family)
- Fonts: `Baloo 2` (display, rounded/friendly) + `Inter` (body) + `JetBrains Mono` (small utility text)
