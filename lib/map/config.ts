/**
 * Konstanta peta — hal-hal yang kemungkinan besar berubah saat pindah ke
 * data sungguhan. Dikumpulkan di sini supaya Fase 2 hanya menyentuh berkas ini.
 *
 * Lihat DATA_CONTRACT.md dan ROADMAP.md §5.
 */

/**
 * Basemap cadangan — dipakai kalau `NEXT_PUBLIC_BASEMAP_URL` kosong.
 *
 * Proposal §5.1 menetapkan GEO MAPID sebagai basemap utama, dan itu sudah
 * dipastikan tersedia: MAPID menyajikan style `basic` ("Street Mapid") dalam
 * format GL Style yang memang dibaca MapLibre. Tetapi URL-nya membawa API key,
 * jadi **tidak boleh ditulis di repo** — alamatnya datang dari variabel
 * lingkungan, dan di produksi menunjuk proxy backend (ROADMAP §4.4).
 *
 * Liberty tetap dipertahankan sebagai nilai bawaan supaya `npm run dev` tanpa
 * `.env.local` sekalipun tetap menampilkan peta. Ia gratis, tanpa API key,
 * menampilkan POI kawasan (warung, apotek, masjid, halte) yang justru subjek
 * analisis ini, dan punya layer `building-3d`.
 *
 * Catatan: "Street Mapid" ternyata **diturunkan dari OSM Liberty** — sprite-nya
 * menunjuk `maputnik.github.io/osm-liberty` dan layer 3D-nya sama-sama bernama
 * `building-3d`. Karena itu keduanya tampak nyaris serupa, dan berpindah di
 * antara keduanya tidak mengubah tampilan secara mencolok.
 */
export const BASEMAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

/**
 * Pilihan basemap yang sudah diperiksa: gratis, tanpa API key, dan bisa
 * dikonsumsi MapLibre. Disimpan di sini supaya keputusan basemap bisa dicoba
 * langsung, bukan diperdebatkan di angan-angan.
 *
 * Semuanya sementara sampai kepastian GEO MAPID didapat.
 */
export const BASEMAP_CHOICES: Record<string, string> = {
  positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  liberty: "https://tiles.openfreemap.org/styles/liberty",
  bright: "https://tiles.openfreemap.org/styles/bright",
};

/**
 * Seluruh nama yang sah untuk `?basemap=`, termasuk `mapid`.
 *
 * `mapid` sengaja TIDAK ada di `BASEMAP_CHOICES`: URL-nya membawa API key, dan
 * berkas ini dikomit. Alamatnya dibaca dari variabel lingkungan saat dipakai.
 */
export const BASEMAP_NAMES = [
  "mapid",
  "liberty",
  "positron",
  "voyager",
  "bright",
] as const;

export type BasemapName = (typeof BASEMAP_NAMES)[number];

/** Apakah sebuah teks adalah nama basemap yang dikenali. */
function namaBasemapDikenali(nama: string): nama is BasemapName {
  return (BASEMAP_NAMES as readonly string[]).includes(nama);
}

/** Alamat satu pilihan basemap, atau `null` kalau namanya tidak dikenali. */
function basemapChoiceUrl(nama: string): string | null {
  if (!namaBasemapDikenali(nama)) return null;
  if (nama === "mapid") return process.env.NEXT_PUBLIC_BASEMAP_URL || null;
  return BASEMAP_CHOICES[nama] ?? null;
}

/**
 * Alamat basemap yang dipakai, dengan kemungkinan ditimpa lewat query param.
 *
 * Contoh: `/peta?basemap=voyager` — memudahkan tim membandingkan pilihan
 * tanpa mengubah kode. Kalau nilainya tidak dikenali, kembali ke bawaan.
 */
export function resolveBasemapUrl(): string {
  if (typeof window === "undefined") return basemapDefault();
  const pilihan = new URLSearchParams(window.location.search).get("basemap");
  return (pilihan && basemapChoiceUrl(pilihan)) || basemapDefault();
}

/**
 * Alamat basemap bawaan, dengan rantai tiga tingkat.
 *
 * 1. `NEXT_PUBLIC_BASEMAP_URL` — diisi di produksi dengan alamat **proxy
 *    backend**, karena tim memutuskan API key MAPID tidak boleh sampai ke
 *    browser (ROADMAP §4.4).
 * 2. Kalau kosong, jatuh ke `BASEMAP_STYLE_URL` di bawah.
 *
 * Tingkat kedua itu bukan kemewahan, melainkan syarat: kalau alamat basemap
 * HANYA menunjuk proxy, halaman `/peta` mati total setiap kali backend belum
 * jalan — dan itu melanggar prinsip nomor 1 di ROADMAP §9 ("jangan pernah
 * menunggu"). Saat bekerja lokal, isi env ini dengan alamat MAPID langsung
 * atau biarkan kosong.
 *
 * Ditulis sebagai rujukan literal ke `process.env.NEXT_PUBLIC_…` karena
 * Next.js menyisipkan nilainya saat build dengan mencocokkan teks.
 */
function basemapDefault(): string {
  return process.env.NEXT_PUBLIC_BASEMAP_URL || BASEMAP_STYLE_URL;
}

/** Nama source di dalam peta. Fase 2 menukar tipenya dari geojson ke vector. */
export const SOURCE = {
  points: "observation-points",
  isochrones: "isochrones",
  /**
   * Sumber khusus label angka — geometri yang sama, tapi angkanya ikut di
   * dalam **properti**, bukan lewat `setFeatureState`.
   *
   * Ini bukan duplikasi yang tidak perlu, melainkan jalan keluar dari batasan
   * MapLibre: `text-field` adalah properti *layout*, dan validator menolak
   * ekspresi `feature-state` di layout ("feature-state data expressions are
   * not supported with layout properties"). Karena label harus menampilkan
   * angka yang berubah mengikuti slot, angkanya wajib berupa properti fitur —
   * dan itu berarti source-nya diperbarui ulang tiap kali slot berganti.
   *
   * Ongkosnya kecil: isinya hanya sebanyak titik pengamatan (belasan).
   */
  pointLabels: "point-label-values",
  /**
   * Lokasi retail & potensi toko — pasokan, bukan permintaan.
   *
   * Dimuat sebagai GeoJSON dari data presentasi Tahap 1 (`lib/data/demo.ts`).
   * Fase 2: `GET /stations/:id/retail`. Terpisah dari `points` karena artinya
   * berbeda — titik pengamatan mengukur kesenjangan, retail menandai gerai.
   */
  retail: "retail-locations",
  /**
   * Petak sewa — inventaris ruang, bukan pengamatan.
   *
   * Terpisah dari `retail` walau sama-sama "tempat usaha": retail menandai
   * gerai yang beroperasi, sewa menandai petak yang disewakan beserta
   * harganya. Satu petak kosong adalah peluang; satu gerai yang ada adalah
   * pasokan yang sudah terpakai.
   *
   * Fase 2: `GET /analytics/rental-assets` + `GET /analytics/rent-flow-index`,
   * digabung jadi satu koleksi di `lib/data/rent.ts`.
   */
  sewa: "rental-assets",
} as const;

/**
 * Nama layer di dalam tile vektor.
 *
 * Untuk source GeoJSON (Fase 0–1) nilai ini tidak dipakai. Saat backend
 * menyediakan tile, isi dengan nama `source-layer` sungguhan — lihat
 * DATA_CONTRACT.md Bagian A2 nomor 3.
 */
export const SOURCE_LAYER = {
  points: "observation_points",
  isochrones: "isochrones",
} as const;

/**
 * ID layer yang digambar di atas peta.
 *
 * Titik bersampel tipis tidak punya layer sendiri — dibedakan lewat paint di
 * `point-circle`, karena filter tidak boleh memakai `feature-state`.
 */
export const LAYER = {
  isochroneFill: "isochrone-fill",
  isochroneLine: "isochrone-line",
  pointConfidence: "point-confidence",
  pointCircle: "point-circle",
  pointLabel: "point-label",
  /** Angka arus pintu (F), tulisan kecil di bawah nama titik. */
  pointArus: "point-arus",
  /** Bulatan retail & potensi toko. */
  retailCircle: "retail-circle",
  /** Nama gerai retail — konteks tambahan, prioritas tabrakan paling rendah. */
  retailLabel: "retail-label",
  /** Petak sewa — kotak, dibedakan dari bulatan retail & titik pengamatan. */
  sewaPetak: "sewa-petak",
  /** Indeks sewa/arus petak terpilih — angka kecil di bawah kotaknya. */
  sewaIndeks: "sewa-indeks",
} as const;

/**
 * Urutan menggambar, dari bawah ke atas.
 *
 * Halo kepercayaan paling bawah supaya tidak menutupi apa pun; lingkaran
 * kesenjangan di atasnya karena itulah yang dibaca lebih dulu; label paling
 * atas.
 */
export const LAYER_ORDER = [
  LAYER.isochroneFill,
  LAYER.isochroneLine,
  LAYER.pointConfidence,
  LAYER.pointCircle,
  // Bulatan retail duduk di atas lingkaran kesenjangan (kecil, jadi tidak
  // menutupi) tapi di bawah semua simbol tulisan.
  LAYER.retailCircle,
  // Nama retail dipasang PALING AWAL di antara simbol → prioritas tabrakan
  // paling rendah. MapLibre menempatkan simbol dalam urutan terbalik: yang
  // lebih akhir menang. Nama gerai retail hanya konteks tambahan, jadi ia yang
  // pertama menyingkir saat ruang sempit — bukan nama titik pengamatan.
  // Kotak sewa duduk di atas bulatan retail: keduanya kecil dan sering
  // bertumpuk di emplasemen yang sama, dan petak kosong adalah yang sedang
  // dicari pembaca panel sewa.
  LAYER.sewaPetak,
  LAYER.retailLabel,
  // Angka indeks sewa ikut kelompok simbol berprioritas rendah — sama seperti
  // nama retail, ia konteks tambahan dan harus menyingkir sebelum nama titik.
  LAYER.sewaIndeks,
  // Arus sengaja SEBELUM nama titik. MapLibre menempatkan simbol dalam urutan
  // terbalik — layer yang lebih akhir menang saat kotak teksnya bertabrakan.
  // Waktu arus diletakkan sesudah nama, seluruh nama titik lenyap dari peta
  // tanpa pesan apa pun. Nama lebih penting daripada angka arus, jadi nama
  // yang harus berada di urutan belakang.
  LAYER.pointArus,
  LAYER.pointLabel,
] as const;

/**
 * Baris di panel "Lapisan & filter" → layer peta yang benar-benar dihidupkan
 * dan dimatikan olehnya.
 *
 * Pemetaan ini tinggal di sini, bukan di dalam komponen, supaya menambah layer
 * peta tidak menuntut mengubah panel — dan sebaliknya. Baris panel yang tidak
 * ada di daftar ini memang belum punya layer: datanya belum ada, dan panelnya
 * menandainya begitu alih-alih memasang sakelar yang tidak melakukan apa pun.
 */
export const LAYER_GROUPS: Record<string, readonly string[]> = {
  gap: [LAYER.pointCircle, LAYER.pointLabel],
  kepercayaan: [LAYER.pointConfidence],
  arus: [LAYER.pointArus],
  retail: [LAYER.retailCircle, LAYER.retailLabel],
  sewa: [LAYER.sewaPetak, LAYER.sewaIndeks],
};

/**
 * Ruang yang harus dikosongkan saat peta menyesuaikan tampilan ke sekumpulan
 * titik, supaya penanda tidak tertutup panel yang melayang di atas peta.
 * Angkanya mengikuti tata letak di PetaScreen.
 */
export const FIT_PADDING = {
  top: 104, // pil nav yang mengambang di atas peta
  bottom: 200, // panel slot waktu + legenda
  left: 96, // kontrol zoom
  right: 470, // panel ringkasan (lebar 414 + jarak 24)
} as const;

/** Tampilan awal — dipakai sebelum data termuat. */
export const INITIAL_VIEW = {
  center: [106.8395, -6.2145] as [number, number],
  zoom: 12.4,
} as const;

/**
 * Kotak yang harus terlihat saat peta pertama dibuka: seluruh kawasan studi.
 *
 * Dulu dihitung dengan menjumlahkan koordinat seluruh titik dari GeoJSON.
 * Cara itu berhenti bekerja begitu geometri pindah ke tile vektor, karena
 * browser hanya menerima fitur yang kebetulan masuk layar — peta akan terbuka
 * di tempat acak. Karena itu nilainya dijadikan konstanta di sini.
 *
 * Fase 2: ganti dengan `bounds` dari TileJSON milik backend, atau dari
 * endpoint yang menyediakannya. Yang berubah cukup berkas ini.
 *
 * Urutan: [barat, selatan, timur, utara].
 */
export const STUDY_BOUNDS: [number, number, number, number] = [
  106.8224, -6.2266, 106.85868, -6.202,
];

/** Kecepatan jalan kaki isochrone: 4,8 km/jam = 80 m/menit (ROADMAP §7). */
export const CATCHMENT_MINUTES = [3, 5, 10] as const;

/**
 * Batasan dan gerak kamera.
 *
 * Peta ini alat membandingkan angka, bukan pertunjukan. Dalam tampilan miring,
 * objek yang jauh tampak lebih kecil daripada yang dekat — sehingga besar
 * lingkaran tidak lagi bisa dibandingkan secara adil. Karena itu kemiringan
 * dibatasi, dan compass bawaan MapLibre (dengan `visualizePitch`) selalu
 * tersedia untuk meratakan kembali ke pandangan tegak lurus tanpa kehilangan
 * posisi — sekali klik.
 */
export const CAMERA = {
  /**
   * Kemiringan maksimum. Bawaan MapLibre 60; di atas itu pandangan mulai
   * menatap cakrawala dan peta jadi sulit dibaca.
   */
  maxPitch: 60,
} as const;
