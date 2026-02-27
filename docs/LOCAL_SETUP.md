# WBZero Local Development Setup

This guide gets WBZero running on your local machine. It's written so you (or your AI coding agent) can follow it step by step.

## Prerequisites (machine setup)

If you're starting from a fresh Mac, you'll need to install these in order. If you already have them, skip ahead to Step 1.

### Xcode Command Line Tools

This gives you basic developer tools (compilers, git, etc.). Run this in Terminal:

```bash
xcode-select --install
```

A popup will appear asking you to install. Click "Install" and wait for it to finish.

### Homebrew (package manager for macOS)

Homebrew lets you install other tools easily. Install it with:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After it finishes, it will tell you to run a command to add Homebrew to your PATH. Follow those instructions (they look like `eval "$(/opt/homebrew/bin/brew shellenv)"`).

Verify it works:
```bash
brew --version
# Expected: Homebrew 4.x.x
```

### Git

Xcode CLI tools include git, but if you need a newer version:
```bash
brew install git
```

### GitHub CLI (gh)

This lets you interact with GitHub from the command line — cloning, creating PRs, etc.

```bash
brew install gh
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

### Bun

Bun is the package manager and runtime this project uses. Install it with:

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify it works:
```bash
bun --version
# Expected: 1.x.x
```

---

## What else you need

- A **free Supabase account** at https://supabase.com — you'll create your own project for local dev

## Step 1: Clone the repo

```bash
git clone https://github.com/hypandra/wbzero.git
cd wbzero
```

## Step 2: Install dependencies

```bash
bun install
```

If you see a `pnpm-lock.yaml` or `yarn.lock` file, delete it. This project uses Bun only.

Verify: you should see a `node_modules/` directory and no errors in the output.

## Step 3: Create your Supabase project

1. Go to https://supabase.com/dashboard and create a new project (the free tier works fine)
2. Pick any name and region. Set a database password — you'll need it shortly
3. Once your project is created, go to **Project Settings > Database**
4. Copy the **Connection string (URI)** — it looks like: `postgresql://postgres.[your-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
5. **Use port 5432** (session mode), not 6543 (transaction mode). BetterAuth needs session mode for its auth queries

## Step 4: Set up your database tables

Your fresh Supabase project is empty. You need to create the WBZero tables.

**Important: Make sure you're running this against YOUR Supabase project, not a shared/production database.** Double-check the host in your connection URL matches what you just created in Step 3.

Use the fresh setup migration (NOT the incremental migrations in the same folder — those are for the production database's history). From the project root:

```bash
PGSSLMODE=require psql "YOUR_DATABASE_URL_HERE" -f supabase/migrations/00000000000000_wbz_fresh_setup.sql
```

This creates all 14 `wbz_*` tables, indexes, and triggers that WBZero needs.

Verify: you should see output like `CREATE TABLE`, `CREATE INDEX`, etc. with no errors. If you see `ERROR`, check the troubleshooting section below.

If you don't have `psql` installed, you can paste the contents of that file into the **SQL Editor** in your Supabase dashboard (https://supabase.com/dashboard/project/YOUR_REF/sql/new).

**Note:** Only use `00000000000000_wbz_fresh_setup.sql` for initial setup. The other migration files (`20260205...` etc.) are incremental changes already included in the fresh setup. Don't run `supabase db push` or those files separately — that would cause duplicate table/column errors.

## Step 5: Create your .env.local file

Copy the example file:

```bash
cp .env.example .env.local
```

Then fill in the values. Here's what each one does:

### Required (the app won't start without these)

| Variable | What it is | How to get it |
|---|---|---|
| `DATABASE_URL` | Your Supabase connection string | From Step 3 above |
| `DATABASE_SSL` | SSL mode for DB connection | Set to `false` if you don't have the SSL cert (see Step 6) |
| `BETTER_AUTH_SECRET` | Random secret for session encryption | Run `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Your local URL | `http://localhost:3000` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same, but for the browser | `http://localhost:3000` |

### Required for image generation

| Variable | What it is | How to get it |
|---|---|---|
| `OPENROUTER_API_KEY` | API key for AI image generation | Sign up at https://openrouter.ai, add credits, copy your key |
| `OPENROUTER_SITE_URL` | Your local URL | `http://localhost:3000` |
| `OPENROUTER_APP_NAME` | App name sent to OpenRouter | `WBZero` |

### Required for image uploads (CDN)

Daniel will provide these — they use the shared BunnyCDN storage zone:

| Variable | Value |
|---|---|
| `BUNNY_STORAGE_ZONE` | _(Daniel will share)_ |
| `BUNNY_STORAGE_API_KEY` | _(Daniel will share)_ |
| `BUNNY_STORAGE_ENDPOINT` | `https://la.storage.bunnycdn.com` |
| `NEXT_PUBLIC_BUNNY_CDN_URL` | _(Daniel will share)_ |

### Optional (app works without these, just with fewer features)

| Variable | What it does | How to get it |
|---|---|---|
| `PARALLEL_API_KEY` | Enables Iris AI search features | Daniel will share if needed |
| `HYPANDRA_API_KEY` | Enables AI muse features | Daniel will share if needed |
| `CRON_SECRET` | Auth for scheduled cleanup jobs | `openssl rand -base64 32` (only needed if testing cron routes) |

## Step 6: SSL certificate

Your `DATABASE_URL` points to a remote Supabase server, so the app needs SSL to connect. You have two options:

**Option A (easiest for local dev):** Add `DATABASE_SSL=false` to your `.env.local`. This disables SSL verification for your local dev server. This is fine because your Supabase connection is already encrypted at the transport level by default.

**Option B (matches production):** Download the Supabase CA certificate:
- Go to your Supabase dashboard > Project Settings > Database
- Download the CA certificate
- Save it as `prod-ca-2021.crt` in the project root
- Or set `SUPABASE_CA_CERT` in `.env.local` to the base64-encoded cert: `base64 -i prod-ca-2021.crt | tr -d '\n'`

If you skip both options, the app will crash on startup with: `SSL cert required for production. Set SUPABASE_CA_CERT or add prod-ca-2021.crt`. That error is telling you to pick Option A or B above.

## Step 7: Run the dev server

```bash
bun dev
```

Verify: you should see output like `▲ Next.js 16.x.x` and `- Local: http://localhost:3000`. Open http://localhost:3000 in your browser — you should see the WBZero landing page. Create an account, and you're in.

## What NOT to do

- **Don't run database migrations** on the shared production database. If you need a schema change, ask Daniel
- **Don't run `supabase db push`** — the incremental migrations are for production history. Your DB was set up with the fresh setup file
- **Don't commit your `.env.local`** — it's already in `.gitignore`
- **Don't use npm/pnpm/yarn** — this project is Bun-only

## Troubleshooting

### "SSL cert required for production"
Your app can't connect to the database because SSL isn't configured. The quickest fix: add `DATABASE_SSL=false` to your `.env.local`. See Step 6 for details.

### "relation wbz_user does not exist"
Your database tables aren't set up. Go back to Step 4.

### "duplicate key value violates unique constraint" or "relation already exists"
You may have run the setup migration more than once, or run both the fresh setup and incremental migrations. The fresh setup file is safe to re-run (it uses `IF NOT EXISTS`), but if you hit constraint errors, the simplest fix is to reset your database in the Supabase dashboard (Settings > General > Reset Database) and re-run Step 4.

### "ECONNREFUSED" or database connection errors
Check your `DATABASE_URL` in `.env.local`. Make sure you're using the correct port (5432 for session mode) and the password is right.

### "BETTER_AUTH_SECRET is required"
You need to set `BETTER_AUTH_SECRET` in `.env.local`. Generate one with `openssl rand -base64 32`.

### Image generation fails
Check that `OPENROUTER_API_KEY` is set and has credits. You can test it at https://openrouter.ai/playground.

### Build errors after pulling new code
```bash
bun install  # in case dependencies changed
bun dev
```
