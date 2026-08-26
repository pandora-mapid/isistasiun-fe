# Roadmap Frontend — Isi Stasiun

| | |
|---|---|
| Versi | `0.1` |
| Tanggal | 26 Agustus 2026 |
| Cakupan | Frontend saja (Next.js + MapLibre GL JS) |
| Dokumen terkait | [`DATA_CONTRACT.md`](DATA_CONTRACT.md) |

---

## 0. Posisi

Roadmap ini menetapkan **urutan kerja**, bukan jadwal. Tidak ada tanggal di sini — yang diatur adalah apa yang harus selesai sebelum apa, supaya tidak ada kerja yang terbuang karena dikerjakan terlalu dini.

Kondisi sekarang: lima halaman sudah jadi sebagai **mockup statis**. Peta di halaman `/peta` masih SVG palsu. Seluruh angka masih data contoh. Belum ada koneksi ke backend.

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

> **Catatan basemap:** basemap GEO MAPID belum dipastikan menyediakan tile vektor untuk MapLibre. Sementara ini dipakai tile demo bawaan MapLibre — gratis, tanpa API key — dan **ditandai jelas di kode sebagai sementara**. Menukarnya nanti hanya mengubah satu URL.

> **Catatan data contoh:** bentuknya mengikuti tebakan terbaik dari `DATA_CONTRACT.md` Bagian B. Kalau backend menjawab dengan bentuk berbeda, yang berubah hanya lapisan pembacaan data — bukan kode peta.

**Selesai ketika:** halaman `/peta` menampilkan peta sungguhan yang bisa digeser dan di-zoom, dengan titik dan isochrone yang tergambar dari data contoh, serta filter isochrone yang berfungsi.

---

## 3. Fase 1 — Interaksi

**Masih memakai data contoh.** Tujuannya membuat seluruh interaksi bekerja sebelum ada backend, supaya saat Fase 2 tiba hanya ada satu hal baru yang perlu didebug.

| # | Pekerjaan |
|---|---|
| 1.1 | Filter slot waktu mengubah angka yang ditampilkan |
| 1.2 | Klik titik pengamatan → panel ringkasan terisi sesuai titik tersebut |
| 1.3 | Panel lapisan: hidup/matikan tiap lapisan peta |
| 1.4 | Filter kategori usaha mengubah tampilan titik |
| 1.5 | Legenda mengikuti skala data yang sedang aktif, bukan angka mati |
| 1.6 | Keadaan hover dan terpilih pada titik |
| 1.7 | Panel transparansi terbuka dari titik yang sedang dipilih |

> **Catatan:** filter kategori dan slot **tidak menyembunyikan titik**, hanya mengubah warna dan ukurannya. Ini konsekuensi batasan `feature-state` di MapLibre, dan tidak masalah karena hanya ada ±15 titik yang semuanya memang selalu relevan ditampilkan. Lihat `DATA_CONTRACT.md` §A1.

**Selesai ketika:** seluruh interaksi di halaman Peta berfungsi penuh memakai data contoh — sehingga halaman itu sudah bisa didemokan apa adanya.

---

## 4. ⏸️ JEDA — lihat §1

Setelah Fase 1 selesai, proyek masuk masa tunggu backend. Selama jeda ini pekerjaan visual bebas dilakukan. Fase 2 baru dimulai ketika backend siap.

---

## 5. Fase 2 — Sambung ke backend

**Bergantung pada kesiapan backend.** Kalau Fase 0–1 rapi, fase ini pendek — karena yang berubah hanya sumber datanya.

| # | Pekerjaan | Prasyarat dari backend |
|---|---|---|
| 2.1 | Tukar sumber tile ke URL backend | URL template tile + nama `source-layer` |
| 2.2 | Tukar data contoh dengan panggilan API | Endpoint aktif + CORS |
| 2.3 | Gabungkan tile dengan atribut lewat `setFeatureState` | ID fitur berupa integer |
| 2.4 | Terapkan ulang state saat tile baru dimuat (event `sourcedata`) | — |
| 2.5 | Tangani keadaan memuat, gagal, dan kosong untuk dua sumber data | — |
| 2.6 | Tangani titik bersampel tipis — dirender putus-putus, bukan sebagai gap nol | Flag pembeda dari backend |
| 2.7 | Tukar basemap sementara ke GEO MAPID | Kepastian tile GEO MAPID |

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

> Tombol "Bandingkan", "Tabel atribut", "Unduh brief", dan "Brief PDF" di UI sekarang sengaja dibuat mati. Semuanya adalah janji proposal, bukan hiasan — jadi perlu masuk daftar pekerjaan sadar, bukan dilupakan.

---

## 7. Utang teknis

Kecil-kecil, bisa disisipkan kapan saja. Semuanya aman dikerjakan saat jeda.

| Hal | Catatan |
|---|---|
| **Angka "n < 30" di halaman Insight** | Dikarang saat mengganti placeholder, tidak ada di proposal. Aturan sebenarnya (§5.2): minimal 3 gerai × 2 blok per kategori per stasiun. Bertentangan dengan metodologi sendiri kalau dibiarkan |
| **Seluruh angka masih data contoh** | Wajar untuk sekarang, tapi footer tiap halaman harus tetap menyatakan "angka bersifat ilustratif" sampai data asli masuk |
| **Slot "sore" tertulis 16–19** | Proposal §5.2 menyebut 16.00–18.59. Perbedaannya kosmetik, tapi perlu konsisten |
| **Tipologi Manggarai** | Proposal menyebut tiga tipologi, Manggarai adalah kasus transit. Perlu diputuskan tim — memengaruhi halaman Insight |

---

## 8. Peta ketergantungan

Ringkasan apa yang memblokir apa:

| Pekerjaan | Terblokir oleh |
|---|---|
| Fase 0 dan 1 | **Tidak ada** — bisa mulai kapan saja |
| Fase 2 | Kesiapan backend (tile + endpoint) |
| 2.7 tukar basemap | Kepastian tile GEO MAPID |
| 3.1 responsivitas | **Tidak ada** — bisa dikerjakan saat jeda |
| 3.2 dan 3.3 ekspor | **Tidak ada** — murni frontend |
| 3.6 copilot | Kontrak `POST /copilot/query`, belum dibahas |
| Angka sungguhan di seluruh halaman | Survei lapangan + pipeline batch |

---

## 9. Prinsip yang dipegang sepanjang roadmap

1. **Jangan pernah menunggu.** Kalau satu jalur terblokir, kerjakan jalur lain. Data contoh ada supaya frontend tidak pernah berhenti.
2. **Visual harus bisa diganti tanpa menyentuh logika.** Lihat §1 — ini bukan preferensi gaya, ini syarat supaya jeda antara Fase 1 dan 2 bisa dimanfaatkan.
3. **Frontend menyesuaikan backend.** Arsitektur, penamaan, dan format mengikuti mereka. Lihat `DATA_CONTRACT.md` §0.
4. **Setiap angka di layar harus bisa dilacak asalnya.** Ini janji utama proposal ke juri — tidak boleh ada angka yang muncul entah dari mana.
