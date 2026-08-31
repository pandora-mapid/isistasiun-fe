# Backend Spec — Ground Truth

Referensi utama: `00-GROUND-TRUTH-MASTER.md`. Konsolidasi dari `Brainstorm Tech Stack`, `Brainstorm Routing`, `BACKEND_TASK_DIVISION_3_PERSON`. Tidak ada konflik antar 3 dokumen ini soal isi endpoint — hanya appendix `ListPandora` (Python/Django) yang stale dan diabaikan.

## 1. Stack

- Bahasa: **Go**, router ringan (net/http / Fiber / Echo)
- DB driver: pgx (PostgreSQL/PostGIS)
- Auth: JWT — bedain publik (gratis) vs operator/pengelola kawasan (tier berbayar)
- Base path: `/api/v1`
- Standard response:
```json
{ "success": true, "data": {}, "error": null }
```

## 2. Ownership (3 backend dev)

| Dev | Domain | Jumlah endpoint |
|---|---|---|
| Priyapta | Station, Analytics, Confidence, AI Copilot routing | 10 |
| **Arzaka** | Survey ingestion & Pipeline callback | **7** |
| Firaz | Transparency, Auth, Premium + AI Copilot logic (business logic, bukan routing) | 7 |

Total 24 endpoint Go + AI Copilot logic (internal, dipegang Firaz, bukan route terpisah).

## 3. Endpoint lengkap

### 3.1 Spatial reference — Priyapta
| Method | Path | Deskripsi |
|---|---|---|
| GET | `/stations` | List semua stasiun |
| GET | `/stations/:id` | Detail satu stasiun |
| GET | `/stations/:id/entrances` | Daftar pintu masuk/keluar |

Catatan: geometry mentah kemungkinan proxy tipis ke GEO MAPID, bukan source of truth kita.

### 3.2 Analytics — Priyapta
| Method | Path | Query param |
|---|---|---|
| GET | `/analytics/spending-gap` | `bbox`, `station_id` |
| GET | `/analytics/spending-gap/:station_id` | — (return P10/P50/P90) |
| GET | `/analytics/category-gap` | `station_id` |
| GET | `/analytics/rent-flow-index` | `station_id`, `bbox` |
| GET | `/analytics/event-potential` | `station_id`, `time_slot` |

Semua endpoint di sini idealnya di-cache (Redis/in-memory) — data hasil batch, berubah cuma pas re-run simulasi.

### 3.3 Confidence layer — Priyapta
| Method | Path | Deskripsi |
|---|---|---|
| GET | `/confidence-layer` | Kerapatan sampel per kawasan |

### 3.4 AI Copilot — Priyapta (routing) / Firaz (logic)
| Method | Path | Deskripsi |
|---|---|---|
| POST | `/copilot/query` | Route dipegang Priyapta: validasi, rate limit, auth, forward ke AI service, handle timeout/error. Logic (intent parsing, mapping ke filter spasial, prompt) dipegang Firaz — **tidak boleh dicampur** ke handler routing. |

### 3.5 Survey ingestion — **Arzaka**
| Method | Path | Deskripsi |
|---|---|---|
| POST | `/survey/flow-observations` | Submit hasil pencacahan arus per blok 15 menit |
| POST | `/survey/entry-conversion-observations` | Submit hasil E dan C per gerai |
| GET | `/survey/flow-observations` | List — buat QA/kalibrasi antar-pencacah, cek selisih >10% |

Auth: token khusus anggota tim (bukan publik) — data mentah belum divalidasi.

### 3.6 Pipeline callback — **Arzaka**
| Method | Path | Deskripsi |
|---|---|---|
| POST | `/pipeline/extractions/struk` | Push hasil OCR batch struk |
| POST | `/pipeline/extractions/properti` | Push hasil OCR spanduk |
| POST | `/pipeline/extractions/gerai` | Push hasil klasifikasi visual gerai |
| POST | `/pipeline/simulations/monte-carlo` | Push hasil simulasi P10–P90 per simpul |

Wajib API key service-to-service **terpisah** dari auth user biasa (kalau bocor bisa inject data palsu ke hasil analitik).

⚠️ **OPEN**: dengan Struk Go/Menu Go sekarang parsial dari sumber online (lihat `01-DATA-SOURCES-AND-SURVEY.md` §3), `/pipeline/extractions/struk` mungkin perlu terima dua bentuk payload (hasil OCR dari foto vs data terstruktur langsung dari sumber online) — **tentukan skema payload setelah bentuk data online dikonfirmasi**, jangan hardcode asumsi foto-only.

Idempotency disarankan di semua endpoint pipeline ini (callback bisa retry).

### 3.7 Transparency — Firaz
| Method | Path | Deskripsi |
|---|---|---|
| GET | `/transparency/struk/:id` | Foto (sudah diredaksi), OCR result, nilai V, confidence, status |
| GET | `/transparency/gerai/:id` | Foto, kategori, confidence |
| GET | `/transparency/properti/:id` | Foto, harga sewa, luas, confidence |
| GET | `/transparency/station/:id/records` | List semua record transparansi per stasiun |

Publik tapi read-only ketat — jangan expose foto asli sebelum redaksi.

### 3.8 Auth & Premium — Firaz
| Method | Path | Deskripsi |
|---|---|---|
| POST | `/auth/login` | Login operator/pengelola kawasan |
| POST | `/auth/refresh` | Refresh token |
| GET | `/premium/deep-analysis/:station_id` | Simulasi what-if kategori usaha untuk petak kosong — pilih petak + kategori kandidat, return estimasi potensi belanja tertutup (P10–P90) + confidence. Definisi lengkap: `04-VALUE-PROP-AND-MONETIZATION.md` §4 |

## 4. Project structure

```text
cmd/api/main.go

internal/
├── station/        {handler,service,repository,dto}.go
├── analytics/
├── confidence/
├── survey/          # Arzaka
├── pipeline/        # Arzaka
├── transparency/
├── auth/
├── premium/
├── copilot/
│   ├── handler.go   # Priyapta
│   ├── client.go    # Priyapta - integrasi ke AI service
│   ├── service.go   # Firaz
│   └── dto.go
└── middleware/
```

## 5. Boundary arsitektur penting

- **Vector tile / geometry berat TIDAK lewat Go API.** Vector tiles → Nginx/CDN → Frontend map, langsung. Go API cuma pegang attribute data (popup, filter, panel transparansi).
- Kalau geometry ikut lewat JSON API → response size berat, map lemot pas concurrent user banyak. Jangan langgar ini.

## 6. Shared convention (harus disepakati bareng sebelum ngoding paralel)

Router/framework Go, DB connection, env/config, standard API response (lihat §1), error handling, logging, middleware convention, DTO convention, repository/service pattern, DB migration tool, testing convention.

## 7. Git branch

```text
main
├── feat/priyapta-public-api
├── feat/arzaka-ingestion-pipeline
└── feat/firaz-auth-ai
```
