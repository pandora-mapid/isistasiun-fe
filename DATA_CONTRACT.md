# Kontrak Data — Isi Stasiun

**Frontend (Next.js + MapLibre GL JS) ⇄ Backend (Go REST API + Vector Tiles)**

| | |
|---|---|
| Versi | `0.2-draf` |
| Tanggal | 26 Agustus 2026 |
| Status | Draf |
| Penyusun | Adiansyah (frontend) |

---

## 0. Posisi dokumen ini

**Frontend menyesuaikan backend.** Arsitektur, penamaan endpoint, format response, dan pembagian tugas mengikuti `BACKEND_TASK_DIVISION_3_PERSON.md` sepenuhnya. Dokumen ini tidak mengusulkan perubahan arsitektur.

Isinya dibagi tiga, dan pembagian ini penting:

| Bagian | Isi | Perlu tindakan backend? |
|---|---|---|
| **A** | Yang sudah disepakati sebelumnya | Sudah dikirim, tinggal dikonfirmasi |
| **B** | Yang frontend perlu **tahu** | Tidak. Cukup beri tahu bentuk yang kalian pakai |
| **C** | Usulan opsional | Boleh ditolak, frontend tetap jalan |

> Bagian B bukan permintaan mengubah apa pun. Frontend hanya perlu tahu bentuk data yang akan dikirim supaya bisa menulis kodenya. Bentuknya terserah backend — beri tahu saja, frontend yang menyesuaikan.

---

# BAGIAN A — Sudah disepakati

Tidak ada yang baru di bagian ini. Semuanya sudah disampaikan ke backend sebelumnya.

## A1. Kolom statis di dalam tile

Sudah dikirim ke tim backend. Ringkasnya: saat `ST_AsMVT()`, sekalian sertakan kolom yang tidak pernah berubah.

**Layer `observation_points`** (Point)

| Properti | Tipe | Contoh |
|---|---|---|
| `id` | integer | `12` |
| `station_id` | integer | `2` |
| `station_name` | string | `"Sudirman"` |
| `point_label` | string | `"Pintu 4"` |
| `type` | string | `"entrance"` |

**Layer `isochrones`** (Polygon)

| Properti | Tipe | Contoh |
|---|---|---|
| `id` | integer | `45` |
| `point_id` | integer | `12` |
| `duration_min` | integer (3/5/10) | `5` |

> `duration_min` adalah yang paling krusial. MapLibre tidak mengizinkan `feature-state` dipakai di dalam `filter` — hanya di `paint`/`layout`. Kalau `duration_min` datang dari API, tombol 3/5/10 menit tidak bisa menyembunyikan poligon. Ini batasan library, bukan preferensi.

## A2. Enam syarat teknis

Sudah disampaikan sebelumnya. Kalau ada yang tidak bisa dipenuhi, beri tahu — frontend akan cari jalan lain.

| # | Syarat | Kenapa |
|---|---|---|
| 1 | **ID fitur berupa integer**, bukan UUID | `setFeatureState` hanya menerima integer. Kalau UUID, join gagal total dan tidak bisa diakali dari frontend. Solusi kalau sudah terlanjur UUID: sediakan kolom `numeric_id` khusus tile |
| 2 | **ID sama persis di tile dan API** | Kalau tile kirim `12` (int) dan API kirim `"12"` (string), join gagal diam-diam tanpa error |
| 3 | **URL template tile + nama `source-layer`** | Tanpa dua string ini frontend tidak bisa menulis satu baris pun kode peta |
| 4 | **EPSG:4326, urutan `[longitude, latitude]`** | Kalau tertukar, titik muncul di Samudra Hindia |
| 5 | **CORS untuk `localhost:3000`** | Kalau terlewat, frontend mentok dengan error yang menyesatkan |
| 6 | **Field `type` di `/entrances`** | Supaya Manggarai (titik cacahnya di koridor transit, bukan pintu) muat di skema yang sama. Nama endpoint tetap `/entrances`, cukup datanya membawa `type` |

---

# BAGIAN B — Yang frontend perlu tahu

**Tidak ada permintaan mengubah apa pun di sini.** Backend kirim dengan bentuk apa pun yang kalian pakai — frontend yang menyesuaikan. Yang dibutuhkan hanya: **beri tahu bentuknya seperti apa.**

Cara termudah menjawab: kirim satu contoh response asli dari tiap endpoint, walaupun isinya masih data dummy. Itu sudah cukup.

## B1. Endpoint yang dipakai halaman Peta

Dari 24 endpoint, frontend hanya mengonsumsi enam ini:

| Endpoint | Dipakai untuk |
|---|---|
| `GET /stations` | daftar stasiun |
| `GET /stations/:id/entrances` | daftar titik pengamatan |
| `GET /analytics/spending-gap` | angka gap seluruh titik — **paling penting** |
| `GET /analytics/spending-gap/:station_id` | detail satu stasiun |
| `GET /analytics/category-gap` | kategori hilang |
| `GET /confidence-layer` | penanda sampel tipis |

Sisanya (survey, pipeline, auth, premium) tidak disentuh frontend.

## B2. Angka yang dibutuhkan tiap tampilan

Ini **daftar kebutuhan**, bukan struktur yang harus ditiru. Nama field dan susunannya terserah backend.

**Panel ringkasan simpul**

| Yang ditampilkan | Butuh data |
|---|---|
| "Kesenjangan belanja Rp X – Y" | gap P10 dan P90 |
| Bar rentang P10/median/P90 | gap P10, P50, P90 |
| "Potensi Rp X − tertangkap Rp Y" | potensi P50, tertangkap P50 |
| Uraian F × E × C × V | keempat variabel |

**Bar "Kesenjangan per pintu"** — gap per titik pengamatan, plus penanda titik yang sampelnya tipis.

**Lingkaran di peta** — gap per titik (untuk warna dan ukuran), plus penanda sampel tipis.

**Panel "Kategori hilang"** — per kategori: persentase permintaan dan jumlah gerai.

## B3. Pertanyaan yang perlu dijawab

Semuanya pertanyaan, bukan permintaan:

| # | Pertanyaan | Kenapa frontend perlu tahu |
|---|---|---|
| 1 | Rupiah dikirim sebagai integer (`1800000`), float, atau string? | Menentukan cara frontend memformat jadi `Rp 1.800.000` |
| 2 | `E` dan `C` dikirim sebagai `0.064` atau `6.4`? | Kalau salah tafsir, angka persen meleset 100× |
| 3 | `confidence` skalanya 0–1 atau 0–100? | Menentukan lebar bar kepercayaan |
| 4 | Kunci kategori usaha memakai string apa persisnya? | Harus sama huruf per huruf. Frontend sekarang memakai `fnb`, `ritel`, `apotek`, `jasa`, `lainnya` — silakan diganti kalau backend pakai yang lain |
| 5 | Kunci slot waktu memakai string apa? | Frontend sekarang memakai `06-09`, `11-14`, `16-19`, `19-21` |
| 6 | Angka gap tersedia per slot waktu, atau hanya total harian? | Menentukan apakah tombol slot waktu bisa mengubah angka |
| 7 | Titik bersampel tipis dikirim seperti apa? | Lihat C1 |
| 8 | Ada rincian per kategori, atau hanya agregat? | Menentukan isi panel transparansi |
| 9 | Akhir pekan dikirim bagaimana — payload terpisah ber-`day_type`, atau parameter query? | Proposal menjanjikan satu sampel akhir pekan sebagai pembanding (§5.2). Frontend sudah punya field `day_type`, tapi belum tahu cara memintanya |

> **Catatan — bentuk yang sekarang ditembak frontend.** Selama Fase 1, data contoh dilengkapi supaya seluruh interaksi bisa dibangun. Bentuk di bawah ini **tebakan, bukan permintaan**:
>
> - tiap titik punya `by_slot[]`, dan tiap slot membawa `gap`, `potensi`, `tertangkap`, `variables`, serta `by_category[]`
> - tiap entri `by_category[]` membawa `gap`/`potensi`/`tertangkap`, `demand_share`, `gerai_count`, `nilai_transaksi`, dan `sampel_tipis`
> - tiap titik punya `evidence` (`struk_total`, `struk_terbaca`, `struk_ambigu`) untuk panel transparansi
> - `sampel_tipis` per kategori mengikuti ambang proposal §5.2: kurang dari 3 gerai, atau kurang dari 2 blok
>
> Kalau backend memakai bentuk lain, yang berubah hanya `lib/data/types.ts` dan `lib/data/source.ts`. **Yang benar-benar dibutuhkan cuma dua:** angka gap tersedia per slot **dan** per kategori (kalau hanya agregat, filter kategori tidak bisa berfungsi), serta ada flag yang membedakan "tidak diestimasi" dari "hasilnya nol" (lihat C1).

---

# BAGIAN C — Usulan opsional

**Semua di bagian ini boleh ditolak.** Frontend tetap jalan tanpanya. Ditulis terpisah supaya gampang dijawab ya/tidak.

## C1. 🟡 Sampel tipis dikirim `null`, bukan `0`

**Ini usulan baru, belum pernah dibahas sebelumnya.**

Proposal menyatakan kawasan bersampel tipis "tidak diberi estimasi" dan "tidak dibaca aman maupun bermasalah" (§3.2, Lampiran 2). Kalau backend mengirim `0` untuk titik semacam itu, peta akan mewarnainya sebagai **gap terkecil** — kebalikan dari maksudnya.

Usulan: kirim `null` untuk nilai rupiahnya, plus flag `sampel_tipis: true`.

**Kalau backend lebih suka pakai `0` plus flag,** juga tidak masalah — frontend bisa memeriksa flag-nya lebih dulu. Yang penting **ada flag yang membedakan "tidak diestimasi" dari "hasilnya nol"**. Bentuknya terserah.

## C2. 🟡 Satu endpoint bundel untuk peta

Sekarang menggambar satu tampilan peta butuh 5 request terpisah. Kalau ada satu endpoint yang mengembalikan semuanya sekaligus, peta tidak muncul bertahap-tahap.

Bukan hal mendesak — frontend bisa memanggil kelimanya. Ditulis saja kalau-kalau mudah dibuat.

## C3. 🟡 Endpoint GeoJSON sebagai cadangan

Kalau pipeline tile belum siap, endpoint yang mengembalikan data yang sama dalam GeoJSON biasa (`ST_AsGeoJSON`) memungkinkan frontend mulai bekerja lebih awal, sekaligus jadi cadangan kalau setup CDN molor.

Bukan pengganti tile — hanya jaring pengaman.

---

# BAGIAN D — Keputusan tim, bukan backend

Ini urusan internal, tidak perlu jawaban dari backend:

| Hal | Catatan |
|---|---|
| **Tipologi Manggarai** | Proposal §3.1 menyebut tiga tipologi: hunian, perkantoran, campuran. Manggarai dipilih sebagai kasus transit — jadi tipologi keempat, atau dimasukkan ke `campuran`? Memengaruhi klaim di halaman Insight |
| **Stasiun ketiga** | Manggarai dan Sudirman sudah ada. Yang ketiga (hunian) belum |
| **Kecepatan jalan kaki isochrone** | Proposal tidak menyebut angkanya. Perlu dikunci karena menentukan bentuk poligon |
| ~~**Basemap GEO MAPID**~~ | ✅ **Terjawab.** MAPID menyediakan endpoint **GL Style** (`style.json`) — persis format yang dibaca MapLibre, lengkap dengan bangunan 3D. Tim memutuskan basemap **disajikan lewat proxy backend**, bukan diambil browser langsung, supaya API key tidak sampai ke browser. Lihat catatan di bawah |
| **Ekspor PDF & CSV** | Dijanjikan proposal §3.2. Bisa dikerjakan sepenuhnya di frontend, tanpa backend |
| **Ambang sampel tipis** | Proposal §5.2: minimal 3 gerai × 2 blok per kategori per stasiun. Angka "n < 30" di halaman Insight sekarang keliru dan perlu diperbaiki |

---

> **Catatan basemap lewat proxy — tiga kewajiban yang harus dipenuhi backend.**
>
> `style.json` berisi URL absolut ke `glyphs`, `sprite`, dan `sources.*.tiles`, dan **ketiganya membawa API key**. Kalau proxy hanya meneruskan berkasnya apa adanya, browser tetap menembak `basemap.mapid.io` secara langsung **tanpa key** — hasilnya 401 dan peta dasar kosong, tanpa satu pun pesan error.
>
> | Kewajiban | Kalau terlewat |
> |---|---|
> | Menulis ulang `glyphs`, `sprite`, dan `sources.*.tiles` supaya menunjuk balik ke proxy | Peta dasar kosong |
> | Header cache di endpoint tile | Peta terasa berat; frontend tidak bisa menambalnya |
> | Mempertahankan field atribusi di dalam style | Atribusi MAPID hilang dari peta |
>
> **Jangan menaruh proxy basemap di balik bearer token.** MapLibre tidak menyisipkan header sendiri ke permintaan tile, glyph, dan sprite — perlu `transformRequest`, dan tokennya ikut tertempel di ratusan permintaan tiap sesi. Lebih penting lagi, halaman Peta ada di tier gratis dan wajib bisa dibuka tanpa login (lihat D2). Kalau proxy perlu dilindungi, pakai cookie same-origin atau pembatasan referer.
>
> Frontend tetap menyediakan jalan langsung ke MAPID lewat variabel lingkungan untuk pengembangan lokal, supaya `/peta` tidak ikut mati setiap kali backend belum jalan.

## D2. Autentikasi — halaman Peta tetap terbuka

`02-BACKEND-SPEC.md` §1 menetapkan JWT untuk memisahkan tier gratis dari berbayar. Yang perlu dipastikan bersama: **enam endpoint di §B1 tidak menuntut token.**

Dasarnya bukan kenyamanan frontend, melainkan `04-VALUE-PROP-AND-MONETIZATION.md` §3 — lapisan kesenjangan, kategori hilang, dan arus pintu **wajib terbuka** demi equity UMKM (Locus Charter, *protect the vulnerable*). Premium hanya boleh mengunci kedalaman, kesegaran, dan skala.

Frontend sudah menyiapkan titik sisip header `Authorization` di `lib/data/source.ts`; nilainya `null` selama belum ada login, dan seluruh halaman Peta bekerja penuh tanpanya.

---

# Cara kerja sementara

Frontend **tidak menunggu backend**. Begitu Bagian B terjawab, frontend membuat data contoh yang bentuknya sesuai jawaban itu, lalu membangun peta menembak data contoh tersebut.

Saat API siap, yang berubah hanya alamat sumber datanya — kode peta, filter, dan panel tidak tersentuh.

> Kalau Bagian B belum terjawab pun frontend tetap bisa mulai, dengan menebak bentuknya dulu. Risikonya cuma penyesuaian kecil belakangan.
