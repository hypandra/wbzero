# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router pages, layouts, and route handlers.
- `src/components/`: Reusable React UI components (PascalCase files).
- `src/lib/`: Shared utilities, auth/db helpers, and client config.
- `src/app/globals.css`: Global Tailwind styles.
- `supabase/migrations/`: SQL migration files for the Postgres schema.
- `prod-ca-2021.crt`: Optional CA cert for Supabase production connections.

## Build, Test, and Development Commands
- `bun install`: Install dependencies.
- `bun run dev`: Start the local Next.js dev server at `http://localhost:3000`.
- `bun run build`: Create a production build.
- `bun run start`: Serve the production build.
- `bun run lint`: Run Next.js/ESLint checks.
- `bun run test`: Run Vitest.

## Coding Style & Naming Conventions
- TypeScript + React with 2-space indentation and single quotes (no semicolons).
- Components use PascalCase (e.g., `ProjectCard.tsx`); hooks use `useX` naming.
- Tailwind CSS is the primary styling approach; prefer utility classes over bespoke CSS.
- Run `bun run lint` before opening a PR.

## Testing Guidelines
- Vitest is configured for unit tests.
- Colocate tests near features (e.g., `src/lib/foo.test.ts`).

## Commit & Pull Request Guidelines
- Commit messages are short, imperative sentences (e.g., "Add project deletion flow").
- PRs should include: a clear description, linked issues (if any), and UI screenshots
  for visual changes.
- Call out any required env vars or migrations in the PR description.

## Changelog
- The changelog is in-app at `/changes` (see `src/data/changes.ts`).
- Add entries when shipping user-facing features or fixes.

## Configuration & Secrets
- Copy `.env.example` to `.env.local` and set required values. See README for details.
- The `HYPANDRA_API_KEY` and `PARALLEL_API_KEY` are optional — they enable AI muse features but the app works without them.
