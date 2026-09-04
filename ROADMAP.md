# Roadmap Frontend — Isi Stasiun

| | |
|---|---|
| Versi | `0.2` |
| Tanggal | 31 Agustus 2026 |
| Cakupan | Frontend saja (Next.js + MapLibre GL JS) |
| Dokumen terkait | [`DATA_CONTRACT.md`](DATA_CONTRACT.md) · [`USER_FLOW.md`](USER_FLOW.md) |

---

## 0. Posisi

Roadmap ini menetapkan **urutan kerja**, bukan jadwal. Tidak ada tanggal di sini — yang diatur adalah apa yang harus selesai sebelum apa, supaya tidak ada kerja yang terbuang karena dikerjakan terlalu dini.

Kondisi sekarang (**Fase 0 dan Fase 1 selesai**): halaman `/peta` sudah menampilkan peta MapLibre sungguhan di atas basemap OpenFreeMap Liberty, dan **seluruh interaksinya berfungsi memakai data contoh** — slot waktu dan kategori mengubah angka di panel sekaligus warna dan ukuran titik di peta, klik titik mengisi panel ringkasan, panel lapisan menghidupkan dan mematikan layer peta, legenda mengikuti rentang data yang sedang aktif, dan panel transparansi terbuka dari titik yang sedang dipilih. Empat halaman lain masih mockup statis. Seluruh angka masih data contoh. Belum ada koneksi ke backend.

**Berikutnya: JEDA (§4).** Fase 2 menunggu kesiapan backend — tile dan endpoint-nya belum ada, jadi belum ada yang bisa disambung.

Dua hal berubah sejak versi `0.1`, keduanya menambah pekerjaan yang bisa diselesaikan **selama jeda**:

- **Arsitektur sudah disepakati** — frontend menembak dua sumber terpisah: atribut lewat Go `/api/v1`, geometri lewat CDN tile. Dari situ ketahuan ada beberapa ketergantungan tersembunyi di kode frontend yang lebih murah dibereskan sekarang daripada nanti (§4.1).
- **Basemap GEO MAPID sudah pasti bisa dipakai** — MAPID menyediakan endpoint GL Style, yang memang format yang dibaca MapLibre. Pertanyaan terbuka di [`DATA_CONTRACT.md`](DATA_CONTRACT.md) Bagian D terjawab, dan penukaran basemap tidak lagi perlu menunggu Fase 2. Tim memutuskan basemap **disajikan lewat proxy backend**, bukan diambil browser langsung (§4.4). Sisi frontend-nya sudah selesai dan diuji langsung ke MAPID — seluruh pemeriksaan lolos, termasuk font dan POI.

Satu hal yang justru **mengecil** setelah `02-BACKEND-SPEC.md` dan `04-VALUE-PROP-AND-MONETIZATION.md` dibaca: **autentikasi bukan prasyarat Fase 2.** Seluruh fitur yang sudah dibangun berada di tier gratis, dan lapisan dasarnya wajib terbuka demi equity UMKM (Locus Charter). Auth menyusul bersama fitur premium, sebagai jalur terpisah — lihat §6.1.

Tujuan roadmap ini: membawa proyek dari **mockup statis** menjadi **WebGIS yang berfungsi**, tanpa pernah terblokir menunggu pihak lain.

---

## 1. ⚠️ Disclaimer penting — jeda antara Fase 1 dan Fase 2

**Fase 2 (sambung backend) bisa memakan waktu lama dan tidak bisa diprediksi**, karena bergantung pada kesiapan backend, pipeline tile, dan data survei lapangan.

Artinya: **setelah Fase 1 selesai, akan ada jeda.** Selama jeda itu, tampilan frontend bisa saja diubah — warna, tata letak, tipografi, komposisi panel. Perubahan itu sifatnya **murni visual, bukan fungsionalitas.**

### Konsekuensi teknis yang harus dipatuhi sejak Fase 0

Karena visual bisa berubah kapan saja saat jeda, kode di Fase 0 dan 1 **wajib** dibangun dengan pemisahan berikut:

| Lapisan | Isi | Sifat |
|---|---|---|
| **Data & logika** | pengambilan data, state filter, penggabungan tile ⇄ atribut, perhitungan turunan | Tidak boleh ikut berubah saat visual diubah |
| **Definisi gaya peta** | skala warna gap, ukuran lingkaran, gaya isochrone | Terkumpul di **satu berkas**, bukan tersebar |
| **Tampilan** | panel, tombol, tipografi, tata letak | Bebas diubah kapan saja |

**Aturan praktisnya:** mengubah warna atau tata letak tidak boleh menuntut sentuhan pada kode pengambilan data atau state filter. Kalau sampai begitu, berarti pemisahannya gagal dan harus dirapikan sebelum masuk Fase 2.

### Jeda itu justru waktu yang tepat untuk

- **Responsivitas** — lihat §6, ini janji proposal yang belum ada pemiliknya
- Perbaikan tipografi, spasi, dan konsistensi warna
- Penyesuaian tampilan setelah desain dinilai ulang
- Utang teknis di §6

Karena semuanya pekerjaan visual, semuanya aman dikerjakan di jeda tanpa mengganggu rencana Fase 2.

---

## 2. Fase 0 — Peta jadi nyata

**Tidak menunggu siapa pun.** Ini lompatan paling terlihat: dari mockup jadi WebGIS.

| # | Pekerjaan |
|---|---|
| 0.1 | Pasang `maplibre-gl`, buat komponen peta sebagai client component |
| 0.2 | Ganti SVG basemap palsu di `PetaScreen.tsx` dengan kanvas MapLibre |
| 0.3 | Pasang basemap sementara *(lihat catatan di bawah)* |
| 0.4 | Buat data contoh di `public/mock/` — titik pengamatan, isochrone, dan angka analitik |
| 0.5 | Render titik pengamatan: warna dan ukuran lingkaran mengikuti nilai gap |
| 0.6 | Render isochrone, dengan filter 3 / 5 / 10 menit yang berfungsi |
| 0.7 | Pastikan seluruh overlay yang sudah ada (navbar, panel kanan, legenda, panel slot waktu) tetap duduk rapi di atas kanvas peta |
| 0.8 | Kumpulkan seluruh definisi gaya peta ke satu berkas terpisah |
| 0.9 | Kontrol kamera: compass ber-umpan-balik kemiringan (klik = ratakan ke 2D di tempat) dan batas kemiringan 60° |

> **Catatan basemap:** basemap GEO MAPID belum dipastikan menyediakan tile vektor untuk MapLibre. Sementara ini dipakai **OpenFreeMap Liberty** — gratis, tanpa API key, menampilkan POI kawasan, dan punya bangunan 3D — **ditandai jelas di kode sebagai sementara**. Menukarnya nanti hanya mengubah satu URL, tapi periksa ulang font glyph-nya (lihat `LABEL_FONT`).

> **Catatan data contoh:** bentuknya mengikuti tebakan terbaik dari `DATA_CONTRACT.md` Bagian B. Kalau backend menjawab dengan bentuk berbeda, yang berubah hanya lapisan pembacaan data — bukan kode peta.

**Selesai ketika:** halaman `/peta` menampilkan peta sungguhan yang bisa digeser dan di-zoom, dengan titik dan isochrone yang tergambar dari data contoh, serta filter isochrone yang berfungsi.

---

## 3. Fase 1 — Interaksi

**Masih memakai data contoh.** Tujuannya membuat seluruh interaksi bekerja sebelum ada backend, supaya saat Fase 2 tiba hanya ada satu hal baru yang perlu didebug.

| # | Pekerjaan | Status |
|---|---|---|
| 1.1 | Filter slot waktu mengubah angka yang ditampilkan | ✅ |
| 1.2 | Klik titik pengamatan → panel ringkasan terisi sesuai titik tersebut | ✅ |
| 1.3 | Panel lapisan: hidup/matikan tiap lapisan peta | ✅ — 3 baris hidup; 2 sisanya memang belum punya data |
| 1.4 | Filter kategori usaha mengubah tampilan titik | ✅ |
| 1.5 | Legenda mengikuti skala data yang sedang aktif, bukan angka mati | ✅ |
| 1.6 | Keadaan hover dan terpilih pada titik | ✅ |
| 1.7 | Panel transparansi terbuka dari titik yang sedang dipilih | ✅ |

> **Catatan:** filter kategori dan slot **tidak menyembunyikan titik**, hanya mengubah warna dan ukurannya. Ini konsekuensi batasan `feature-state` di MapLibre, dan tidak masalah karena hanya ada ±15 titik yang semuanya memang selalu relevan ditampilkan. Lihat `DATA_CONTRACT.md` §A1.

> **Catatan 1.3 — lima baris hidup, dua memang belum punya data.**
>
> | Baris | Yang digambar |
> |---|---|
> | Kesenjangan belanja | Lingkaran berwarna dan berukuran |
> | Kepercayaan data | Halo abu — makin tebal, makin lemah datanya |
> | **Arus pintu stasiun** | **Angka `org/jam` di bawah nama titik** |
> | Indeks sewa / arus | — belum ada data |
> | Event & aktivasi | — belum ada data |
>
Baris yang ditebalkan sempat ditandai "belum ada data" **padahal variabel `F` sudah ada sejak Fase 1**. Yang belum ada waktu itu bentuk visualnya, bukan datanya — dan label yang keliru itu membuat panel ini ikut menyesatkan, persis hal yang paling dihindari proyek ini.
>
> Dua baris terakhir benar-benar kosong: `/analytics/rent-flow-index` dan `/analytics/event-potential` ada di spesifikasi backend, tapi belum ada data contohnya.
>
> **Baris "Kategori hilang" dihapus dari panel lapisan.** Sempat digambar sebagai lencana angka di sudut lingkaran, tapi panel kanan sudah menyajikannya jauh lebih baik: nama kategorinya, persen permintaan, jumlah gerai, subjudul yang menerangkan perbandingannya, dan barisnya bisa diklik untuk menyaring peta. Lencana itu cuma salinan yang kehilangan seluruh keterangan tadi dan menyisakan satu angka yang tidak bisa ditafsirkan sendirian.
>
> Ada persoalan yang lebih dalam juga: ambang "3 gerai" di proposal §5.2 sebenarnya **ambang kecukupan sampel**, bukan ambang peluang pasar. Memakainya untuk mendefinisikan "kategori hilang" membuat kondisinya **identik dengan sampel tipis** — dua nama untuk satu aturan yang sama, sementara persentase permintaan tidak ikut menentukan sama sekali. Definisi "hilang" perlu diputuskan tersendiri; lihat §7.
>
> **Baris "Potensi belanja" dihapus.** Ia menggambar cincin luar seukuran potensi, dengan maksud jarak antara cincin dan lingkaran terbaca sebagai "yang sudah tertangkap". Ternyata tidak bisa: cincin dan lingkaran memakai dua skala terpisah, sehingga dua titik dengan perbandingan potensi/gap yang **identik** (1,44) tergambar dengan jarak berbeda (1,78 dan 1,55). Membuatnya jujur menuntut skala berlabuh nol berbasis luas, yang berarti merombak ukuran lingkaran kesenjangan juga — encoding utama peta ini. Karena `gap = potensi − tertangkap` membuat ketiganya saling menyimpulkan dan angkanya sudah tersaji tepat di panel kanan, cincin itu tidak pernah menambah informasi baru. Lihat ROADMAP §7.
>
> Kawasan tangkapan (isochrone) tidak diberi baris sendiri — kemunculannya sudah ditentukan tombol 3/5/10 menit.

> **Catatan teknis 1.3 — dua jebakan MapLibre yang ditemukan saat mengerjakannya.**
>
> 1. **`feature-state` tidak berlaku di properti layout.** `text-field` adalah properti layout, jadi label tidak bisa membaca angka yang ditempel lewat `setFeatureState` — validator menolaknya dengan *"feature-state data expressions are not supported with layout properties"*. Jalan keluarnya: satu source GeoJSON kecil khusus label (`point-label-values`) yang angkanya ikut sebagai **properti fitur** dan disusun ulang tiap kali slot berganti. Ongkosnya kecil karena isinya hanya sebanyak titik pengamatan.
> 2. **Layer simbol yang ditambahkan belakangan merebut prioritas penempatan.** MapLibre menempatkan simbol dalam urutan terbalik. Waktu layer arus diletakkan sesudah nama titik, **seluruh nama lenyap dari peta tanpa satu pun pesan error**. Urutannya sekarang: arus dulu, nama titik sesudahnya — supaya yang mengalah saat sempit adalah angka arus, bukan namanya. Dikunci oleh tes di `tests/peta.spec.ts`.

**Selesai ketika:** seluruh interaksi di halaman Peta berfungsi penuh memakai data contoh — sehingga halaman itu sudah bisa didemokan apa adanya. ✅ **Tercapai.**

---

## 4. ⏸️ JEDA — posisi sekarang

Fase 1 selesai, dan proyek masuk masa tunggu backend. **Fase 2 tetap baru dimulai setelah backend siap** — bukan sekarang. Tile dan endpoint-nya belum ada.

Yang berubah dari rencana semula: jeda ini **tidak lagi hanya untuk pekerjaan visual**. Setelah arsitektur disepakati, ada beberapa persiapan yang bisa diselesaikan tanpa menyentuh backend sama sekali — dan mengerjakannya sekarang membuat Fase 2 jauh lebih pendek.

| # | Pekerjaan | Kenapa dikerjakan sekarang |
|---|---|---|
| **4.1** | **Lepaskan ketergantungan pada daftar fitur lengkap** | ✅ **Selesai.** Ketiganya sudah pindah: nama titik lewat `loadEntrances()`, nama stasiun lewat `loadStations()`, dan pandangan awal lewat `STUDY_BOUNDS`. Tidak ada lagi satu pun perulangan atas `points.features`. Lihat catatan di bawah |
| 4.2 | Pindahkan seluruh URL ke variabel lingkungan, sediakan `.env.example` | ✅ **Selesai.** `NEXT_PUBLIC_API_BASE_URL` dan `NEXT_PUBLIC_BASEMAP_URL`, keduanya dirujuk secara literal, dan `.env.example` dikomit (butuh negasi `!.env.example` di `.gitignore` supaya lolos dari aturan `.env*`) |
| 4.3 | Jadikan bounding box awal sebuah konstanta di `lib/map/config.ts` | ✅ **Selesai.** `STUDY_BOUNDS`. Siap ditimpa nilai dari TileJSON nanti, tanpa mengubah komponen |
| 4.4 | **Siapkan basemap GEO MAPID lewat proxy** (dulu butir 2.7) | ✅ **Sisi frontend selesai.** Alamat lewat env var, jalan keluar langsung tersedia, dan seluruh pemeriksaan basemap lolos. Tinggal menunggu proxy backend. Lihat catatan-catatan di bawah |
| 4.5 | Responsivitas (§6 butir 3.1), ekspor CSV/PDF (3.2 dan 3.3), utang teknis §7 | Murni frontend, seperti rencana semula. **Sebagian sudah dikerjakan:** aksesibilitas keyboard `/peta`, pesan kegagalan basemap sesudah `style.load`, dan tes untuk `lib/analytics/select.ts` — lihat §7. Responsivitas masih terbuka |

> **Catatan 4.1 — ketergantungan tersembunyi yang paling mahal kalau ditunda.**
> Selama geometri datang sebagai GeoJSON, browser memegang **seluruh daftar fitur**. Tiga tempat di kode memanfaatkan itu:
>
> | Yang dipakai | Untuk apa |
> |---|---|
> | `points.features` → `pointLabels` | Nama titik ("Pintu 4") di panel dan daftar |
> | `points.features` → `stationNames` | Nama stasiun di judul brief |
> | `points.features` → `fitBounds` | Pandangan awal supaya semua titik terlihat |
>
> Dengan tile vektor, daftar itu **tidak ada lagi** — browser hanya menerima fitur yang kebetulan masuk layar. Ketiganya harus pindah ke API (`GET /stations`, `GET /stations/:id/entrances`), dan itu **bisa dikerjakan sekarang memakai data contoh**.
>
> Kalau ditunda sampai tile datang, gejalanya menyesatkan dan sulit dilacak: peta terbuka di tempat acak, dan panel menampilkan `#24` alih-alih "Pintu 4".

> **Catatan 4.4 — basemap lewat proxy, dan kenapa jalan keluar itu wajib.**
> Tim memutuskan browser tidak menembak `basemap.mapid.io` langsung; permintaan tile diteruskan backend supaya API key tidak sampai ke browser.
>
> Konsekuensinya bagi frontend: kalau alamat basemap **hanya** menunjuk proxy, `/peta` mati total setiap kali backend belum jalan — dan itu melanggar prinsip nomor 1 di §9. Karena itu alamat basemap wajib lewat variabel lingkungan yang bisa diarahkan langsung ke MAPID saat bekerja lokal. Override `?basemap=` yang sudah ada dipertahankan.
>
> Yang harus dikerjakan **backend**, dan perlu ditagih sejak awal:
>
> | Kewajiban proxy | Kalau terlewat |
> |---|---|
> | Menulis ulang `glyphs`, `sprite`, dan `sources.*.tiles` di dalam `style.json` | Ketiganya berisi URL absolut ber-key. Browser tetap menembak MAPID **tanpa key** → 401 → peta dasar kosong. Frontend sekarang **menyebutkan** kegagalan itu di layar beserta status dan hostnya (lihat catatan di bawah), tapi tidak bisa menambalnya |
> | Header cache di endpoint tile | Peta terasa berat, dan frontend tidak bisa menambalnya |
> | Mempertahankan field atribusi | Atribusi MAPID hilang dari peta |
>
> **Jangan taruh proxy basemap di balik bearer token.** MapLibre tidak menyisipkan header sendiri ke permintaan tile/glyph/sprite — perlu `transformRequest`, dan tokennya ikut tertempel di ratusan permintaan per sesi. Lebih penting lagi: `/peta` adalah tier gratis dan wajib jalan tanpa login. Kalau proxy perlu dilindungi, pakai cookie same-origin atau pembatasan referer.

> **Hasil pemeriksaan 4.4 — GEO MAPID sudah diuji langsung.** ✅
> Style `basic` ("Street Mapid") dimuat di `localhost` lewat `.env.local`, lalu diperiksa. Keempat kekhawatiran gugur:
>
> | Yang dikhawatirkan | Hasil |
> |---|---|
> | `Noto Sans Regular` tidak tersedia → label hilang diam-diam | ✅ **Tersedia** — style itu memakainya sendiri, bersama keluarga Roboto. `LABEL_FONT` tidak perlu diubah |
> | Permintaan glyph 404 | ✅ Nol respons 4xx/5xx; 33 tes lulus dengan MAPID aktif |
> | Bangunan 3D tidak ada | ✅ Layer `building-3d` ada — nama yang sama persis dengan Liberty |
> | POI kawasan lebih sepi dari Liberty | ✅ Setara — Alfamart, Indomaret, Lawson, ATM, toko roti semuanya tampil |
>
> Sebabnya ketahuan sekaligus: **"Street Mapid" diturunkan dari OSM Liberty** — sprite-nya menunjuk `maputnik.github.io/osm-liberty` dan layer 3D-nya sama-sama `building-3d`. Karena itu berpindah di antara keduanya nyaris tidak mengubah tampilan.

> **Catatan 4.4 — kegagalan proxy tidak lagi diam.**
> Kegagalan basemap dulu hanya tertangkap kalau `style.load` tidak pernah menyala. Bentuk kegagalan yang justru paling mungkin muncul di produksi tidak seperti itu: proxy mengirim `style.json` yang sah tapi lupa menulis ulang salah satu field ber-key, sehingga style termuat **normal** lalu setiap tile 401 satu per satu. Gejalanya peta dasar kosong tanpa satu pun pesan.
>
> `MapCanvas` sekarang membaca `status` dan `url` dari `AJAXError` MapLibre dan memunculkan pesan sekali saja — *"Sebagian peta dasar gagal dimuat (HTTP 401 dari basemap.mapid.io)"*. Lapisan data tetap tergambar. Ini alat diagnosa saat proxy pertama kali dipasang, bukan pengganti kewajiban di tabel atas.

> **⚠️ Temuan 4.4 — style MAPID memanggil dua host pihak ketiga.**
> Di luar `basemap.mapid.io`, style itu menarik dari dua alamat lain yang **bukan milik MAPID dan tidak membawa API key**:
>
> | Bagian | Host | Isinya |
> |---|---|---|
> | `sprite` | `maputnik.github.io` | Seluruh ikon POI — Alfamart, Indomaret, ATM, dan lainnya |
> | `natural_earth_shaded_relief` | `klokantech.github.io` | Relief raster untuk zoom rendah |
>
> Dua akibatnya, keduanya perlu disampaikan ke backend:
>
> 1. **Mem-proxy `basemap.mapid.io` saja tidak cukup.** Browser tetap akan menembak `maputnik.github.io` langsung. Perlu diputuskan: ikut di-proxy, atau dibiarkan langsung — dibiarkan langsung aman, karena tidak ada key di sana.
> 2. **Ada ketergantungan pada GitHub Pages yang di luar kendali tim mana pun.** Kalau repo itu hilang atau layanannya mati, seluruh ikon POI lenyap dari peta. Risikonya kecil, tapi lebih baik diketahui sekarang daripada saat penjurian.

**Selesai ketika:** butir 4.1–4.4 beres, sehingga Fase 2 tinggal menukar sumber data — bukan lagi merombak komponen.

> ✅ **Butir 4.1–4.4 sudah beres dari sisi frontend.** Yang tersisa di §4 hanya 4.5, dan itu tidak memblokir apa pun. Fase 2 kini benar-benar tinggal menunggu tile dan endpoint dari backend.

---

## 5. Fase 2 — Sambung ke backend

> ⏸️ **Fase ini belum dimulai.** Backend belum siap — tile dan endpoint-nya belum ada. Yang bisa dikerjakan sekarang ada di §4.

**Bergantung pada kesiapan backend.** Kalau §4 beres, fase ini pendek — karena yang berubah tinggal sumber datanya, bukan komponennya.

| # | Pekerjaan frontend | Prasyarat dari backend |
|---|---|---|
| 2.1 | Tukar sumber geometri dari GeoJSON ke tile vektor: `SOURCE` jadi `type: "vector"`, dan **keenam spesifikasi layer** di `lib/map/style.ts` wajib menambahkan `source-layer` — sekarang tidak ada sama sekali karena GeoJSON tidak memakainya | URL template tile + nama `source-layer` + **CORS di CDN tile**, bukan hanya di Go API |
| 2.2 | Tukar data contoh dengan panggilan API — cukup `BASE` di `lib/data/source.ts` | Endpoint aktif + CORS |
| 2.3 | Gabungkan tile dengan atribut lewat `setFeatureState` | ID fitur berupa integer; kalau bukan, sediakan properti integer supaya bisa dipakai `promoteId` |
| 2.4 | Terapkan ulang state saat tile baru dimuat (event `sourcedata`) | — ✅ **sudah berjalan sejak Fase 1**, termasuk untuk penanda terpilih |
| 2.5 | Tangani keadaan memuat, gagal, dan kosong untuk **dua origin terpisah** — Go API dan CDN tile bisa gagal sendiri-sendiri | — |
| 2.6 | Tangani titik bersampel tipis — tidak diestimasi, bukan gap nol | Flag pembeda dari backend |
| 2.7 | ~~Tukar basemap ke GEO MAPID~~ → **dipindah ke §4.4**, karena tidak butuh backend | — |
| 2.8 | Sisipkan header `Authorization` di satu titik pada `lib/data/source.ts` — diam saja selama token belum ada | — ✅ **bisa dicicil di §4**, dan **bukan prasyarat**: enam endpoint peta ada di tier gratis |

> **Catatan 2.8 — autentikasi tidak memblokir fase ini.**
> `02-BACKEND-SPEC.md` §1 menetapkan JWT untuk membedakan publik (gratis) dari operator kawasan (berbayar), tetapi `04-VALUE-PROP-AND-MONETIZATION.md` §3 menegaskan lapisan dasar — spending gap, kategori hilang, arus pintu, confidence layer, panel transparansi — **wajib terbuka** demi equity UMKM (Locus Charter, *protect the vulnerable*).
>
> Artinya enam endpoint yang dikonsumsi halaman Peta **tidak butuh token**, dan `/peta` **tidak boleh** berada di balik dinding login. Itu keputusan kebijakan, bukan kelalaian — jadi jangan "dirapikan" belakangan dengan menambahkan proteksi rute global. Pekerjaan auth yang sesungguhnya ada di §6.1.

**Selesai ketika:** halaman Peta menampilkan data sungguhan dari backend, dan data contoh sudah tidak dipakai lagi.

---

## 6. Fase 3 — Sisa janji proposal

Fitur-fitur yang **dijanjikan di proposal** tapi belum ada di kode. Sebagian bisa dikerjakan lebih awal karena tidak butuh backend.

| # | Pekerjaan | Sumber janji | Butuh backend? |
|---|---|---|---|
| 3.1 | **Responsivitas** — layout sekarang memakai kolom lebar tetap dan akan berantakan di bawah ±1100px | §5.3 Tahap 4 | ❌ Tidak — **cocok dikerjakan saat jeda** |
| 3.2 | **Ekspor CSV** tabel analisis | §3.2 | ❌ Tidak — bisa sepenuhnya di frontend |
| 3.3 | **Ekspor PDF** brief simpul | §3.2 | ❌ Tidak — bisa sepenuhnya di frontend |
| 3.4 | **Tabel atribut** | §3.2 | ⚠️ Sebagian |
| 3.5 | **Bandingkan dua simpul berdampingan** | §3.2 | ⚠️ Sebagian |
| 3.6 | **Copilot AI** tersambung ke `POST /copilot/query` | §3.4 | ✅ Ya |
| 3.7 | **Pembanding akhir pekan** — proposal menjanjikan satu sampel akhir pekan sebagai pembanding. UI-nya sudah ada tempatnya di panel slot (ditandai "belum dicacah"), tapi belum ada datanya dan belum ada cara memilihnya | §5.2 | ✅ Ya — butuh survei akhir pekan + `day_type` dari backend |

> Tombol "Bandingkan", "Tabel atribut", "Unduh brief", dan "Brief PDF" di UI sekarang sengaja dibuat mati. Semuanya adalah janji proposal, bukan hiasan — jadi perlu masuk daftar pekerjaan sadar, bukan dilupakan.

> **Catatan 3.7.** `day_type` sudah ada di `lib/data/types.ts` sejak Fase 0, tapi nilainya selalu `weekday` dan tidak ada satu pun kendali yang mengubahnya. Jadi jenis hari sekarang adalah sumbu yang terpasang di tipe data tapi belum terpasang di UI — perlu diputuskan bentuk kendalinya saat datanya ada.

### 6.1 Auth dan tier berbayar — jalur terpisah

**Bukan bagian dari Fase 2.** Halaman Peta tetap terbuka tanpa login; yang butuh auth hanyalah fitur premium, dan UI-nya belum ada sama sekali.

| # | Pekerjaan | Catatan |
|---|---|---|
| 6.1.1 | Halaman login (`POST /auth/login`) | Belum ada di kelima layar mana pun |
| 6.1.2 | **Keputusan penyimpanan token** | Cookie `httpOnly` (aman dari XSS, butuh CORS credentials dan kerja sama backend) · memori saja (aman, tapi login ulang tiap refresh) · `localStorage` (terbuka terhadap XSS). Perlu diputuskan bersama backend, bukan belakangan |
| 6.1.3 | Alur refresh (`POST /auth/refresh`) | 401 → refresh → ulangi sekali → logout. Jaga dua jebakan: perulangan tak berujung, dan beberapa request paralel yang me-refresh berbarengan |
| 6.1.4 | Proteksi rute **hanya untuk area premium** | `/peta` tetap terbuka — lihat catatan 2.8 |
| 6.1.5 | `/premium/deep-analysis/:station_id` | Layar baru: pilih petak kosong + kategori kandidat → estimasi P10–P90 + kepercayaan. Belum ada di [`USER_FLOW.md`](USER_FLOW.md) |

> **⚠️ Tiering itu batas, bukan gembok — dan ini memengaruhi 3.2, 3.3, 3.5, dan 3.6.**
> `04-VALUE-PROP-AND-MONETIZATION.md` §3 tidak mengunci fitur, melainkan membatasi sebagiannya:
>
> | Fitur | Gratis | Premium |
> |---|---|---|
> | Bandingkan (3.5) | 2 simpul | Multi-simpul / lintas koridor |
> | Ekspor PDF & CSV (3.2, 3.3) | 1 simpul | Bulk seluruh simpul |
> | Copilot (3.6) | Rate-limit ketat | Rate-limit lebih tinggi |
> | AI Brief | Ringkasan singkat | Brief mendalam |
>
> Keempatnya **harus dibangun dengan batasan tier sejak awal**, lengkap dengan keadaan "batas tercapai · upgrade" di layar. Menyisipkannya setelah fiturnya jadi jauh lebih mahal daripada memasangnya dari awal.

---

## 7. Utang teknis

Kecil-kecil, bisa disisipkan kapan saja. Semuanya aman dikerjakan saat jeda.

| Hal | Catatan |
|---|---|
| ~~**Angka "n < 30" di halaman Insight**~~ | ✅ Selesai. Insight kini membaca `usePetaData()` + `select.ts` lewat provider `InsightData`; kartu sampel tipis menulis "3 gerai × 2 blok" dari `sample_meta`, bukan `n < 30` yang dikarang. Dikunci `tests/insight.spec.ts` |
| **Seluruh angka masih data contoh** | Wajar untuk sekarang, tapi footer tiap halaman harus tetap menyatakan "angka bersifat ilustratif" sampai data asli masuk. Keempat layar statis sekarang sudah menyatakannya — Insight sempat tidak punya footer sama sekali, padahal justru yang paling padat angka karangan |
| ~~**Beranda mengarang angka yang dibantah datanya sendiri**~~ | ✅ Selesai. Kartu simpul di Beranda dulu menulis "Stasiun A/B/C" dengan tipologi dan jumlah pintu yang bertentangan dengan `stations.json` (Stasiun C disebut 5 pintu, datanya 3). Sekarang Beranda membaca `usePetaData()` + `lib/analytics/select.ts`, sumber yang sama dengan halaman Peta, jadi keduanya mustahil berbeda |
| **Dua layar masih memakai sistem desain lama** | Metodologi dan Rekomendasi. Beranda dan Insight sudah pindah ke sistem "laporan instrumen" (kertas hangat, tangga tipografi/ruang/radius yang sungguhan, hairline menggantikan isi kartu, biru dikunci untuk data) yang hidup berdampingan di `globals.css` lewat scope `.paper-canvas`. Sengaja belum disatukan: token lama masih dibaca `body`, `.page-canvas`, dan kedua layar itu. Dimigrasi satu layar per kali, bukan dengan mengubah token lama — Insight jadi contoh mekanismenya: primitif bersama dipindah ke `components/paper/`, daun data ke `components/insight/`, `globals.css` tidak disentuh. **Tapi komposisinya bebas per layar**: Beranda majalah bersection (pita pastel full-bleed, numeral raksasa). Insight (putaran 4) memakai grid kartu **full-width dan padat** yang strukturnya dipinjam dari Metodologi/Rekomendasi — tanpa `.wrap`, section membentang selebar layar, tiap section grid berisi 2–3 kartu; latar kartu **bergilir menempuh mayoritas palet Beranda** (`--tile-sky/-mint/-violet/-rose`, `--data-wash`, `--field-wash`, `--paper-2`) di atas **satu latar `--paper` yang tidak pernah berganti warna** (itu batas antara "kartu bertint bergilir" dan "pemisahan halaman"), plus satu kartu hero `.ink-band`. Isi analitiknya: strip KPI, peringkat batang per pintu, pembacaan F×E×C×V, kolom "Menahan" di matriks. Tanpa pita full-bleed, `--tile-*` band, maupun `KickerBernomor`. (Tiga komposisi Insight lain — bersection ala Beranda, esai satu kolom, dan grid satu-panel-per-section yang terlalu lengang — sempat dibuat lalu ditolak.) Metodologi/Rekomendasi tidak wajib meniru salah satunya |
| ~~**Slot "sore" tertulis 16–19**~~ | ✅ Selesai di Fase 1. `lib/data/dimensions.ts` memisahkan `label` (tulisan di tombol, tetap "16–19" mengikuti desain) dari `jam` (rentang sesungguhnya, "16.00–18.59"), dan `jam` muncul sebagai tooltip tombol serta di panel transparansi |
| **Tipologi Manggarai** | Proposal menyebut tiga tipologi, Manggarai adalah kasus transit. Perlu diputuskan tim. Tidak lagi memblokir Insight — setelah reskin, Insight tidak merender klaim tipologi apa pun (dulu ada tabel uji hipotesis hunian/campuran/perkantoran; dibuang karena skema itu sudah dipensiun dan tidak ada di payload) |
| **`F × E × C × V` tidak menghasilkan `gap`** | Di data contoh, mengalikan keempat variabel tidak menghasilkan angka kesenjangan yang ditampilkan di sebelahnya — keduanya dikarang terpisah saat Fase 0. Panelnya jujur menampilkan apa yang ada di data, jadi ini bukan bug kode, tapi bertabrakan dengan janji "setiap angka bisa dilacak" (§9 nomor 4). Perlu diputuskan saat Fase 2: backend mengirim variabel yang konsisten, atau data contohnya yang diturunkan dari rumus |
| **Definisi "kategori hilang" masih rancu** | Saringannya memakai ambang 3 gerai, padahal angka itu di proposal §5.2 adalah ambang **kecukupan sampel**, bukan ambang peluang pasar. Akibatnya "kategori hilang" dan "sampel tipis" jadi kondisi yang persis sama, dan persentase permintaan cuma dipakai mengurutkan — tidak menentukan. Perlu diputuskan: "hilang" itu berarti gerai = 0, atau permintaan tinggi dengan gerai sedikit? Terkait langsung dengan urutan daftarnya, yang sekarang membuat Apotek dengan **nol gerai** terpotong dari tiga besar. Insight kini menampilkannya sebagai matriks Terisi/Kurang/Kosong (`gerai_count` vs ambang 3) plus kolom "Menahan" (gap kategori pada slot pagi) dan kartu sorotan "paling menganga" — itu ember tampilan, bukan jawaban atas definisinya; keputusannya tetap terbuka |
| **Potensi belanja tidak punya lapisan peta** | Angkanya tetap tampil di panel kanan dan di situ sudah tepat. Yang dihapus lapisan petanya, karena cincin berskala terpisah membuat jarak antar-titik tidak bisa dibandingkan. Kalau suatu saat potensi perlu tampil di peta, syaratnya skala berlabuh nol berbasis luas yang dipakai bersama lingkaran kesenjangan |
| **Dua baris lapisan tanpa data** | *Indeks sewa / arus* dan *Event & aktivasi*. Keduanya punya endpoint di spesifikasi backend (`/analytics/rent-flow-index`, `/analytics/event-potential`) tapi belum ada data contohnya. *Kategori hilang* dan *Arus pintu* sudah selesai — lihat catatan §3 |
| ~~**Tidak ada variabel lingkungan sama sekali**~~ | ✅ Selesai di §4.2. `NEXT_PUBLIC_API_BASE_URL` dan `NEXT_PUBLIC_BASEMAP_URL` keduanya dirujuk literal — Next.js menyisipkan nilainya dengan mencocokkan teks, jadi rujukan lewat variabel perantara menghasilkan `undefined` |
| **Modal transparansi belum menjebak fokus** | Sudah punya `role="dialog"`, Esc, dan fokus awal yang pindah ke dalam. Yang belum: Tab masih bisa keluar dan menyusuri panel di baliknya yang sedang tertutup lapisan gelap. Dikerjakan bersama responsivitas, karena menyentuh JSX yang sama |
| **`setFeatureState` dan `setFilter` dipanggil pada setiap `sourcedata`** | `sourcedata` juga menyala untuk tile basemap, jadi selama peta digeser keduanya dipanggil berkali-kali per detik dengan nilai yang identik — MapLibre tidak membandingkan isinya, layer ditandai kotor tiap kali. Tak terasa pada 10 titik. **Kerjakan tepat sebelum Fase 2**, bukan sekarang: saring `e.sourceId` lebih dulu, dan bentuk akhirnya baru jelas setelah source-nya jadi tile vektor (2.1) |
| ~~**Autentikasi belum pernah dibahas**~~ | ✅ Terjawab. `02-BACKEND-SPEC.md` §1 memakai JWT, tapi enam endpoint peta ada di tier gratis dan tidak butuh token. Pekerjaan auth pindah ke §6.1 sebagai jalur terpisah |

---

## 8. Peta ketergantungan

Ringkasan apa yang memblokir apa:

| Pekerjaan | Terblokir oleh |
|---|---|
| Fase 0 dan 1 | ✅ selesai |
| **4.1 lepas ketergantungan daftar fitur** | ✅ **Selesai** |
| 4.2 variabel lingkungan | ✅ **Selesai** |
| 4.3 bounding box konstanta | ✅ **Selesai** |
| **4.4 siapkan basemap GEO MAPID** | ✅ **Sisi frontend selesai dan sudah diuji.** Penayangan lewat proxy menunggu backend |
| Fase 2 seluruhnya | Kesiapan backend (tile + endpoint) — **belum siap** |
| 2.8 sisip header `Authorization` | **Tidak ada** — bisa dicicil sekarang, bukan prasyarat |
| 6.1 auth dan tier berbayar | Kesiapan endpoint `/auth/*` dan `/premium/*` — **jalur terpisah, tidak memblokir Fase 2** |
| 3.1 responsivitas | **Tidak ada** — cocok saat jeda, dan sebaiknya sekalian dengan jebakan fokus modal (§7). Beranda sudah memakai `clamp()` dan grid 12 kolom sehingga bertahan sampai ±1100px; tiga layar lain belum |
| 3.2 dan 3.3 ekspor | **Tidak ada** — murni frontend |
| 3.6 copilot | Kontrak `POST /copilot/query`, belum dibahas |
| 3.7 pembanding akhir pekan | Survei akhir pekan + `day_type` dari backend |
| Angka sungguhan di seluruh halaman | Survei lapangan + pipeline batch |

---

## 9. Prinsip yang dipegang sepanjang roadmap

1. **Jangan pernah menunggu.** Kalau satu jalur terblokir, kerjakan jalur lain. Data contoh ada supaya frontend tidak pernah berhenti.
2. **Visual harus bisa diganti tanpa menyentuh logika.** Lihat §1 — ini bukan preferensi gaya, ini syarat supaya jeda antara Fase 1 dan 2 bisa dimanfaatkan.
3. **Frontend menyesuaikan backend.** Arsitektur, penamaan, dan format mengikuti mereka. Lihat `DATA_CONTRACT.md` §0.
4. **Setiap angka di layar harus bisa dilacak asalnya.** Ini janji utama proposal ke juri — tidak boleh ada angka yang muncul entah dari mana.
