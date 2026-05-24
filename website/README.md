# LOCK//IN AI — Landing Site

> **Focus that grows.** The marketing & download site for [LOCK//IN AI](../README.md).
> Built with Next.js (App Router) and **statically exported** so it drops straight
> onto Cloudflare Pages.

**Aesthetic:** matches the app's "new tab" styling — cozy-cyberpunk dark theme,
bio-luminescent leaf green + plasma cyan, aurora glow, glass panels, and the
floating **Lockie** companion (`components/Lockie.tsx`).

## Develop locally

```bash
npm install
npm run dev        # http://localhost:3001
```

## Build the static site

```bash
npm run build      # output written to ./out
```

## Deploy to Cloudflare Pages

- **Build command:** `npm run build`
- **Build output directory:** `out`
- **Framework preset:** Next.js (Static HTML Export)

`next.config.mjs` already sets `output: "export"`, so `out/` is fully static —
no Workers/SSR needed.

## Download links

Edit the constants at the top of `app/page.tsx`:

```ts
const REPO = "lockin-ai/lockin-ai"; // GitHub owner/repo  <-- set this
const VERSION = "v0.1.0";           // release tag the assets live under
```

The macOS / Windows / Linux buttons deep-link to the release assets
(`.dmg`, `.exe`, `.AppImage`); "All platforms" links to `/releases/latest`.
