# GlycoBete Deployment Checklist

## Supabase

1. Create a Supabase project.
2. Run `supabase db push` from the repository root.
3. Enable email/password auth for the hackathon demo.
4. Confirm row-level security is enabled on all GlycoBete tables.
5. Copy the project URL, anon key, and service role key.

## Railway Backend

1. Create a Railway service from this repository.
2. Set the start command to:

```bash
npm run backend:dev
```

3. Add backend environment variables:

```text
PORT=8080
CORS_ORIGIN=https://your-vercel-domain.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
XAI_API_KEY=your-xai-api-key
XAI_MODEL=grok-4.3
```

4. Verify `GET /health` returns:

```json
{ "ok": true, "service": "glycobete-api", "databaseConfigured": true, "grokConfigured": true }
```

## Local development

Run both servers together:

```bash
npm run dev:full
```

Or in two terminals:

```bash
npm run backend:dev
npm run dev
```

Leave `VITE_API_BASE_URL` empty in `.env` so the Vite dev proxy forwards `/api/*` to `http://localhost:8081`.

## Vercel Frontend

1. Create a Vercel project from this repository.
2. Use the default build command:

```bash
npm run build
```

3. Add frontend environment variables:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-railway-service.up.railway.app
```

4. Deploy and confirm:
   - `/onboarding` loads on first visit.
   - `/dashboard` loads after onboarding.
   - `/log`, `/checkin`, `/insights`, `/party`, and `/achievements` render.

## Demo Readiness

- Seed one demo user with 7 days of glucose logs.
- Seed at least three achievements.
- Prepare one meal prompt, one glucose trend story, and one AI coach question.
- Keep a no-key fallback path for live demo reliability.
- Show the dashboard first: Health Score, streak, quests, AI shortcut, recent logs.
