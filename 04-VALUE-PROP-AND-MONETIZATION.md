# PRD Section Notes — Arzaka (Problem Statement, Tujuan, Value Prop, Scope, Kebutuhan Bisnis)

Referensi: `00-GROUND-TRUTH-MASTER.md`. Ini hasil brainstorm sebelum nulis PRD, bukan draft final.

## 1. Tipologi 2 stasiun (ganti tipologi lama hunian/perkantoran/campuran)

- **Manggarai** — stasiun transit/interchange, aktivitas dominan **di dalam** stasiun (dwell-time tinggi, orang nunggu koneksi)
- **Sudirman** — kawasan perkantoran, arus dominan **keluar-masuk** stasiun (pass-through, orang buru-buru ke kantor, E rendah meski F besar)
- Hipotesis kerja: tipe simpul menentukan seberapa besar F berubah jadi E (tidak linear/otomatis)
- ⚠️ **Jangan pakai kata "outlier"** di PRD — n=2 gak punya makna statistik, kesannya lemah ke reviewer. Sebut sifatnya langsung (transit/interchange node).
- ⚠️ Ini **hipotesis awal**, bukan temuan — konsisten sama gaya hati-hati ListPandora Lampiran 2. Terutama karena survey cuma 1 hari (lihat `01-DATA-SOURCES-AND-SURVEY.md`), sampel belum cukup buat klaim kuat.
- Retire eksplisit tipologi lama (hunian/perkantoran/campuran) di revisi §3.1 — jangan diam-diam diganti tanpa disebut.

## 2. Persona (dikonfirmasi Arzaka, lebih presisi dari ListPandora §4.1)

- **Persona 1**: karyawan KAI & kepala stasiun — butuh data arus ekonomi kawasan buat ambil tindakan finansial operasional (buka kios baru, dll). Lebih granular dari ListPandora (yang levelnya korporat KAI Commuter + anak usaha) — turun ke level pengambil keputusan per-stasiun.
- **Persona 2**: pengusaha — bandingin arus & pola ekonomi antar-stasiun (A vs B) buat mutusin buka toko kategori apa (FnB/baju/peralatan).
- Validasi silang: supply eksisting kedua stasiun 100% FnB (`01-DATA-SOURCES-AND-SURVEY.md` §4) → kategori non-FnB otomatis "kategori hilang", pas jadi contoh konkret value prop Persona 2.

## 3. Model monetisasi — free vs premium

Prinsip pegangan: `§4.1` & Lampiran 2 (Locus Charter, *protect the vulnerable*) ListPandora eksplisit bilang lapisan kesenjangan/kategori hilang/arus pintu **wajib terbuka** demi equity UMKM. Premium gak boleh mengunci insight dasar — hanya boleh mengunci **depth, freshness, scale** (sesuai §4.1: "kedalaman analisis per simpul, pembaruan berkala, perluasan koridor baru").

| Fitur | Free | Premium |
|---|---|---|
| Peta Potensi & Spending Gap | ✅ | — |
| Peta Kategori Hilang | ✅ | — |
| Peta Arus Pintu + Slider Waktu | ✅ | — |
| Confidence Layer | ✅ | — |
| Transparency Panel | ✅ | — |
| Peta Potensi Event/Aktivasi | ✅ | — |
| Kurva Sewa / Rent-Flow Index | Level indeks dasar | Breakdown per petak + rekomendasi harga |
| Compare View | 2 simpul | Multi-simpul/cross-koridor (kalau ekspansi) |
| AI Brief & Explain Score | Ringkasan singkat | Brief mendalam |
| Spatial Copilot | Rate-limit ketat | Rate-limit lebih tinggi |
| Export PDF/CSV | Terbatas (1 simpul) | Bulk export semua simpul |
| **`/premium/deep-analysis/:station_id`** | — | **Core premium — lihat §4** |

✅ **DISETUJUI Arzaka** — arah tiering ini yang dipakai.

## 4. `/premium/deep-analysis/:station_id` — definisi final ✅

**Simulasi kategori usaha untuk petak kosong** (what-if scenario, bukan historical trend — historical trend ditolak karena kontradiksi Out-of-Scope §3 ListPandora yang eksplisit bilang kurva sewa itu snapshot, dan data properti cuma diambil 1x).

Alur: pengguna pilih petak kosong (dari inventaris kios kosong) + kategori kandidat → sistem return estimasi potensi belanja yang bisa ditutup (rentang P10–P90) berdasarkan spending gap kategori tsb di kawasan tangkapan, + tingkat kepercayaan data (tinggi utk FnB karena diukur langsung E/C, lebih rendah utk kategori lain karena transfer value dari §3.2 ListPandora). Bisa banding 2+ kategori buat 1 petak, atau petak sama di 2 stasiun.

Kenapa ini yang dipilih (bukan historical trend):
1. Data & endpoint pendukung (spending-gap, category-gap, confidence-layer) udah direncanakan — ini recombine, bukan pipeline baru.
2. Metodologi transfer value udah dijustifikasi di proposal (§3.2), gak ngarang metode baru.
3. Langsung jawab kebutuhan Persona 1 (keputusan isi kios kosong) & Persona 2 (kategori mana yang worth dibuka).
4. Aman bahasa: "estimasi potensi penutupan gap" + rentang P10-P90, bukan "proyeksi pendapatan pasti" — konsisten Out-of-Scope.

⚠️ Perlu update `02-BACKEND-SPEC.md` §3.8 dengan definisi ini pas nulis DTO/response contract endpoint.
