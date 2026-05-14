# Sixten (Calm Queue) — Restart Guide

How to get Sixten running again after hibernation.

## 1. Unpause Supabase

1. Go to https://supabase.com/dashboard
2. Find project **nksklutaffmrfauwydsw** (shown as paused)
3. Click **Restore project** and wait a few minutes
4. Verify: open the Table Editor and check that the `links` table has data

The project URL stays the same: `https://nksklutaffmrfauwydsw.supabase.co`

> If Supabase deleted the paused project (free-tier projects may be removed after ~90 days), see **Database Schema Recovery** below.

## 2. Get API Keys

| Key | Where to create |
|-----|----------------|
| Anthropic | https://console.anthropic.com/settings/keys |
| Jina (optional) | https://jina.ai — sign in and get a key. Works without a key too (rate-limited) |

## 3. Reconnect Netlify

### If the site still exists (deploys were locked)
1. Go to https://app.netlify.com — find the **sixten-sorterare** site
2. Go to **Deploys** > click **Unlock deploys**
3. Add environment variables (see step 4)
4. Trigger a deploy: **Deploys** > **Trigger deploy** > **Deploy site**

### If the site was deleted
1. Go to https://app.netlify.com > **Add new site** > **Import an existing project**
2. Connect to GitHub and select the Sixten repo
3. Build settings are already defined in `netlify.toml` — no changes needed:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. Add environment variables (see step 4)

## 4. Add Environment Variables in Netlify

Go to **Site settings** > **Environment variables** and add:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from step 2 |
| `JINA_API_KEY` | Your Jina API key from step 2 (optional) |

Note: Supabase keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are NOT needed in Netlify — they are `VITE_`-prefixed and read from the local `.env` file at build time.

## 5. Local Development

```bash
git clone <repo-url>   # or git pull if already cloned
npm install
```

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://nksklutaffmrfauwydsw.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
```

Find the anon key in Supabase dashboard: **Settings** > **API** > **Project API keys** > `anon` / `public`.

```bash
npm run dev    # starts at http://localhost:5173
```

## 6. Database Schema Recovery

Only needed if Supabase deleted the project entirely. Create a new Supabase project, then run these SQL files in order in the **SQL Editor**:

1. `supabase/schema.sql` — creates `links` table with RLS
2. `supabase/migrations/003_add_tags.sql` — creates `link_tags` table
3. `supabase/migrations/004_add_user_emails.sql` — creates `user_emails` table
4. `supabase/migrations/005_add_image_data.sql` — adds `image_data` column to links
5. `supabase/migrations/006_add_manual_content.sql` — adds `manual_content` column
6. `supabase/migrations/007_add_favorite_tags.sql` — creates `favorite_tags` table
7. `supabase/migrations/008_normalize_tags.sql` — normalizes tag casing

After creating a new project, update the `.env` file with the new URL and anon key.

## 7. Environment Variables Reference

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | `.env` (local + Netlify build) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` (local + Netlify build) | Supabase public key |
| `ANTHROPIC_API_KEY` | Netlify env vars only | Claude AI analysis |
| `JINA_API_KEY` | Netlify env vars only | Content fetching (optional) |

## 8. Architecture Quick Reference

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Database:** Supabase (PostgreSQL + REST API)
- **Serverless:** Netlify Functions (in `netlify/functions/`)
  - `analyze.ts` — sends content to Claude for AI analysis
  - `fetch-content.ts` — fetches web page content via Jina Reader
  - `email-webhook.ts` — receives inbound emails (partially implemented)
- **Deploy:** Netlify auto-deploys on push to `main`
- **API routing:** `/api/*` redirects to `/.netlify/functions/:splat` (configured in `netlify.toml`)
