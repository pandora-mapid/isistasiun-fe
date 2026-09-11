# Isi Stasiun — Frontend

WebGIS UI for Isi Stasiun (MAPID WebGIS Competition #2 2026, Tim List Pandora).
Next.js 16 (App Router) + MapLibre GL JS. Five screens: Beranda `/`, Peta `/peta`,
Insight `/insight`, Metodologi `/metodologi`, Rekomendasi `/rekomendasi`.

Peta is the fully interactive map; Beranda and Insight read mock data, while
Metodologi and Rekomendasi are static. Backend wiring is pending — see
[`ROADMAP.md`](ROADMAP.md).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm test        # Playwright: logic + style-spec + browser smoke
npm run lint
```

## Docs

| File | What |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Architecture, conventions, the map's load-bearing gotchas |
| [`DATA_CONTRACT.md`](DATA_CONTRACT.md) | Frontend ⇄ backend data agreement |
| [`ROADMAP.md`](ROADMAP.md) | Phased plan (Fase 0–1 done, Fase 2 waits on backend) |
| [`USER_FLOW.md`](USER_FLOW.md) | What a user can actually do, screen by screen |
| `../Context/` | Cross-team product truth — start at `../Context/INDEX.md` |

Fonts are self-hosted via `next/font` (Inter + JetBrains Mono), referenced only
through CSS variables. Config via `NEXT_PUBLIC_*` env vars — see `.env.example`.
