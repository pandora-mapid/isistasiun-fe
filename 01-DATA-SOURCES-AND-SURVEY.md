# Data Sources & Survey — Ground Truth

Referensi utama: `00-GROUND-TRUTH-MASTER.md`. File ini detail per dataset.

## 1. Klasifikasi sumber per dataset

| Dataset | Kelas sumber | Status |
|---|---|---|
| Community Maps (Activity) | Field survey | ✅ Sudah dilakukan tim, Manggarai + Sudirman |
| Properti Go | Field survey | ✅ Sudah dilakukan tim, Manggarai + Sudirman |
| Struk Go | Online — kombinasi | ⚠️ Sumber pasti belum lengkap (lihat §3) |
| Menu Go | Online — kombinasi | ⚠️ Sumber pasti belum lengkap (lihat §3) |
| Stasiun/Terminal/Jaringan Rel | Dataset dasar kompetisi (GEO MAPID) | ✅ |
| People Spending / SES | Dataset dasar kompetisi | ✅ |
| Demografi & Rata-rata Lama Sekolah | Dataset dasar kompetisi | ✅ |
| Nighttime Light | Dataset dasar kompetisi | ✅ |
| Jaringan Internet | Dataset dasar kompetisi | ✅ |
| Jaringan Jalan & POI | Dataset dasar kompetisi | ✅ |

## 2. Apa yang benar-benar disurvei tim (F, E, C)

Sesuai kerangka estimasi di `ListPandora` (§2.3, §3.3): dari 4 variabel (F, E, C, V), **hanya F (arus pejalan kaki), E (entry ratio), C (konversi pembelian)** yang butuh pengukuran lapangan langsung — dan ini yang dikerjakan lewat MAPID APPS di Manggarai & Sudirman, sama seperti inventaris Properti Go.

Objek survey real (dikonfirmasi):
- **Community Maps (Activity)** — titik aktivitas, fasilitas, karakter kawasan
- **Properti Go** — properti/ruang komersial tersedia di sekitar kawasan

Objek survey yang **DIHAPUS dari rencana lapangan** (karena tidak pernah disurvei):
- ~~Struk Go~~ (target lama: 10–20 data)
- ~~Menu Go~~ (target lama: 10–20 data)

⚠️ **OPEN**: draft PRD `Mapid_draft_PRD_docx.md` §6 "Rencana Survey Activities" masih mencantumkan Struk Go dan Menu Go sebagai objek survei dengan target 10–20 titik masing-masing. Ini harus dihapus/direvisi (lihat `03-PRD-UPDATE-CHECKLIST.md`), **bukan cuma diabaikan diam-diam** — supaya siapa pun yang baca PRD final tidak salah kira ada data lapangan untuk Struk Go/Menu Go.

## 3. Struk Go & Menu Go — sumber "online"

✅ **RESOLVED**: kombinasi dataset dasar kompetisi (GEO MAPID) + sumber online lainnya. Ini yang ditulis di PRD, tidak perlu detail provider spesifik.

Sub-item turunan yang masih ⚠️ OPEN (baru relevan pas implementasi pipeline, bukan buat PRD):
- Bentuk data dari "sumber online lainnya" — foto struk (perlu OCR) atau data terstruktur (skip OCR)? Nentuin apakah `pipeline/extractions/struk` perlu handle 2 bentuk payload.
- Aturan confidence layer untuk data non-survei (online) vs data hasil OCR foto survei sendiri — apakah ditandai beda tingkat kepercayaannya.

## 4. Volume survey lapangan — disesuaikan 2 stasiun ✅ pintu terkonfirmasi

Tabel asli `ListPandora` §5.2 dihitung untuk 3 stasiun x 5 pintu (asumsi seragam). Dengan 2 stasiun real, jumlah pintu **tidak seragam**:

| Stasiun | Jumlah pintu |
|---|---|
| Manggarai | 2 (masuk & keluar) |
| Sudirman | 2 |

⚠️ Catatan: ini kemungkinan pintu/gate yang **relevan buat scope survei kalian**, bukan seluruh pintu fisik stasiun (Manggarai dikenal punya banyak akses). Kalau ditulis di PRD, sebaiknya diberi klarifikasi singkat ("N pintu yang tercakup dalam survei"), bukan klaim total pintu stasiun.

**Volume pencacahan arus** (per pintu × 4 slot waktu × 2 blok):

| Stasiun | Pintu | Slot | Blok | Subtotal blok |
|---|---|---|---|---|
| Manggarai | 2 | 4 | 2 | 16 |
| Sudirman | 2 | 4 | 2 | 16 |
| **Total** | | | | **32 blok** |

(Rencana asli 3 stasiun x 5 pintu seragam = 120 blok.)

**Volume E & C**: formula asli `5 kategori × 3 gerai × 2 blok × N stasiun`. Ini terikat kategori usaha & gerai sampel, bukan pintu, jadi tidak otomatis ikut turun proporsional ke jumlah pintu. Dengan 2 stasiun (asumsi kategori & gerai/kategori tetap): `5 × 3 × 2 × 2 = 60 blok`. ⚠️ **Masih TBD**: konfirmasi apakah tetap 5 kategori & 3 gerai/kategori, atau disesuaikan.

| Aspek | Status |
|---|---|
| Community Maps target (asli 20–30 titik) | ✅ **RESOLVED**: **23 titik** — lihat perhitungan di §5 |
| Properti Go — Manggarai | ✅ **RESOLVED**: List detail §5 adalah **data final**, angka lama "12 aktif + 6 kosong" **dibatalkan/superseded**, jangan dipakai lagi di PRD manapun |
| Properti Go — Sudirman | ✅ 8 gerai aktif bernama (lihat §5). Kios kosong Sudirman: ⚠️ belum ada data — tidak dihitung di target Community Maps |
| Kategori usaha | ✅ **RESOLVED**: seluruh gerai eksisting di kedua stasiun **FnB semua** (tidak ada ritel kemasan/apotek/jasa/lainnya yang benar-benar berdiri). Dampak: 5 kategori baku (§3.3 ListPandora: FnB, ritel kemasan, apotek&kesehatan, jasa, lainnya) tetap dipakai buat kerangka *kategori hilang* (demand-side dari kawasan tangkapan), tapi survey E&C fisik cuma bisa dilakukan di kategori **FnB** karena cuma itu yang ada gerainya. Kategori lain otomatis 0% supply di dalam stasiun — ini sendiri jadi temuan (gap penuh), bukan data kosong yang perlu diisi. **Formula lama "5 kategori × 3 gerai/kategori" untuk volume E&C sudah tidak berlaku** — revisi ke jumlah gerai FnB real yang ada (6 di Manggarai, 8 di Sudirman, tergantung berapa yang dijadiin sample E&C). |
| Beban lapangan (hari survey) | ✅ **RESOLVED**: **1 hari total** (bukan 9 hari seperti rencana asli: 3 hari arus + 4 hari E,C+inventaris + 1 hari weekend + 1 hari trial/kalibrasi). Dampak: PRD §5.2 & §5.4 (kalibrasi ulang kalau selisih >10%, sampel akhir pekan terpisah) **tidak realistis lagi dan perlu direvisi/dihapus** — dengan 1 hari, tidak ada slot buat re-survey atau sampel weekend terpisah. |

## 5. Data gerai & properti real (per stasiun) — FINAL, superseded angka lama

### Manggarai — gerai aktif (6)
CFC, Lawson, Indomaret, FamilyMart, UMKM dekat pintu, UMKM seberang

### Manggarai — kios kosong (4 entri / 5 titik)
- 2 kios kosong (di dalam stasiun) → 2 titik
- 1 blok kosong — kapasitas isi 6 kios → dihitung **1 titik** (lokasi tunggal, belum terbagi jadi kios individual; kalau tim mau hitung sebagai 6 titik terpisah, total Community Maps di §4 berubah jadi 28, bukan 23 — **konfirmasi kalau interpretasi ini yang dimaksud**)
- 1 kios bekas Ayam & Sei Loko → 1 titik
- 1 kios bekas Alfamart → 1 titik

### Sudirman — gerai aktif (8)
Indomaret, Bolu Kukus, Bakso Malang, Roti O, Teh Kotjok, Roti Maryam (atas), Lawson, Roti Maryam (bawah)

### Sudirman — kios kosong
⚠️ Belum ada data. Tidak masuk hitungan Community Maps target di §4 (instruksi eksplisit: cuma yang berisi).

### Perhitungan Community Maps target (23 titik)
| Komponen | Titik |
|---|---|
| Manggarai — gerai aktif | 6 |
| Manggarai — kios kosong | 5 |
| Sudirman — gerai aktif | 8 |
| Pintu masuk (2 Manggarai + 2 Sudirman) | 4 |
| **Total** | **23** |
