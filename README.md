# ForgePrompt

A Flask-based prompt publishing platform with Supabase (Postgres) backend, community voting, collections, chains, and a full admin panel.

## Database Setup (Supabase — free)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open **SQL Editor** in your Supabase dashboard
3. Paste the contents of `schema.sql` and click **Run**
4. Go to **Settings → API** and copy your **Project URL** and **service_role key**
5. Set environment variables (see below)

## Environment Variables

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_KEY` | Supabase → Settings → API → **service_role** key (not anon!) |
| `SECRET_KEY` | Any random string for Flask sessions |

## Running Locally

```bash
pip install -r requirements.txt
cp .env.example .env   # then fill in your Supabase credentials
python app.py
```

To migrate existing JSON data to Supabase:
```bash
python migrate_to_supabase.py
```

## Deploying to Vercel

1. Push to GitHub
2. Import in Vercel → set the 3 environment variables above in Vercel project settings
3. Deploy — works with the included `vercel.json`

## Deploying to Render

1. Push to GitHub
2. New Web Service → connect repo
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app`
5. Add the 3 environment variables in Render's dashboard
6. Deploy

## Features

**Core:** Variable templating, comments, collections, model tags, RSS feed, token counter, trending sort, prompt requests

**Advanced:** Prompt forking & version history, Prompt of the Day, follow system with feed, prompt chains/workflows, testing playground with verified model badges, relevance-scored search, pagination, in-app notifications

## Tech Stack
- **Backend:** Python / Flask
- **Database:** Supabase (PostgreSQL)
- **Frontend:** Jinja2 + vanilla JS + custom CSS
- **Auth:** Session-based with admin/moderator roles
