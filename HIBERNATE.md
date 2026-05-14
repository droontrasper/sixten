# Sixten (Calm Queue) — Hibernate Checklist

Follow these steps in order to shut down all services. See `RESTART.md` for how to bring everything back.

## Step 1: Export Your Data

Run the export script to save all links locally:

```bash
node scripts/export-links.mjs
```

This creates `exported-links.csv` in the project root. **Copy this file somewhere safe** (e.g., Google Drive, another folder) — it's your backup.

Alternative: go to https://supabase.com/dashboard/project/nksklutaffmrfauwydsw/sql/new and run:

```sql
SELECT url, title, status, created_at
FROM links
WHERE user_id = 'user_1' AND status != 'deleted'
ORDER BY created_at DESC;
```

Click **Download CSV** to save the results.

## Step 2: Remove API Keys from Netlify

1. Go to https://app.netlify.com — open your **sixten-sorterare** site
2. Go to **Site settings** > **Environment variables**
3. Delete `ANTHROPIC_API_KEY`
4. Delete `JINA_API_KEY`

This ensures no API costs even if the site stays accessible.

Optional: revoke the Anthropic key entirely at https://console.anthropic.com/settings/keys (you'll need to create a new one on restart).

## Step 3: Pause Supabase

1. Go to https://supabase.com/dashboard/project/nksklutaffmrfauwydsw/settings/general
2. Scroll to the bottom — click **Pause project**
3. Confirm

Your data is preserved while paused. The database just becomes inaccessible.

> **Warning:** Supabase may delete free-tier projects that have been paused for ~90 days. If you plan to hibernate longer than that, your exported CSV is your safety net. The database schema can be recreated from the SQL files in `supabase/` (see RESTART.md step 6).

## Step 4: Netlify (Optional)

The Netlify free tier has no cost in idle. You can leave the site as-is — with Supabase paused and API keys removed, it's effectively dead.

If you want to fully clean up:
- **Lock deploys:** Deploys > Lock deploys (prevents new builds, site stays up but broken)
- **Delete site:** Site settings > Danger zone > Delete site (you'll reconnect from GitHub on restart)

## Step 5: Commit and Push

Make sure `RESTART.md`, `HIBERNATE.md`, and `scripts/export-links.mjs` are committed and pushed to GitHub before shutting anything down:

```bash
git add RESTART.md HIBERNATE.md scripts/export-links.mjs
git commit -m "docs: Add hibernate/restart guides and export script"
git push
```

## Done

All services are now paused or shut down. When you want to restart, follow `RESTART.md`.
