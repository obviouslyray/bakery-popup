# bakery-popup

A mobile-first progressive web app for a Colorado bakery and coffee pop-up food truck (CS491/CS492, Team 2610 Orange). It's built with React and Vite and hosted on GitHub Pages.

Live site: https://obviouslyray.github.io/bakery-popup/

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (http://localhost:5173/bakery-popup/). Routes use hash URLs, for example `#/menu`, `#/owner` and `#/install`.

The service worker is not active in `npm run dev`. To test PWA behavior (install, offline), build and preview:

```bash
npm run build
npm run preview
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/`, including the manifest and service worker |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run icons` | Regenerate the PWA icons in `public/` from `public/favicon.svg` |

## PWA

- `vite-plugin-pwa` with the `injectManifest` strategy: the plugin generates `manifest.webmanifest` from `vite.config.js` and builds our own service worker, `src/sw.js`, injecting the list of files to precache.
- Add push notification and image caching handlers to `src/sw.js`.

## Environment

Copy `.env.example` to `.env` (git-ignored). Only the public Supabase anon key goes there. Supabase is not connected yet.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes `dist/` to GitHub Pages. One-time setup: in the repo, go to Settings > Pages > Source and select **GitHub Actions**.
