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

/** Alasan terstruktur mengapa data satu titik belum cukup kuat. */
export type ConfidenceReason =
  | "missing_flow_blocks"
  | "insufficient_stores"
  | "insufficient_conversion_blocks"
  | "missing_denominator";

/** Mutu data satu titik pada satu slot dari `GET /confidence-layer`. */
export type ConfidenceLayerEntry = {
  station_id: number;
  point_id: number;
  time_slot: SlotKey;
  /** Skor absolut 0-1. */
  confidence_score: number;
  is_thin_sample: boolean;
  sample_count: number;
  sample_meta: {
    flow_blocks: number;
    store_count: number;
    valid_store_blocks: number;
  };
  reasons: ConfidenceReason[];
};

/** Geometri grid kawasan untuk visual confidence layer. */
export type ConfidenceGridProps = {
  zone_id: string;
  station_id: number | null;
  confidence_score: number;
  sample_count: number;
  is_thin_sample: boolean;
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

export type RentalAssetStatus = "occupied" | "available" | "needs_verification";
export type RentalAssetSource = "space_kai" | "field_survey";

export type RentalAsset = {
  id: string;
  station_id: number;
  station_code: string;
  station_name: string;
  source_id: string;
  data_source: RentalAssetSource;
  location_name: string;
  plot_name: string;
  area_name: string | null;
  latitude: number;
  longitude: number;
  land_area: number | null;
  building_area: number | null;
  rented: boolean;
  availability_status: RentalAssetStatus;
  commercial_value: number | null;
  commercial_value_visible: boolean;
  source_updated_at: string | null;
  note: string | null;
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
