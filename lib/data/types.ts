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
