# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

This started as a bare `create-next-app` scaffold and now implements **Isi Stasiun**, a 5-screen WebGIS proposal UI (Beranda `/`, Peta `/peta`, Insight `/insight`, Metodologi `/metodologi`, Rekomendasi `/rekomendasi`), recreated from a Claude Design hi-fi mockup (`Isi Stasiun Hifi v2.dc.html`, pulled via the design-system sync tool from the "Proposal Aplikasi Pemetaan Stasiun" project). There is no test framework configured.

- `components/NavBar.tsx` — a single `NavBar` (bordered row) used identically on all 5 screens, including Peta; it hardcodes the 5 routes and highlights the active one via an `active` prop — no `usePathname()`. Internally split into `Brand` (the "IS" mark) and `NavLinks` (the route pills), but those two are not exported — everything renders through `NavBar`. An earlier `FloatingNavBar` variant (a glass pill overlaid on the Peta map) was removed in favor of this single component so all 5 screens look consistent; don't reintroduce a second nav variant without checking with the user first.
- `components/PetaScreen.tsx` — the only client component (`"use client"`); owns all of Peta's interactive state (tab, layers panel, category/catchment/slot filters, transparency modal, copilot reveal). Its `page-canvas` is a column flexbox pinned to `100vh` (`NavBar` on top, the map `flex: 1` below) so the map always fills the remaining viewport with no page-level scroll — the map's illustrative basemap SVG uses `preserveAspectRatio="none"` to stretch into whatever height that leaves. None of the filter state currently feeds back into the displayed numbers — the brief panel's figures are static placeholders (`Rp X,X jt`, `XX%`), same as the rest of the app; only the basemap SVG is explicitly commented as illustrative, but the same caveat applies to the filters.
- `components/ImagePlaceholder.tsx` — stands in for real station/survey photography.
- All 5 pages are laid out inside a fixed `.page-canvas` (1440px wide, defined in `globals.css`) — this is a desktop-only design, not yet responsive.
- Design tokens (the neutral/accent color scale, `.b`/`.bp`/`.bs`/`.bw` buttons, `.chip`, `.pill`, `.glass`, `.k`/`.cap` labels, `.row`, `.lyr`, `.dot`, `.mono`) are ported 1:1 from the source `.dc.html` into `globals.css` — most inline styles in the pages use literal hex/px values matching that source rather than Tailwind utility classes or the `:root` custom properties, so a rebrand means editing values across all 5 files, not just `:root`. Always reference the font via `var(--font-inter)`, never a literal `'Inter'` string — next/font hashes the actual generated font-family name, so a literal string silently falls back to the system font.
- Several buttons across the app are intentionally inert (styled, no `onClick`) because they'd need a real backend: PDF/brief export, "Bandingkan", "Tabel atribut". This is expected, not a bug to fix reflexively — confirm with the user before wiring them to anything.

Note the `@AGENTS.md` import above: `AGENTS.md` is auto-generated and rewritten by `next dev` itself (see `node_modules/next/dist/server/lib/generate-agent-files.js`). It warns that this Next.js version (16.3.2) has breaking API/convention changes relative to older training data, and points to `node_modules/next/dist/docs/` as the authoritative reference — check there before assuming App Router behavior from prior knowledge. If it reappears as an uncommitted diff after `next dev` runs, that's expected; commit it to keep the tree clean rather than deleting it.

## Commands

Run from `fe/` (the actual project root — the repo lives at `D:\Lomba\MAPID\fe`, not the outer `D:\Lomba\MAPID`):

```bash
npm run dev     # start dev server (http://localhost:3000)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint (flat config, eslint.config.mjs)
```

There is no test script; none of the common frameworks (Jest, Vitest, Playwright) are installed.

## Architecture

- **Next.js 16 App Router** (`app/` directory), React 19, TypeScript (strict mode).
- **Styling**: Tailwind CSS v4, configured via CSS (`@import "tailwindcss"` in `app/globals.css`) rather than a `tailwind.config.js` — there isn't one in v4's default setup. `globals.css` also carries the design tokens and shared component classes described above.
- **Path alias**: `@/*` maps to the project root (`./*`) per `tsconfig.json`.
- **Fonts**: Inter (weights 400–900) loaded via `next/font/google` in `app/layout.tsx`, exposed as `--font-inter`.
- **Linting**: flat ESLint config (`eslint.config.mjs`) extending `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets.
- **Typed route props**: `app/layout.tsx` takes `LayoutProps<"/">` (see its `children` prop), a globally-available type Next.js 16 generates per-route from `.next/types` — not an import. Page components would use the equivalent `PageProps<"...">`. None of the 5 `page.tsx` files need it yet (no dynamic segments), but reach for `PageProps<"/route">` rather than hand-rolling a props type if one gains params/searchParams.
