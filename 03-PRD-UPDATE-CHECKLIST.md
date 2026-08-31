# PRD Update Checklist

File ini **tidak menulis ulang PRD kamu** — cuma daftar titik yang perlu direvisi manual di `Mapid_draft_PRD_docx.md` dan/atau submission asli `ListPandora_1__IsiStasiun`, supaya konsisten dengan `00-GROUND-TRUTH-MASTER.md`. Saya sengaja tidak nulis ulang kalimatnya karena banyak bagian (problem statement, narasi latar belakang) butuh keputusan editorial tim, bukan cuma find-replace angka.

## A. Jumlah stasiun (3 → 2)

Section yang kena dampak:
- **§2.3 & §3.1** (ListPandora) — kriteria pemilihan stasiun ("dipilih setelah data kompetisi diterima, berdasarkan 4 kriteria... jumlah pintu akses tidak lebih dari lima") — kalimat ini mengasumsikan proses seleksi dari banyak kandidat ke 3. Kalau realitanya cuma Manggarai+Sudirman yang disurvei, narasi ini perlu direvisi jadi jujur soal prosesnya (apakah tetap ada seleksi, atau memang dari awal fokus 2 stasiun operasional).
- **§3.1** — "tipe kawasan berbeda: hunian, perkantoran, campuran" (3 tipe untuk 3 stasiun) — dengan 2 stasiun, tipologi yang diuji tinggal 2, bukan 3. Perlu revisi klaim.
- **§5.2 tabel volume pencacahan** — `3 stasiun x 5 pintu x 4 slot x 2 blok = 120 blok` — ganti sesuai `01-DATA-SOURCES-AND-SURVEY.md` §4 setelah jumlah pintu real dikonfirmasi.
- **§5.4 (Risiko)** — bagian tentang stasiun cadangan ("apabila izin tidak diperoleh, diganti stasiun cadangan") — cek relevansi dengan skema 2 stasiun.
- **Mapid_draft_PRD §3 In-Scope** — "Studi pada satu koridor transit dengan **tiga stasiun terpilih**..." → ganti jadi dua.

## B. Struk Go & Menu Go bukan hasil survey

Section yang kena dampak:
- **Mapid_draft_PRD §6 "Rencana Survey Activities" → Objek** — hapus baris Struk Go & Menu Go dari daftar objek survei MAPID APPS (baris "Struk Go: transaksi dari merchant..." dan "Menu Go: merchant F&B...").
- **Mapid_draft_PRD §6 → Output** — hapus target "10–20 data Struk Go" dan "10–20 data Menu Go".
- Tambahkan kalimat baru yang jujur soal sumber Struk Go/Menu Go: kombinasi dataset dasar kompetisi + sumber lain — **tulis detail sumbernya setelah §3 di `01-DATA-SOURCES-AND-SURVEY.md` diisi tim, jangan generik "online" saja di dokumen resmi.**
- **ListPandora §5.2 tabel "Aspek | Ketentuan"** — baris survey activities lapangan cuma mencakup Community Maps + Properti Go (dan F/E/C), pastikan tidak ada sisa referensi ke pengambilan Struk Go/Menu Go di lapangan.

## C. Tech stack backend (Python/Django → Go)

- **ListPandora Lampiran 1, poin 2** — "Python dengan Django dan Django REST Framework..." → ganti ke Go, konsisten dengan `02-BACKEND-SPEC.md`.
- **ListPandora §5.1 tabel arsitektur, baris Backend** — "Node.js dengan Express..." — ini versi ketiga yang beda lagi (bukan Python, bukan Go)! Cek dokumen ini juga stale, harus disamakan ke Go.
- Mapid_draft_PRD §9 sudah benar ("Go API dengan base path /api/v1") — tidak perlu diubah, tapi jadi acuan buat benerin 2 tempat di atas.

## D. Role tabel tim

- **Mapid_draft_PRD §1, tabel Anggota Tim, baris Arzaka** — "Menilai Bisnis dan menilai fe" tidak cocok dengan ownership backend (Survey & Pipeline) di `BACKEND_TASK_DIVISION`. ⚠️ **Konfirmasi ke tim dulu sebelum diubah** — mungkin ada pembagian kerja ganda (bisnis+FE di awal, lalu pivot ke backend), bukan berarti salah tulis.

## E. Hal yang TIDAK perlu diubah (sudah konsisten, jangan disentuh)

- Frontend: Next.js + MapLibre GL JS — konsisten di semua dokumen.
- Kerangka estimasi F×E×C×V — tidak terpengaruh perubahan sumber Struk Go, karena V tetap diekstraksi lewat OCR/AI dari foto struk, apa pun asal fotonya.
- Endpoint list & ownership backend — sudah final, lihat `02-BACKEND-SPEC.md`.
- Boundary vector tile di luar Go API — sudah final.

## G. Beban lapangan jadi 1 hari (bukan 9 hari)

- **ListPandora §5.2 tabel "Beban lapangan"** — "3 hari untuk arus, 4 hari untuk E,C,inventaris, 1 hari weekend, 1 hari trial+kalibrasi" → ganti jadi **1 hari total**.
- **ListPandora §5.2 "Kendali mutu"** — "kalibrasi antar-pencacah sebelum survei; jika selisih >10%, sesi diulang" — dengan 1 hari, tidak ada slot re-survey. Revisi jadi jujur soal keterbatasan ini, atau hapus klaim pengulangan.
- **ListPandora §5.2 "Hari pengamatan"** — "hari kerja + 1 sampel akhir pekan" — kalau cuma 1 hari, sampel weekend terpisah **tidak ada**. Hapus/revisi klaim pembanding weekday-weekend.
- **ListPandora §12 Risiko** — baris "Galat pencacahan dan kondisi lapangan" mitigasinya menyebut kalibrasi & pengulangan >10% — sama, perlu direvisi konsisten dengan realita 1 hari survey.

## H. Kategori usaha: FnB-only di gerai eksisting

- **ListPandora §3.3** — "lima kategori baku... makanan dan minuman siap saji, ritel kemasan, apotek dan kesehatan, jasa, serta lainnya" — kerangka 5 kategori tetap valid buat sisi **demand** (kategori hilang dari kawasan tangkapan), tapi tambahkan catatan bahwa **supply eksisting di dalam stasiun 100% FnB** — kategori lain otomatis full-gap, bukan diukur E/C langsung.
- **ListPandora §5.2 tabel "Volume pengamatan E dan C"** — formula "5 kategori × 3 gerai × 2 blok × 3 stasiun = 90 blok" **tidak berlaku lagi**. Ganti berdasarkan jumlah gerai FnB real (6 Manggarai + 8 Sudirman) — tim perlu putuskan berapa dari gerai ini yang benar-benar di-E&C-survey per blok waktu.

## F. Urutan pengerjaan yang disarankan

1. ~~Selesaikan ⚠️ OPEN items §3/§4~~ — **sudah selesai**, semua data pintu/properti/kategori/beban lapangan sudah masuk `01-DATA-SOURCES-AND-SURVEY.md`.
2. Sisa yang beneran masih OPEN: kios kosong Sudirman (belum ada data), interpretasi "1 blok kosong" sebagai 1 titik vs 6 titik di perhitungan Community Maps (§4 file 01), dan bentuk data Struk Go/Menu Go online (foto vs terstruktur, baru relevan pas coding pipeline).
3. Revisi PRD pakai checklist A–H di atas.
4. Role tabel (D) sudah resolved — tinggal tulis di PRD.
