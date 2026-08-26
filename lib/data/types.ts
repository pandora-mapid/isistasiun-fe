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

export type SlotAnalytics = {
  slot: SlotKey;
  gap: Range;
  variables: { F: number; E: number; C: number; V: number } | null;
  sampel_tipis: boolean;
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
  gap: number;
  sampel_tipis: boolean;
  confidence: number;
};
