# Schwarz General & Feed Store

Website for **Schwarz General & Feed Store, featuring Broken Wheel Scratch Kitchen** — 417 S Kansas Ave, Lane, KS 66042.

Static, no build step. Deploys to Vercel as-is (`vercel.json` turns on clean URLs and cache headers).

## Pages

| URL | File |
| --- | --- |
| `/` | `index.html` |
| `/kitchen` | `kitchen.html` |
| `/store` | `store.html` |
| `/events` | `events.html` |
| `/visit` | `visit.html` |

## Structure

```
assets/
  css/styles.css     all styling + design tokens (one file, shared by every page)
  js/main.js         preloader, compact menu, reveals, videos, menu tabs, gallery lightbox, map
  js/chat.js         "Ask the counter" helper (answers FAQs on the page, no external service)
  fonts/             self-hosted DM Serif Display + Libre Franklin (woff2)
  img/               WebP images in two sizes each (srcset), badge, favicon, paper grain
  video/             compressed muted MP4 loops (load only when scrolled into view)
```

All asset paths are root-absolute (`/assets/...`), so serve the folder from a web server, e.g. `npx serve .` — opening the HTML files straight from disk won't resolve them.

## Performance notes

- Fonts and hero image are preloaded; fonts use metric-matched fallbacks so text never jumps.
- Every image below the fold is lazy-loaded; videos use `preload="none"` and only play while visible.
- Preloader shows once per browser session, never longer than 2 s, and is skipped for reduced-motion users.
- Page-to-page navigation uses cross-document View Transitions plus speculative prefetch for instant, smooth moves.

Website by [Nexlyr Solutions](https://nexlyr.solutions).
