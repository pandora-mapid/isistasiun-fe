/**
 * Konstanta peta — hal-hal yang kemungkinan besar berubah saat pindah ke
 * data sungguhan. Dikumpulkan di sini supaya Fase 2 hanya menyentuh berkas ini.
 *
 * Lihat DATA_CONTRACT.md dan ROADMAP.md §5.
 */

/**
 * ⚠️ SEMENTARA — basemap penambal.
 *
 * Proposal §5.1 menetapkan GEO MAPID sebagai basemap utama, tetapi belum
 * dipastikan apakah GEO MAPID menyediakan tile vektor yang bisa dikonsumsi
 * MapLibre (lihat DATA_CONTRACT.md Bagian D).
 *
 * OpenFreeMap Liberty dipilih setelah membandingkan empat kandidat: gratis,
 * tanpa API key, menampilkan POI kawasan (warung, apotek, masjid, halte) yang
 * justru merupakan subjek analisis ini, dan punya layer `building-3d` sehingga
 * bangunan terekstrusi saat peta dimiringkan.
 *
 * Menukarnya nanti cukup mengganti URL di bawah ini.
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
 * Alamat basemap yang dipakai, dengan kemungkinan ditimpa lewat query param.
 *
 * Contoh: `/peta?basemap=voyager` — memudahkan tim membandingkan pilihan
 * tanpa mengubah kode. Kalau nilainya tidak dikenali, kembali ke bawaan.
 */
export function resolveBasemapUrl(): string {
  if (typeof window === "undefined") return BASEMAP_STYLE_URL;
  const pilihan = new URLSearchParams(window.location.search).get("basemap");
  return (pilihan && BASEMAP_CHOICES[pilihan]) || BASEMAP_STYLE_URL;
}

/** Nama source di dalam peta. Fase 2 menukar tipenya dari geojson ke vector. */
export const SOURCE = {
  points: "observation-points",
  isochrones: "isochrones",
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
  pointPotensi: "point-potensi",
  pointCircle: "point-circle",
  pointLabel: "point-label",
} as const;

/**
 * Urutan menggambar, dari bawah ke atas.
 *
 * Halo kepercayaan paling bawah supaya tidak menutupi apa pun; cincin potensi
 * di atasnya sebagai bingkai; lingkaran kesenjangan di atas keduanya karena
 * itulah yang dibaca lebih dulu; label paling atas.
 */
export const LAYER_ORDER = [
  LAYER.isochroneFill,
  LAYER.isochroneLine,
  LAYER.pointConfidence,
  LAYER.pointPotensi,
  LAYER.pointCircle,
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
  potensi: [LAYER.pointPotensi],
  kepercayaan: [LAYER.pointConfidence],
};

/**
 * Ruang yang harus dikosongkan saat peta menyesuaikan tampilan ke sekumpulan
 * titik, supaya penanda tidak tertutup panel yang melayang di atas peta.
 * Angkanya mengikuti tata letak di PetaScreen.
 */
export const FIT_PADDING = {
  top: 72,
  bottom: 200, // panel slot waktu + legenda
  left: 96, // kontrol zoom
  right: 470, // panel ringkasan (lebar 414 + jarak 24)
} as const;

/** Tampilan awal — dipakai sebelum data termuat. */
export const INITIAL_VIEW = {
  center: [106.8395, -6.2145] as [number, number],
  zoom: 12.4,
} as const;

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
