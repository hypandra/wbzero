# WBZero

A creative writing and worldbuilding tool with AI-powered image generation.

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in the required values:
   - `DATABASE_URL`: PostgreSQL connection string (Supabase)
   - `BETTER_AUTH_SECRET`: Secret key for BetterAuth (generate with `openssl rand -base64 32`)
   - `NEXT_PUBLIC_BETTER_AUTH_URL`: Your app URL (e.g., `http://localhost:3000`)
   - `BUNNY_STORAGE_ZONE`: BunnyCDN storage zone name
   - `BUNNY_STORAGE_API_KEY`: BunnyCDN API key
   - `BUNNY_STORAGE_ENDPOINT`: BunnyCDN endpoint (default: `https://la.storage.bunnycdn.com`)
   - `NEXT_PUBLIC_BUNNY_CDN_URL`: BunnyCDN CDN URL
   - `OPENROUTER_API_KEY`: OpenRouter API key for Gemini image generation
   - `OPENROUTER_SITE_URL`: Your site URL
   - `OPENROUTER_APP_NAME`: App name
   - `PARALLEL_API_KEY`: Parallel API key for Iris adjacent-ideas search
   - `HYPANDRA_API_KEY`: Hypandra API key for Hypandra questions

3. **Set up database:**
   Database uses `wbz_` table prefix. Run migrations via Supabase CLI.

4. **Copy SSL certificate (for production):**
   If deploying to production with Supabase, copy `prod-ca-2021.crt` to the project root, or set `SUPABASE_CA_CERT` environment variable.

5. **Run the development server:**
   ```bash
   bun run dev
   ```

6. **Run tests:**
   ```bash
   bun run test
   ```

## Project Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utility functions and configurations

## Features

- User authentication (email/password, no email verification)
- Project management (create, list, delete projects)
- Chapter management (create, edit, delete chapters with markdown support)
- Chapter tagging (freeform tags with autocomplete)
- AI image generation (select text in chapters to generate images via Gemini)
- Image gallery (view generated images for each chapter)
- Canvas mode (visual node-based planning)
- Theme Lab (AI-generated global themes with previews and versions)

## Tech Stack

- Next.js 16+ with App Router
- React 19
- Bun
- BetterAuth
- Supabase PostgreSQL
- BunnyCDN
- Gemini 2.5 Flash (via OpenRouter)
- TypeScript
- Tailwind CSS
