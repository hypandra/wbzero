# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

WBZero (wbzero.com) is a creative writing and worldbuilding tool with AI-powered image generation. Users create writing projects with chapters, and can select text passages to generate illustrations using OpenAI gpt-image-1 via OpenRouter.

## Changelog

The changelog is in-app at `/changes` (see `src/data/changes.ts`). Add entries there when shipping user-facing features or fixes.

## Commands

```bash
bun dev          # Start development server (port 3000)
bun build        # Production build
bun lint         # Run ESLint
bun test         # Run Vitest
```

## Architecture

### Database
Uses PostgreSQL with `wbz_` table prefix. Tables: `wbz_user`, `wbz_session`, `wbz_account`, `wbz_verification` (BetterAuth), `wbz_project`, `wbz_chapter`, `wbz_image`, `wbz_chapter_tag`, `wbz_canvas`, `wbz_canvas_node`, `wbz_canvas_edge`, `wbz_prompt`, `wbz_user_theme`.

### Authentication
BetterAuth with `modelName` configuration for table prefixes:
- `lib/auth.ts` - Server config
- `lib/auth-client.ts` - Client hooks (`useSession`, `signIn`, `signOut`)
- `app/api/auth/[...all]/route.ts` - Auth API handler

### Image Generation Flow
1. User selects text in chapter editor (`components/chapters/chapter-editor.tsx`)
2. Frontend calls `POST /api/images/generate` with `chapter_id` and `source_text`
3. `lib/image-gen.ts` calls OpenRouter's OpenAI gpt-image-1 model
4. `lib/bunny.ts` uploads resulting PNG to BunnyCDN
5. Image record saved to `wbz_image` table with CDN URL

### API Routes
- `/api/auth/[...all]` - BetterAuth handler
- `/api/projects` - CRUD for projects
- `/api/projects/[id]` - Single project operations
- `/api/projects/[id]/tags` - Get all unique tags in project
- `/api/chapters` - CRUD for chapters
- `/api/chapters/[id]` - Single chapter operations
- `/api/chapters/[id]/tags` - Chapter tag management
- `/api/images/generate` - Image generation endpoint
- `/api/theme` - User theme versions (get/apply/reset)
- `/api/theme/generate` - AI theme generation

### SSL Configuration
For Supabase connections, either:
- Place `prod-ca-2021.crt` in project root, or
- Set `SUPABASE_CA_CERT` env var (base64 encoded)

Local development auto-disables SSL for localhost connections.

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `NEXT_PUBLIC_BETTER_AUTH_URL` - App URL
- `OPENROUTER_API_KEY` - For OpenAI gpt-image-1 image generation
- `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_API_KEY`, `NEXT_PUBLIC_BUNNY_CDN_URL` - BunnyCDN config

Optional:
- `HYPANDRA_API_KEY` and `PARALLEL_API_KEY` - Enable AI muse features

## Error Messaging Guidance
- Prefer upstream error details and traceIds in API responses for easier debugging.

## Next.js 16 Params Pattern

Dynamic route params are Promises in Next.js 16 - you must await them before use:

```typescript
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Now id is available
}
```

## Schema Changes

Database schema changes (new tables, columns, indexes) should NOT be done independently. Submit a request describing what you need and why, and Daniel will apply the migration.
