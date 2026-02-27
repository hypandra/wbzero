export type ChangeTermKind = 'internal' | 'tool' | 'practice'

export interface ChangeTerm {
  key: string
  label: string
  description: string
  kind: ChangeTermKind
  note?: string
}

export interface ChangeEntry {
  id: string
  title: string
  summary: string
  devNote?: string
  publishedAt: string
  tags?: string[]
  terms?: ChangeTerm[]
}

export const UPDATES: ChangeEntry[] = [
  {
    id: '2026-02-26-static-badge',
    title: 'Lighter Curiosity Build badge',
    summary: 'The "A Curiosity Build" badge in the corner is now a simple image link instead of loading external code. Faster pages, same branding.',
    devNote: 'Replaced external JS web component with a static SVG badge and link. Eliminates Shadow DOM, html2canvas, font loading, and API calls on every page load.',
    publishedAt: '2026-02-26',
    tags: ['Performance', 'Infra'],
  },
  {
    id: '2026-02-06-resizable-images',
    title: 'Resizable images',
    summary: 'Drag corner handles to resize illustrations in the editor. Your chosen size persists across sessions.',
    devNote: 'Custom TipTap NodeView with drag-to-resize. Width stored in TipTap JSON, no DB changes.',
    publishedAt: '2026-02-06',
    tags: ['Editor', 'Images'],
    terms: [
      {
        key: 'node-view',
        label: 'Node view',
        description: 'A custom renderer for a specific element inside the editor.',
        kind: 'internal',
      },
    ],
  },
  {
    id: '2026-02-05-tiptap-editor',
    title: 'Rich text editor with inline images',
    summary: 'The chapter editor now supports formatting (bold, italic, headings, lists) and inline images. You can insert generated illustrations directly into your writing, or upload your own images.',
    devNote: 'Replaced textarea/markdown preview with TipTap WYSIWYG editor. Content stored as TipTap JSON with auto-migration from legacy markdown.',
    publishedAt: '2026-02-05',
    tags: ['Editor', 'Images'],
    terms: [
      {
        key: 'tiptap',
        label: 'TipTap',
        description: 'A rich text editor framework that powers the new writing experience.',
        kind: 'tool',
        note: 'We chose it; we could swap later.',
      },
      {
        key: 'wysiwyg',
        label: 'WYSIWYG',
        description: 'What You See Is What You Get — edit formatted text directly instead of writing markup.',
        kind: 'practice',
      },
    ],
  },
  {
    id: '2026-02-05-image-delete',
    title: 'Delete illustrations',
    summary: 'You can now delete illustrations you no longer want. Hover over an image to see the delete button.',
    devNote: 'Soft delete with deferred CDN cleanup via daily cron job.',
    publishedAt: '2026-02-05',
    tags: ['Images'],
  },
  {
    id: '2026-02-05-image-titles',
    title: 'Illustration titles',
    summary: 'Each illustration now has an auto-generated title from the source text. Click the title to edit it.',
    devNote: 'Title column on wbz_image, auto-generated from source_text, inline editable.',
    publishedAt: '2026-02-05',
    tags: ['Images'],
  },
  {
    id: '2026-02-05-image-upload',
    title: 'Upload your own images',
    summary: 'You can upload PNG, JPEG, WebP, or GIF images directly into chapters via the toolbar or by dragging files into the editor.',
    devNote: 'New upload endpoint with FormData handling, BunnyCDN storage.',
    publishedAt: '2026-02-05',
    tags: ['Images'],
  },
  {
    id: '2026-02-05-loading-spinners',
    title: 'Loading spinners everywhere',
    summary: 'Loading states now show a spinning indicator instead of just text.',
    devNote: 'Added Spinner component and updated loading states across the app.',
    publishedAt: '2026-02-05',
    tags: ['UI'],
  },
  {
    id: '2026-02-05-canvas-node-dialogs',
    title: 'Canvas node editing improved',
    summary: 'Setting a node type or color now opens a proper dialog with quick picks.',
    devNote: 'Replaced window.prompt() with modal dialogs for type and color.',
    publishedAt: '2026-02-05',
    tags: ['Canvas', 'UI'],
  },
  {
    id: '2026-02-05-project-dialog',
    title: 'Smoother project creation',
    summary: 'Creating a new project now opens a dialog instead of a browser popup.',
    devNote: 'Replaced window.prompt() with a styled modal component.',
    publishedAt: '2026-02-05',
    tags: ['UI'],
    terms: [
      {
        key: 'modal-dialog',
        label: 'Modal dialog',
        description: 'A small window that appears on top of the page for focused input.',
        kind: 'internal',
      },
    ],
  },
  {
    id: '2026-01-22-rename',
    title: 'Rebranded to WBZero',
    summary: 'The app is now called WBZero (wbzero.com) instead of EvenKeel.',
    devNote: 'Package renamed, chapter tagging added.',
    publishedAt: '2026-01-22',
    tags: ['Branding'],
  },
  {
    id: '2026-01-22-changelog',
    title: 'Changelog is live',
    summary: 'We now track what changed and explain new terms as we go.',
    devNote: 'Adds a Changes page with a glossary-style “Terms we used” section.',
    publishedAt: '2026-01-22',
    tags: ['Changelog', 'Learning'],
    terms: [
      {
        key: 'changelog',
        label: 'Changelog',
        description: 'A timeline of updates so we can learn what changed.',
        kind: 'practice',
      },
      {
        key: 'terms-used',
        label: 'Terms we used',
        description: 'A small glossary that explains words as we introduce them.',
        kind: 'practice',
      },
    ],
  },
  {
    id: '2026-01-22-theme-lab',
    title: 'Theme Lab: generate and save styles',
    summary: 'You can generate a theme with AI, preview it, and save versions for your whole workspace.',
    devNote: 'Adds AI theme schema, generator endpoint, and user-level theme version storage.',
    publishedAt: '2026-01-22',
    tags: ['Theme', 'AI'],
    terms: [
      {
        key: 'theme-lab',
        label: 'Theme Lab',
        description: 'A small studio to experiment with colors and fonts.',
        kind: 'internal',
        note: 'Our name; we can rename it later.',
      },
      {
        key: 'theme-versions',
        label: 'Theme versions',
        description: 'Saved snapshots you can return to later.',
        kind: 'practice',
      },
    ],
  },
  {
    id: '2026-01-22-tests',
    title: 'First automated test',
    summary: 'We added a test to make sure theme data is valid and safe.',
    devNote: 'Vitest is configured and validates AI theme parsing.',
    publishedAt: '2026-01-22',
    tags: ['Testing'],
    terms: [
      {
        key: 'vitest',
        label: 'Vitest',
        description: 'A test runner for JavaScript and TypeScript.',
        kind: 'tool',
      },
      {
        key: 'schema-validation',
        label: 'Schema validation',
        description: 'Checks that generated data matches the shape we expect.',
        kind: 'practice',
      },
    ],
  },
  {
    id: '2026-01-22-muse-popout',
    title: 'Muses can pop out',
    summary: 'You can open a muse in a dialog and pop it back into the side panel.',
    devNote: 'Adds pop‑out UI + more space for the context sidebar.',
    publishedAt: '2026-01-22',
    tags: ['UI', 'Muses'],
    terms: [
      {
        key: 'pop-out',
        label: 'Pop out',
        description: 'Opening a panel in its own dialog so it’s easier to focus.',
        kind: 'internal',
        note: 'Our label; we can rename it later.',
      },
    ],
  },
  {
    id: '2026-01-22-clearer-errors',
    title: 'Clearer error messages',
    summary: 'When a tool fails, we now show a more specific message.',
    devNote: 'Surface upstream error details and trace IDs for debugging.',
    publishedAt: '2026-01-22',
    tags: ['Reliability'],
    terms: [
      {
        key: 'trace-id',
        label: 'Trace ID',
        description: 'A unique ID that helps the provider find a specific request.',
        kind: 'practice',
      },
    ],
  },
  {
    id: '2026-01-21-iris-pack',
    title: 'Iris Packs from context',
    summary: 'Iris can now find related ideas without you typing anything.',
    devNote: 'Generates 1–3 search queries, runs Parallel search, and packages results.',
    publishedAt: '2026-01-21',
    tags: ['Iris', 'Search'],
    terms: [
      {
        key: 'iris-pack',
        label: 'Iris Pack',
        description: 'A bundle of links + ideas Iris collects for you.',
        kind: 'internal',
        note: 'Our name; we could rename it later.',
      },
      {
        key: 'parallel-search',
        label: 'Parallel Search',
        description: 'A web search tool Iris uses to find sources.',
        kind: 'tool',
        note: 'We chose it; we could swap providers later.',
      },
    ],
  },
  {
    id: '2026-01-21-hypandra',
    title: 'Hypandra reflections from context',
    summary: 'Hypandra can reflect on what you’re viewing, even if you send nothing.',
    devNote: 'Uses Hypandra reflections endpoint and context summary.',
    publishedAt: '2026-01-21',
    tags: ['Hypandra', 'Muse'],
    terms: [
      {
        key: 'hypandra-reflections',
        label: 'Reflections',
        description: 'Thoughtful responses that mirror your work back to you.',
        kind: 'practice',
      },
    ],
  },
  {
    id: '2026-01-21-prompt-viewer-fix',
    title: 'Prompt viewer loads correctly',
    summary: 'The prompt viewer now shows the prompt text instead of a blank panel.',
    devNote: 'Fixed the prompt viewer dialog not loading prompts.',
    publishedAt: '2026-01-21',
    tags: ['UI', 'Prompts'],
    terms: [
      {
        key: 'prompt-viewer',
        label: 'Prompt viewer',
        description: 'A small window that shows the exact instructions sent to the model.',
        kind: 'internal',
      },
    ],
  },
  {
    id: '2026-01-21-prompt-viewer-rollout',
    title: 'Prompt viewer across AI tools',
    summary: 'You can now see prompts in every AI spot, not just one.',
    devNote: 'Added the prompt viewer to all AI touchpoints.',
    publishedAt: '2026-01-21',
    tags: ['AI', 'UI'],
    terms: [
      {
        key: 'ai-touchpoints',
        label: 'AI touchpoints',
        description: 'Places in the app where you can use AI features.',
        kind: 'internal',
        note: 'Our phrase; we can rename it later.',
      },
    ],
  },
  {
    id: '2026-01-21-betterauth-domain',
    title: 'BetterAuth trusts the production domain',
    summary: 'Sign‑in works reliably on the live site.',
    devNote: 'Added the production domain to BetterAuth trusted origins.',
    publishedAt: '2026-01-21',
    tags: ['Auth', 'Infra'],
    terms: [
      {
        key: 'trusted-origins',
        label: 'Trusted origins',
        description: 'A security allow‑list of domains that can access auth.',
        kind: 'practice',
      },
      {
        key: 'betterauth',
        label: 'BetterAuth',
        description: 'The auth system WBZero uses for login and sessions.',
        kind: 'tool',
        note: 'We chose it; we could swap later.',
      },
    ],
  },
  {
    id: '2026-01-21-initial-commit',
    title: 'First working version',
    summary: 'The core writing app with chapters and AI image generation is live.',
    devNote: 'Initial commit of the creative writing tool (originally called EvenKeel).',
    publishedAt: '2026-01-21',
    tags: ['Foundation'],
    terms: [
      {
        key: 'chapters',
        label: 'Chapters',
        description: 'A project’s sections of writing.',
        kind: 'internal',
      },
      {
        key: 'ai-illustrations',
        label: 'AI illustrations',
        description: 'Images generated from selected text to support the story.',
        kind: 'internal',
      },
    ],
  },
]
