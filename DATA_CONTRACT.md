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

## B4. Ringkasan simpul — `GET /analytics/station-summary` *(baru, milik Arzaka)*

Satu tingkat di atas B2: B2 per **pintu**, ini per **stasiun sebagai kawasan** —
bahan strip "Ringkasan simpul" di `/insight` dan (nanti) fitur "Bandingkan"
(ROADMAP 3.5). Endpoint ini dipegang Arzaka, di paket Go sendiri
(`internal/summary/`), bukan `internal/analytics/` milik Priyapta —
`02-BACKEND-SPEC §2` sudah di-update. **Open**, tanpa token.

Bentuk (satu baris per stasiun, urut kesenjangan harian terbesar): `station_id`,
`station_name`, `typology` (= `stations.area_type`), `day_type`, `pintu_dicacah`,
`pintu_ditahan`, `potensi`/`tertangkap`/`gap` (masing-masing `{p10,p50,p90}`),
`capture_rate` (= `tertangkap.p50 / potensi.p50`, boleh `null`), `confidence`
(`{min,max}` atau `null`), `struk_terbaca`, `peak` (`point_label`, `time_slot`,
`f`/`e`/`c`/`v`, `gap`), `composition[]` (`category`, `demand_share`,
`gerai_count`, `is_missing`), `basis`, `computed_at`.

**Aturan agregasi (supaya "setiap angka bisa dilacak" tidak dilanggar):**

| Angka | Dari mana | Bukan |
|---|---|---|
| `gap`/`potensi`/`tertangkap` P10–P90 | simulasi Monte Carlo **setingkat simpul** (`basis: "monte-carlo-simpul"`) — angka yang memang dihitung pipeline | penjumlahan P10/P50/P90 titik di layar (dilarang — ROADMAP §9.4) |
| `capture_rate` | rasio `tertangkap.p50 / potensi.p50` — rasio dari angka yang ada, seperti `capturePersen` di Insight | — |
| `peak.f/e/c/v` + `peak.gap` | titik berkesenjangan terbesar simpul, slot puncaknya, **sama persis** dengan `spending-gap` | rata-rata "sehari" (F×E×C×V cuma dicacah per slot) |
| `composition[].gerai_count` | jumlah gerai kategori di titik puncak — titik yang sama yang dibaca matriks Insight | inventaris yang dikarang terpisah |
| `is_missing` | `gerai_count < 3` (ambang §5.2, sama dengan `select.ts` `AMBANG_GERAI`) | — |

Data contoh: `public/mock/station-summary.json`, dikunci konsisten dengan
`spending-gap.json` oleh `tests/summary.spec.ts` (titik puncak, F/E/C/V, jumlah
gerai, struk). Fase 2 tukar `loadStationSummary()` ke endpoint — komponen tak
tersentuh.

**Pertanyaan yang masih menganggur** (sama untuk endpoint per-titik, dikumpulkan di sini):

| # | Hal | Catatan |
|---|---|---|
| a | Envelope backend `{success, message, data}`, frontend `unwrap()` cek `{success, data, error}` | `error` tidak pernah dikirim backend. Perlu disamakan — ubah `unwrap()` atau tambah `error` di envelope |
| b | Kunci kategori | backend `makanan_minuman`/`ritel_kemasan`/`apotek_kesehatan`/`jasa`/`lainnya`; frontend `fnb`/`ritel`/`apotek`/`jasa`/`lainnya`. Butuh satu peta terjemahan di `source.ts` |
| c | Kunci slot | backend `morning`/`midday`/`evening`/`night`; frontend `pagi`/`siang`/`sore`/`malam` |
| d | ID stasiun | backend UUID, mock frontend integer (`1`,`2`). Lihat §A2 nomor 1 — `setFeatureState` butuh integer, jadi butuh `numeric_id` atau peta id di `source.ts` |

## B5. Sewa — `GET /analytics/rental-assets` + `GET /analytics/rent-flow-index` *(baru)*

Lapisan "Indeks sewa / arus" di panel `/peta`. **Dua endpoint, dua arti, dua
pemilik** — sengaja tidak disatukan:

| Endpoint | Pemilik | Menjawab | Paket Go |
|---|---|---|---|
| `/analytics/rental-assets` | Arzaka | "petak apa saja yang ada, di mana, terisi atau kosong" | `internal/rental/` (`AssetResponse`) |
| `/analytics/rent-flow-index` | **Priyapta** | "berapa mahal tiap orang yang lewat" | `internal/analytics/` (`RentFlowIndexResponse`) |

Keduanya **open**, tanpa token — lapisan analitik dasar tetap gratis
(`04-VALUE-PROP-AND-MONETIZATION §3`).

**Bentuk `rental-assets`** (satu baris per petak): `id`, `station_id`,
`station_name`, `station_code`, `source_id`, `data_source`
(`space_kai` | `field_survey`), `location_name`, `plot_name`, `area_name`,
`latitude`, `longitude`, `land_area`, `building_area`, `rented`,
`availability_status` (`occupied` | `available` | `needs_verification`),
`commercial_value`, `commercial_value_visible`, `source_updated_at`, `note`.

**Bentuk `rent-flow-index`** (satu baris per petak yang terukur): `plot_id`,
`station_id`, `offered_rent`, `measured_flow`, `index`, `is_outlier`.

Nama medannya ditiru **persis**, `snake_case` dan semua — termasuk `index` yang
bukan bahasa Indonesia. Frontend sengaja tidak menerjemahkannya: tiap medan yang
di-rename berarti satu lapisan pemetaan tambahan yang harus ditulis dan dijaga,
padahal Fase 2 seharusnya cuma menukar isi `source.ts`.

**Aturan yang harus dijaga kedua sisi:**

| Hal | Aturan | Alasan |
|---|---|---|
| Penggabungan | `rent_flow_index.plot_id` cocok ke `rental_assets.source_id`, **bukan** `id` | `plot_id` adalah id petak dari sumbernya (blokid Space KAI), bukan primary key baris aset |
| Petak tanpa indeks | `index: null`, dan di peta **tanpa label sama sekali** | "Rp 0" berarti gratis; yang benar adalah "belum terukur". Sewa in-station Sudirman memang tidak ada di API KAI (sudah diperiksa per koordinat) |
| `commercial_value` | hampir selalu `null` di tier publik | KAI menandai nilai komersial tenant tidak untuk ditampilkan (`nilaikomersialvis: false`); backend menghapusnya dari response saat flag itu mati. Jangan ditambal dari sumber lain |
| `is_outlier` | ditandai backend, frontend hanya menggambar | supaya ambang pencilan tidak pernah punya dua definisi |
| Petak tanpa koordinat | tidak digambar | listing pasar sekitar (99.co) seluruhnya level kawasan tanpa titik presisi; menaruhnya di koordinat karangan melanggar janji keterlacakan |

Data contoh: `public/mock/rental-assets.json` (8 petak Space KAI Manggarai + 3
kios survei Sudirman) dan `public/mock/rent-flow-index.json` (8 petak Manggarai;
`measured_flow` = arus masuk terukur kedua pintu Manggarai pada blok pagi).
Angkanya nyata, bukan karangan — sumbernya `isistasiun-ai/data/source/rent/`.
Pertanyaan menganggur a–d di §B4 berlaku sama di sini (envelope, id stasiun).

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
