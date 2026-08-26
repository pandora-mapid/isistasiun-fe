# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

This started as a bare `create-next-app` scaffold and now implements **Isi Stasiun**, a 5-screen WebGIS proposal UI (Beranda `/`, Peta `/peta`, Insight `/insight`, Metodologi `/metodologi`, Rekomendasi `/rekomendasi`), recreated from a Claude Design hi-fi mockup (`Isi Stasiun Hifi v2.dc.html`, pulled via the design-system sync tool from the "Proposal Aplikasi Pemetaan Stasiun" project). Peta now renders a real MapLibre map over mock data; the other four screens are still static mockups.

- `components/NavBar.tsx` — a single `NavBar` (bordered row) used identically on all 5 screens, including Peta; it hardcodes the 5 routes and highlights the active one via an `active` prop — no `usePathname()`. Internally split into `Brand` (the "IS" mark) and `NavLinks` (the route pills), but those two are not exported — everything renders through `NavBar`. An earlier `FloatingNavBar` variant (a glass pill overlaid on the Peta map) was removed in favor of this single component so all 5 screens look consistent; don't reintroduce a second nav variant without checking with the user first.
- `components/PetaScreen.tsx` — the only client component (`"use client"`); owns all of Peta's interactive state (tab, layers panel, category/catchment/slot filters, transparency modal, copilot reveal). Its `page-canvas` is a column flexbox pinned to `100vh` (`NavBar` on top, the map `flex: 1` below) so the map always fills the remaining viewport with no page-level scroll. The illustrative basemap SVG that used to live here was replaced by `MapCanvas`; the floating panels still sit over it, absolutely positioned. Of the filters, only the catchment (3/5/10 min) currently reaches the map — the brief panel's figures remain static sample numbers, and wiring the rest is Fase 1 in `ROADMAP.md`.
- `components/ImagePlaceholder.tsx` — stands in for real station/survey photography.
- All 5 pages are laid out inside `.page-canvas` (defined in `globals.css`), now fluid at `width: 100%` though authored at 1440px. Internal layouts still use fixed grid columns, so anything under ~1100px breaks — responsiveness is a proposal promise that remains unbuilt (`ROADMAP.md` §6).
- Design tokens (the neutral/accent color scale, `.b`/`.bp`/`.bs`/`.bw` buttons, `.chip`, `.pill`, `.glass`, `.k`/`.cap` labels, `.row`, `.lyr`, `.dot`, `.mono`) are ported 1:1 from the source `.dc.html` into `globals.css` — most inline styles in the pages use literal hex/px values matching that source rather than Tailwind utility classes or the `:root` custom properties, so a rebrand means editing values across all 5 files, not just `:root`. Always reference the font via `var(--font-inter)`, never a literal `'Inter'` string — next/font hashes the actual generated font-family name, so a literal string silently falls back to the system font.
- Several buttons across the app are intentionally inert (styled, no `onClick`) because they'd need a real backend: PDF/brief export, "Bandingkan", "Tabel atribut". This is expected, not a bug to fix reflexively — confirm with the user before wiring them to anything.

Note the `@AGENTS.md` import above: `AGENTS.md` is auto-generated and rewritten by `next dev` itself (see `node_modules/next/dist/server/lib/generate-agent-files.js`). It warns that this Next.js version (16.3.2) has breaking API/convention changes relative to older training data, and points to `node_modules/next/dist/docs/` as the authoritative reference — check there before assuming App Router behavior from prior knowledge. If it reappears as an uncommitted diff after `next dev` runs, that's expected; commit it to keep the tree clean rather than deleting it.

## Commands

Run from `fe/` (the actual project root — the repo lives at `D:\Lomba\MAPID\fe`, not the outer `D:\Lomba\MAPID`):

```bash
npm run dev        # start dev server (http://localhost:3000)
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint (flat config, eslint.config.mjs)
npm test           # Playwright: style-spec validation + browser smoke tests
npm run test:style # just the fast, browser-free layer validation
```

`predev`/`prebuild` run `scripts/copy-maplibre-worker.mjs` automatically — see the MapLibre worker note under Architecture.

**Testing** is Playwright (`tests/`, config in `playwright.config.ts`), added because three separate map bugs each produced a blank map with *no error message at all* and sailed past both typecheck and lint:

- `tests/map-style.spec.ts` — validates every layer spec against MapLibre's official validator. No browser, ~1s. Catches illegal expressions (e.g. `feature-state` inside `filter`, `["zoom"]` nested inside `case`).
- `tests/peta.spec.ts` — real Chromium. Asserts features are actually **rendered** (`queryRenderedFeatures`), not merely that the page loaded, and that the isochrone filter changes what's drawn.

Playwright reuses an already-running dev server, and starts one if there isn't one.

## Architecture

- **Next.js 16 App Router** (`app/` directory), React 19, TypeScript (strict mode).
- **Styling**: Tailwind CSS v4, configured via CSS (`@import "tailwindcss"` in `app/globals.css`) rather than a `tailwind.config.js` — there isn't one in v4's default setup. `globals.css` also carries the design tokens and shared component classes described above.
- **Path alias**: `@/*` maps to the project root (`./*`) per `tsconfig.json`.
- **Fonts**: Inter (weights 400–900) loaded via `next/font/google` in `app/layout.tsx`, exposed as `--font-inter`.
- **Linting**: flat ESLint config (`eslint.config.mjs`) extending `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets.
- **The map** (`/peta`): MapLibre GL JS v6, wired up in `components/MapCanvas.tsx`. Three conventions there are load-bearing and each one, when broken, yields a blank map with **no error message**:
  - **`feature-state` is legal in `paint`, illegal in `filter`.** Analytics numbers reach the map via `setFeatureState`, so anything driven by them (gap colour/size, thin-sample styling) must be a paint expression. This is why thin-sample points share one layer with the rest and are distinguished by colour rather than filtered into their own layer.
  - **`["zoom"]` may only be the input to a top-level `interpolate`/`step`** — never nested inside `case`. Hence `circleRadiusExpression()` puts the zoom interpolation outermost and the thin-sample `case` inside it.
  - **MapLibre v6 ships its worker as a separate file** and derives its URL from `import.meta.url`. Under Turbopack that isn't an `http(s):` URL, so MapLibre falls back to `new Worker("")` — a worker pointing at the *page*, which silently does nothing: no tiles requested, no GeoJSON parsed. Fixed by `setWorkerUrl()` at module scope in `MapCanvas.tsx`, pointing at a copy that `scripts/copy-maplibre-worker.mjs` places in `public/maplibre/` (gitignored, regenerated on `predev`/`prebuild`). Don't hand-edit that folder.
- **Camera controls**: the basemap is OpenFreeMap **Liberty**, chosen because it shows the neighbourhood POIs that are this project's actual subject and because its `building-3d` layer extrudes buildings when the map is tilted. `?basemap=positron|voyager|bright` overrides it for comparison (`resolveBasemapUrl()`), and `tests/basemap-compare.visual.spec.ts` renders all four side by side. Tilt/rotate is MapLibre's own drag plus the compass, capped at `CAMERA.maxPitch` (60°) so the view can never end up staring at the horizon. **There are no custom map controls** — `visualizePitch: true` makes MapLibre call `resetNorthPitch()` on compass click instead of `resetNorth()`, which zeroes bearing *and* pitch without moving the centre, so a hand-rolled "flatten to 2D" button was redundant and was removed. An earlier auto-rotating "sweep" mode was also removed at the user's request; don't reintroduce either without asking.
- **Symbol layers must set `text-font` explicitly.** MapLibre defaults to `Open Sans Regular`, which OpenFreeMap does not serve — the glyph request 404s and every label vanishes with no error beyond an anonymous console line. `LABEL_FONT` in `lib/map/style.ts` pins `Noto Sans Regular`, which both OpenFreeMap and CARTO provide. Re-check this if the basemap changes again. `tests/peta.spec.ts` now fails on any 4xx/5xx response precisely to catch this class of silent breakage — note a 404 is *not* a `requestfailed`, so listening only for that misses it.
- **Map styling lives in exactly one file**, `lib/map/style.ts` — colours, radii, opacity, layer specs. `ROADMAP.md` §1 requires visuals be changeable without touching data/logic, so don't inline colour or size values in `MapCanvas.tsx`.
- **Data access goes through `lib/data/source.ts`**, which currently reads mock files from `public/mock/` (generated, committed). Phase 2 swaps that one file for the Go API; nothing else should need to change. Shapes are in `lib/data/types.ts` and mirror `DATA_CONTRACT.md`. Note `MapCanvas` already joins geometry to analytics via `setFeatureState` even though both come from mocks — deliberately, so the Phase 2 switch to vector tiles doesn't require rewriting style expressions.
- **Project docs**: `DATA_CONTRACT.md` (frontend ⇄ backend agreement) and `ROADMAP.md` (phased plan) are committed. `Proposal_IsiStasiun.pdf` and `BACKEND_TASK_DIVISION_3_PERSON.md` are gitignored — read them for context but never commit them.
- **Typed route props**: `app/layout.tsx` takes `LayoutProps<"/">` (see its `children` prop), a globally-available type Next.js 16 generates per-route from `.next/types` — not an import. Page components would use the equivalent `PageProps<"...">`. None of the 5 `page.tsx` files need it yet (no dynamic segments), but reach for `PageProps<"/route">` rather than hand-rolling a props type if one gains params/searchParams.
