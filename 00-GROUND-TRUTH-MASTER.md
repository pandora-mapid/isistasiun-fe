# Isi Stasiun — Ground Truth Master

> Dokumen ini adalah **single source of truth**. Kalau ada dokumen lain (draft PRD, submission awal, brainstorm) yang bertentangan dengan file ini, **file ini yang menang**, kecuali ada keputusan baru dari tim yang meng-update file ini juga.
>
> Status per item: ✅ RESOLVED (sudah pasti, pakai ini) / ⚠️ OPEN (belum diputuskan, jangan diasumsikan saat coding/nulis PRD).

---

## 1. Project

- Nama: **Isi Stasiun**
- Tim: **List Pandora**
- Kompetisi: MAPID WebGIS Competition #2 2026 — *Maps That Think! Mass Transportation Edition*
- Institusi: Universitas Indonesia

## 2. Tim & Role ✅ / ⚠️

| Nama | Role (per BACKEND_TASK_DIVISION, konsisten) |
|---|---|
| Priyapta Naufal Sudrajat | Ketua tim; Backend — Station, Analytics, Confidence, AI Copilot routing (10 endpoint) |
| Arzaka | Backend — Survey ingestion & Pipeline callback (7 endpoint) **+ menilai bisnis & FE** (dirangkap, dikonfirmasi langsung: "saya ngelakuin semuanya") |
| Muhammad Firaz Al Aqib | Backend — Transparency, Auth, Premium (7 endpoint) + AI Copilot logic |
| Muhammad Adiansyah | Frontend — design UI & routing FE |
| Ariq Maulana Malik Ibrahim | AI integration (kemungkinan overlap dgn Firaz di AI logic — **belum jelas batasnya**) |

✅ **RESOLVED**: draft PRD tabel anggota tim §1 punya deskripsi role Arzaka beda ("Menilai Bisnis dan menilai fe") dari ownership backend (`BACKEND_TASK_DIVISION`). Dikonfirmasi: keduanya benar, Arzaka merangkap. Update PRD jadi gabungan role, bukan pilih salah satu (lihat `03-PRD-UPDATE-CHECKLIST.md` §D).

## 3. Scope Studi ✅

- **Jumlah stasiun: 2 (Manggarai & Sudirman)** — bukan 3 seperti tertulis di submission awal (`ListPandora_1__IsiStasiun`) dan draft PRD.
- Implikasi: semua kalimat/tabel yang menyebut "tiga stasiun terpilih", termasuk problem statement, kriteria pemilihan stasiun (dioperasikan KAI, kerapatan data mission, dst.), dan tabel volume pencacahan lapangan **butuh revisi**. Detail di `03-PRD-UPDATE-CHECKLIST.md`.
- ✅ **RESOLVED** — jumlah pintu (dalam scope survei): **Manggarai 2 pintu (masuk & keluar), Sudirman 2 pintu** (total 4, jauh di bawah kriteria lama "maks. 5/stasiun"). Detail volume pencacahan hasil hitung ulang ada di `01-DATA-SOURCES-AND-SURVEY.md` §4. Catatan: kalau ditulis di PRD, klarifikasi bahwa ini pintu yang tercakup dalam scope survei, bukan klaim jumlah total pintu fisik stasiun (Manggarai dikenal punya banyak akses).

## 4. Sumber Data ✅ (ringkas — detail di `01-DATA-SOURCES-AND-SURVEY.md`)

| Dataset | Sumber real |
|---|---|
| Community Maps (Activity) — F, E, C | **Survey lapangan tim** (MAPID APPS), Manggarai + Sudirman |
| Properti Go | **Survey lapangan tim** (MAPID APPS), Manggarai + Sudirman |
| Struk Go | **Bukan survey.** Kombinasi: dataset dasar kompetisi (GEO MAPID) + sumber online lainnya |
| Menu Go | Sama seperti Struk Go |

## 5. Tech Stack Final ✅

| Layer | Final | Catatan |
|---|---|---|
| Frontend | Next.js + MapLibre GL JS | Konsisten di semua dokumen, tidak ada konflik |
| Backend | **Go** (net/http atau Fiber/Echo) + pgx | Appendix `ListPandora` (Lampiran 1) masih nulis Python/Django — **itu stale, abaikan** |
| Database | PostgreSQL + PostGIS, self-hosted Docker | Konsisten |
| Batch pipeline | Python — GeoPandas, Shapely, NumPy, pandas | Terpisah dari API layer, cron/Celery |
| Object storage | Cloudflare R2 | |
| AI vision/OCR | Gemini Flash / Flash-Lite | Untuk OCR struk/spanduk + klasifikasi gerai |
| Reverse proxy/infra | Nginx + Let's Encrypt, Docker Compose, GitHub Actions | Hosting: coba Oracle Cloud Always Free dulu, fallback VPS ~4GB |
| Auth | JWT | Bedain akses publik vs operator/pengelola (tier berbayar) |
| GIS platform (wajib kompetisi) | MAPID MAPS (basemap) + GEO MAPID (data spasial) + MAPID Apps (survey) | |

## 6. Dokumen Turunan

- `01-DATA-SOURCES-AND-SURVEY.md` — breakdown lengkap per dataset + rencana volume survey lapangan yang sudah disesuaikan 2 stasiun
- `02-BACKEND-SPEC.md` — spec backend final (endpoint + ownership + tech stack), sudah dikonsolidasi dari Brainstorm Tech Stack + Routing + Task Division
- `03-PRD-UPDATE-CHECKLIST.md` — daftar section di draft PRD & submission asli yang perlu direvisi supaya sinkron dengan realita ini
