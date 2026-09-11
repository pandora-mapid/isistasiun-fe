# Frontend Next.js 16 (App Router) — deploy berbasis image, pola yang sama
# dengan isistasiun-be: CI membangun & mendorong image ke GHCR, CD di VPS
# cuma `pull` + `up -d`. Tidak ada `git pull` atau `npm ci` di server.
#
# Tiga tahap:
#   deps    — `npm ci` sekali; lapisannya ter-cache selama lockfile tak berubah
#   builder — `npm run build` (ikut memicu `prebuild`, lihat catatan MapLibre)
#   runner  — hanya keluaran `output: "standalone"`, tanpa node_modules penuh

ARG NODE_VERSION=22-alpine

# ---------- deps ----------
FROM node:${NODE_VERSION} AS deps

# SWC dan binary native lain butuh shim glibc di atas musl.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Hanya manifest yang disalin di sini supaya `npm ci` tidak ikut terinvalidasi
# setiap kali ada perubahan kode.
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder ----------
FROM node:${NODE_VERSION} AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# PENTING — variabel NEXT_PUBLIC_* DISISIPKAN KE BUNDEL SAAT BUILD, bukan
# dibaca saat container jalan. Menaruhnya di `.env` pada VPS tidak berpengaruh
# sama sekali terhadap kode yang jalan di browser; nilainya harus masuk di
# sini, lewat build arg (lihat .github/workflows/ci.yml).
#
# Konsekuensinya: satu image mengikat satu environment. Itu sebabnya tag
# `development` dan `main` dibangun terpisah, bukan satu image dipakai ulang.
ARG NEXT_PUBLIC_API_BASE_URL=""
ARG NEXT_PUBLIC_BASEMAP_URL=""

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_BASEMAP_URL=${NEXT_PUBLIC_BASEMAP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# `prebuild` (scripts/copy-maplibre-worker.mjs) menyalin worker MapLibre dari
# node_modules ke public/maplibre/. Direktori itu ada di .gitignore, jadi ia
# BARU ADA setelah langkah ini — karena itu `public/` di tahap runner disalin
# dari tahap ini, bukan dari konteks build. Kalau salah sumber, petanya kosong
# tanpa pesan error apa pun (lihat komentar panjang di skrip tersebut).
RUN npm run build

# ---------- runner ----------
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Tanpa HOSTNAME, server standalone hanya mendengar di localhost dan tidak
# bisa dijangkau container lain (nginx) lewat shared-web-net.
ENV HOSTNAME=0.0.0.0

# Bukan root. Bentuk pendek dipakai karena `adduser` di Alpine adalah busybox,
# yang tidak mengenal opsi panjang seperti `--system`.
RUN addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs

# Keluaran `standalone` sudah memuat server.js beserta node_modules seperlunya
# (hasil file tracing). Dua bagian ini tidak ikut ter-trace dan wajib disalin
# manual: `.next/static` dan `public/`.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
