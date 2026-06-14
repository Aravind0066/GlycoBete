# GlycoBete

GlycoBete is a gamified diabetes companion built with TanStack Start, Vite, Express, and SQLite. It combines daily glucose tracking, meal logging, quest progression, AI coaching, and onboarding flows for a game-like health experience.

## What It Does

GlycoBete includes:

- Login and onboarding for a new or returning user
- Dashboard with health score, streaks, XP, coins, and progression
- Meal, glucose, and daily log flows
- AI coach, insights, and summary screens
- Party/family support and achievements tracking
- Local SQLite storage for demo/offline data and optional Supabase integration

## Tech Stack

- Frontend: React, TanStack Router, TanStack Start, Vite
- Backend: Express, SQLite (`better-sqlite3`)
- Optional cloud services: Supabase and XAI/Grok

## Requirements

- Node.js 20 or newer
- npm
- Windows PowerShell or a compatible terminal

If `better-sqlite3` fails to install, install Visual Studio Build Tools with the C++ workload and run `npm install` again.

## Install

From a fresh clone:

```bash
cd C:\VS-Code\GlycoBete
npm install
```

## Run Locally

### Start both frontend and backend

```bash
npm run dev:full
```

This starts:

- Backend on `http://localhost:8081`
- Frontend on `http://localhost:8080`

If those ports are already in use, Vite may fall back to another port such as `8082` or `8083`. Check the terminal output for the exact URL.

### Start them separately

Backend only:

```bash
npm run backend:dev
```

Frontend only:

```bash
npm run dev
```

## How To Open It

1. Start the app with `npm run dev:full`.
2. Watch the terminal for the Vite URL.
3. Open the shown URL in your browser, for example `http://localhost:8080`.
4. If the browser shows a blank or loading page, try the login route directly:
	- `http://localhost:8080/login`

## Port Guide

- Frontend default: `8080`
- Backend default: `8081`
- Fallback frontend ports: `8082`, `8083`, and so on if the default ports are busy

To check what is listening on a port in PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 8080,8081,8082,8083 | Select-Object LocalPort,OwningProcess,State
```

To stop a stale Node process:

```powershell
Get-Process node | Stop-Process -Force
```

## Environment Variables

Create a `.env` file in the repository root if you want to use cloud features.

### Backend variables

```text
PORT=8081
CORS_ORIGIN=http://localhost:8080,http://localhost:5173
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
XAI_API_KEY=your-xai-or-grok-key
GROK_API_KEY=your-xai-or-grok-key
```

### Frontend variables

```text
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8081
```

Notes:

- Leave `VITE_API_BASE_URL` empty in local development if you want Vite to proxy `/api` calls to the backend.
- The backend can still run in local SQLite mode without Supabase keys.

## Main Features

### Authentication and Onboarding

- Sign in with a name-based local demo flow
- Optional email/Supabase auth support
- Guided onboarding for patient or family/caregiver modes
- Medication photo capture and text extraction support

### Dashboard and Progress

- XP, level, coins, and streak tracking
- Daily health overview and boss/progress systems
- Card-based dashboard with quick access to major areas

### Logging and Tracking

- Glucose logs
- Meal logs
- Daily summaries and check-ins
- Party/member support
- Quest and achievement persistence

### AI and Insights

- Diabetes coach chat
- Meal analysis
- Health insights
- Daily debrief summaries
- Medication extraction from images

## Useful Routes

- `/login` - sign in with a local name
- `/auth` - optional email/Supabase auth
- `/onboarding` - create your profile
- `/dashboard` - main health dashboard
- `/log` - logging and tracking
- `/checkin` - daily check-in flow
- `/coach` - AI coach
- `/insights` - trends and analytics
- `/party` - family/party support
- `/achievements` - progress and rewards
- `/summary` - summary view

## Build For Production

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Troubleshooting

### The page does not open

- Make sure both servers are running.
- Open the exact port shown in the terminal.
- If the app starts on a different port, use that URL instead of `5173` or `8080`.

### I see `db is not defined`

- Restart the backend from the repository root.
- Use `npm run backend:dev` inside `C:\VS-Code\GlycoBete`.
- Make sure you are not running an older Node process from another folder.

### I see a loading screen forever

- Refresh the page.
- Try `http://localhost:8080/login` directly.
- Restart both servers with `npm run dev:full`.

### `better-sqlite3` install fails

- Install Visual Studio Build Tools.
- Include the Desktop development with C++ workload.
- Run `npm install` again.

## Notes For Deploying Later

- Backend start command: `npm run backend:dev`
- Frontend build command: `npm run build`
- Local demo data is stored in SQLite under the project data folder.
- Supabase and XAI/Grok are optional for local development, but required for cloud features.
