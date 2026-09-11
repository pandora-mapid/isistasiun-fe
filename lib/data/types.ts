/**
 * Tipe data yang dipertukarkan frontend dan backend.
 *
 * Bentuk di sini mengikuti tebakan terbaik dari DATA_CONTRACT.md Bagian B —
 * backend belum menjawab bentuk sesungguhnya. Kalau nanti berbeda, yang
 * berubah hanya berkas ini dan `source.ts`; komponen peta tidak tersentuh.
 */

/** Bungkus response standar backend (DATA_CONTRACT §2.4). */
export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

/** Rentang hasil simulasi Monte Carlo. `null` = tidak diestimasi. */
export type Range = {
  p10: number | null;
  p50: number | null;
  p90: number | null;
};

export type SlotKey = "pagi" | "siang" | "sore" | "malam";

export type CategoryKey = "fnb" | "ritel" | "apotek" | "jasa" | "lainnya";

/** Tipe titik pengamatan (DATA_CONTRACT §3.4) — bukan selalu pintu. */
export type ObservationPointType = "entrance" | "transit_corridor" | "platform";

/** Properti yang dibawa tile / GeoJSON titik pengamatan. */
export type ObservationPointProps = {
  id: number;
  station_id: number;
  station_name: string;
  point_label: string;
  type: ObservationPointType;
};

/** Properti yang dibawa tile / GeoJSON isochrone. */
export type IsochroneProps = {
  id: number;
  point_id: number;
  duration_min: number;
};

/** Uraian F × E × C × V untuk satu slot. */
export type Variables = { F: number; E: number; C: number; V: number };

/**
 * Rincian satu kategori usaha di dalam satu slot.
 *
 * `gerai_count` dan `nilai_transaksi` tidak berubah antar slot — keduanya ikut
 * di tiap slot karena begitulah bentuk yang wajar keluar dari satu query
 * agregat, dan menyalinnya lebih murah daripada menyatukan dua sumber.
 */
export type CategoryAnalytics = {
  category: CategoryKey;
  gap: Range;
  potensi: Range;
  tertangkap: Range;
  /** Porsi permintaan kawasan untuk kategori ini, 0–1. */
  demand_share: number;
  /** Jumlah gerai kategori ini di dalam simpul. */
  gerai_count: number;
  /** Nilai transaksi rata-rata (V) kategori ini. */
  nilai_transaksi: number;
  sampel_tipis: boolean;
};

export type SlotAnalytics = {
  slot: SlotKey;
  gap: Range;
  potensi: Range;
  tertangkap: Range;
  variables: Variables | null;
  sampel_tipis: boolean;
  by_category: CategoryAnalytics[];
};

/** Hasil analisis satu titik pengamatan. */
export type PointAnalytics = {
  point_id: number;
  station_id: number;
  total: {
    potensi: Range;
    tertangkap: Range;
    gap: Range;
  };
  confidence: number;
  sampel_tipis: boolean;
  sample_meta: { gerai_count: number; blok_count: number };
  /** Bahan mentah di balik nilai V — dipakai panel transparansi. */
  evidence: { struk_total: number; struk_ambigu: number; struk_terbaca: number };
  by_slot: SlotAnalytics[];
};

export type SpendingGapPayload = {
  generated_at: string;
  pipeline_version: string;
  day_type: "weekday" | "weekend";
  points: PointAnalytics[];
};

export type Station = {
  id: number;
  name: string;
  typology: string;
  point_count: number;
  /** Titik tujuan pencarian; kosong selama lokasi stasiun belum ditetapkan. */
  longitude?: number;
  latitude?: number;
};

export type MockStation = Station;
export type MockPointAnalytics = PointAnalytics;

export type RetailKind = "existing" | "potential" | "shopfront";

export type MockRetailLocation = {
  id: string;
  name: string;
  kind: RetailKind;
  station_id: number;
  longitude: number;
  latitude: number;
  status: "tersedia" | "kandidat" | "perlu_verifikasi";
  category: CategoryKey | null;
  note: string;
};

export type MockCategoryStatus = {
  station_id: number;
  category: CategoryKey;
  status: "terisi" | "kurang" | "kosong";
  demand_share: number;
  gerai_count: number;
};

export type MockRecommendation = {
  id: string;
  station_id: number;
  point_id: number;
  retail_location_id: string | null;
  title: string;
  category: CategoryKey;
  slot: SlotKey;
  gap_p50: number | null;
  confidence: number;
  sampel_tipis: boolean;
  reason: string;
  next_measurement: string;
};

export type MockComparisonSummary = {
  station_id: number;
  station_name: string;
  potential_p50: number;
  captured_p50: number;
  gap_p50: number;
  capture_rate: number | null;
  pedestrian_flow: number;
  confidence_average: number;
  thin_sample_points: number;
  missing_categories: CategoryKey[];
};

export type MockEvidence = {
  point_id: number;
  types: Array<"struk" | "gerai" | "properti">;
  sources: string[];
  dataset: string;
  surveyed_at: string;
  photo_label: string;
  receipt_total: number;
  receipt_readable: number;
  receipt_ambiguous: number;
  confidence: number;
  mock: true;
};

export type MockDemoData = {
  retail: MockRetailLocation[];
  category_statuses: MockCategoryStatus[];
  recommendations: MockRecommendation[];
  evidence: MockEvidence[];
};

/* -------------------------------------------------------------------------
 * Ringkasan & perbandingan antarsimpul
 *
 * Naik satu tingkat dari `SpendingGapPayload`: yang di sana per titik
 * pengamatan, yang di sini per **stasiun** — potret satu simpul sebagai
 * kawasan, plus sumbu pembanding Persona 2 (pengusaha: "buka toko di simpul
 * mana"). Mengikuti `DATA_CONTRACT.md` §B "Ringkasan simpul".
 *
 * Fase 2: `GET /api/v1/analytics/station-summary`. Sekarang dibaca dari
 * `public/mock/station-summary.json`, yang dikarang KONSISTEN dengan
 * `spending-gap.json` (titik puncak & jumlah gerai kategori sama persis) —
 * `tests/summary.spec.ts` mengunci supaya keduanya tidak bisa menyimpang.
 * ---------------------------------------------------------------------- */

/** Rincian satu kategori usaha pada tingkat stasiun (bukan per slot). */
export type CategoryComposition = {
  category: CategoryKey;
  /** Porsi permintaan kawasan untuk kategori ini, 0–1. */
  demand_share: number;
  /**
   * Jumlah gerai kategori ini di dalam stasiun. Diambil dari titik
   * berkesenjangan terbesar — titik yang sama yang dibaca matriks Insight,
   * supaya strip dan matriks di halaman itu tidak berbeda angka.
   */
  gerai_count: number;
  /**
   * Permintaan terbaca tapi gerainya di bawah ambang (`AMBANG_GERAI`).
   * Ini "kategori hilang" versi tingkat stasiun.
   */
  hilang: boolean;
};

/** Titik puncak sebuah simpul — pembawa karakter F/E/C/V-nya. */
export type StationPeak = {
  point_id: number;
  point_label: string;
  slot: SlotKey;
  /** F × E × C × V pada slot puncak titik ini. `null` bila tidak dicacah. */
  variables: Variables | null;
  gap: Range;
};

/**
 * Potret satu simpul sebagai kawasan.
 *
 * `gap`/`potensi`/`tertangkap` adalah hasil **simulasi Monte Carlo setingkat
 * simpul** (`basis: "monte-carlo-simpul"`) — bukan penjumlahan angka titik
 * yang tampil di layar. Menjumlahkan titik dilarang (ROADMAP §9.4: "summing
 * invents a number nobody measured"); simulasi setingkat simpul adalah
 * angka yang memang dihitung pipeline (`/pipeline/simulations/monte-carlo`
 * "per simpul"). Di data contoh angkanya dikarang mendekati jumlah titik —
 * karena secara nyata memang akan mendekati itu — tapi rentang P10–P90-nya
 * lebih rapat, meniru efek diversifikasi simulasi gabungan.
 */
export type StationSummaryRow = {
  station_id: number;
  station_name: string;
  typology: string;
  /** Placeholder = simpul yang datanya belum dikumpulkan (mis. simpul ke-3). */
  placeholder: boolean;
  /** Titik pengamatan dalam scope survei simpul ini. */
  pintu_dicacah: number;
  /** Titik yang estimasinya ditahan karena sampel tipis. */
  pintu_ditahan: number;
  gap: Range;
  potensi: Range;
  tertangkap: Range;
  /** `tertangkap.p50 / potensi.p50`, 0–1. `null` bila tak terhitung. */
  capture_rate: number | null;
  /** Rentang skor kepercayaan titik-titik yang diestimasi. */
  confidence: { min: number; max: number } | null;
  /** Jumlah struk yang terbaca OCR di seluruh titik simpul ini. */
  struk_terbaca: number;
  peak: StationPeak | null;
  composition: CategoryComposition[];
  basis: "monte-carlo-simpul" | "agregat-titik";
};

export type StationSummaryPayload = {
  generated_at: string;
  pipeline_version: string;
  day_type: "weekday" | "weekend";
  stations: StationSummaryRow[];
};

/**
 * Nilai yang ditempelkan ke fitur peta lewat `setFeatureState`.
 *
 * Hanya berisi yang benar-benar dipakai untuk menggambar — bukan seluruh
 * hasil analisis. Nama kuncinya dibaca oleh ekspresi di `lib/map/style.ts`.
 */
export type PointFeatureState = {
  /** Kesenjangan yang sedang ditampilkan (mengikuti slot & kategori aktif). */
  gap: number;
  sampel_tipis: boolean;
  confidence: number;
};

/**
 * Keadaan sesaat sebuah titik: sedang disorot kursor atau sedang dipilih.
 *
 * Dipisah dari `PointFeatureState` karena umurnya berbeda — yang satu ikut
 * data, yang satu ikut kursor — walau keduanya sama-sama disetel lewat
 * `setFeatureState` dan dibaca dari `paint`.
 */
export type PointInteractionState = {
  hover?: boolean;
  terpilih?: boolean;
};
