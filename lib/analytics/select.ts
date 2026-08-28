/**
 * Pemotong data — satu-satunya tempat yang memutuskan "angka mana yang
 * ditampilkan untuk slot dan kategori yang sedang dipilih".
 *
 * Seluruh isinya fungsi murni tanpa React dan tanpa MapLibre. Itu disengaja:
 * ROADMAP §1 mensyaratkan tampilan bisa dirombak tanpa menyentuh logika, jadi
 * logika pemilihan angka tidak boleh menumpang di dalam komponen. Panel dan
 * peta memanggil fungsi yang sama, sehingga keduanya mustahil berbeda angka.
 *
 * Nilai `null` selalu berarti **tidak diestimasi** (sampel tipis), bukan nol.
 */
import {
  ALL_CATEGORIES,
  type CategoryFilter,
} from "@/lib/data/dimensions";
import type {
  CategoryAnalytics,
  PointAnalytics,
  Range,
  SlotAnalytics,
  SlotKey,
  SpendingGapPayload,
  Variables,
} from "@/lib/data/types";

const NULL_RANGE: Range = { p10: null, p50: null, p90: null };

/** Angka satu titik pada satu potongan slot × kategori. */
export type PointMetric = {
  pointId: number;
  stationId: number;
  gap: Range;
  potensi: Range;
  tertangkap: Range;
  /** Uraian F × E × C × V — selalu setingkat simpul, bukan per kategori. */
  variables: Variables | null;
  sampelTipis: boolean;
  confidence: number;
  /** Hanya terisi kalau satu kategori sedang dipilih. */
  kategori: CategoryAnalytics | null;
};

export function findPoint(
  payload: SpendingGapPayload,
  pointId: number | null,
): PointAnalytics | null {
  if (pointId === null) return null;
  return payload.points.find((p) => p.point_id === pointId) ?? null;
}

export function slotOf(
  point: PointAnalytics,
  slot: SlotKey,
): SlotAnalytics | null {
  return point.by_slot.find((s) => s.slot === slot) ?? null;
}

export function categoryOf(
  slotRow: SlotAnalytics,
  category: CategoryFilter,
): CategoryAnalytics | null {
  if (category === ALL_CATEGORIES) return null;
  return slotRow.by_category.find((c) => c.category === category) ?? null;
}

/**
 * Angka yang harus ditampilkan untuk satu titik pada slot dan kategori aktif.
 *
 * Aturannya satu baris: kalau ada kategori dipilih, pakai angka kategori itu;
 * kalau tidak, pakai angka seluruh kategori pada slot tersebut. Tidak ada
 * angka yang dihitung ulang di sini — semuanya langsung dari data, supaya
 * setiap angka di layar bisa dilacak asalnya (ROADMAP §9 nomor 4).
 */
export function metricFor(
  point: PointAnalytics,
  slot: SlotKey,
  category: CategoryFilter,
): PointMetric {
  const slotRow = slotOf(point, slot);
  const dasar: PointMetric = {
    pointId: point.point_id,
    stationId: point.station_id,
    gap: slotRow?.gap ?? NULL_RANGE,
    potensi: slotRow?.potensi ?? NULL_RANGE,
    tertangkap: slotRow?.tertangkap ?? NULL_RANGE,
    variables: slotRow?.variables ?? null,
    sampelTipis: point.sampel_tipis || (slotRow?.sampel_tipis ?? false),
    confidence: point.confidence,
    kategori: null,
  };
  if (!slotRow) return dasar;

  const kategori = categoryOf(slotRow, category);
  if (!kategori) return dasar;

  return {
    ...dasar,
    gap: kategori.gap,
    potensi: kategori.potensi,
    tertangkap: kategori.tertangkap,
    sampelTipis: dasar.sampelTipis || kategori.sampel_tipis,
    kategori,
  };
}

/** Angka seluruh titik pada potongan yang sama, terkunci berdasarkan id. */
export function metricsFor(
  payload: SpendingGapPayload,
  slot: SlotKey,
  category: CategoryFilter,
): Map<number, PointMetric> {
  const out = new Map<number, PointMetric>();
  for (const point of payload.points) {
    out.set(point.point_id, metricFor(point, slot, category));
  }
  return out;
}

/* -------------------------------------------------------------------------
 * Skala
 * ---------------------------------------------------------------------- */

/** Rentang nilai yang sedang dipakai untuk mewarnai dan mengukur titik. */
export type Domain = { min: number; max: number };

/** Dipakai kalau seluruh nilai tidak diestimasi — supaya skala tetap sah. */
const DOMAIN_KOSONG: Domain = { min: 0, max: 1_000_000 };

/**
 * Rentang nilai sesungguhnya dari potongan data yang sedang aktif.
 *
 * Legenda membaca fungsi yang sama dengan peta, jadi tulisan di legenda tidak
 * bisa lagi meleset dari warna yang benar-benar tergambar (ROADMAP 1.5).
 * Batas atas dibulatkan ke atas supaya angkanya enak dibaca, bukan berakhir
 * di "Rp 1.837.412".
 */
export function domainOf(
  metrics: Iterable<PointMetric>,
  ambil: (m: PointMetric) => Range = (m) => m.gap,
): Domain {
  const nilai: number[] = [];
  for (const m of metrics) {
    const p50 = ambil(m).p50;
    if (p50 !== null && !m.sampelTipis) nilai.push(p50);
  }
  if (nilai.length === 0) return DOMAIN_KOSONG;

  const min = Math.min(...nilai);
  const max = Math.max(...nilai);
  if (max === min) return { min: 0, max: bulatkanKeAtas(max || 1) };
  return { min: bulatkanKeBawah(min), max: bulatkanKeAtas(max) };
}

/** Kelipatan pembulatan yang wajar untuk besaran rupiah sebesar `v`. */
function langkah(v: number): number {
  const besar = Math.abs(v);
  if (besar >= 5_000_000) return 500_000;
  if (besar >= 1_000_000) return 100_000;
  if (besar >= 100_000) return 50_000;
  return 10_000;
}

function bulatkanKeAtas(v: number): number {
  const s = langkah(v);
  return Math.ceil(v / s) * s;
}

function bulatkanKeBawah(v: number): number {
  const s = langkah(v);
  return Math.max(0, Math.floor(v / s) * s);
}

/**
 * Rentang skor kepercayaan pada titik yang punya estimasi.
 *
 * Sama alasannya dengan `domainOf`: skala yang dipatok mati akan meleset dari
 * data yang sebenarnya. Skor kepercayaan di data contoh berkumpul di 0,77–0,92
 * — dipetakan ke skala mati 0,4–0,9, seluruh titik jatuh di ujung "kuat" dan
 * halonya tidak pernah terlihat. Lapisan yang menyala tapi tak menggambar apa
 * pun sama saja dengan tidak ada.
 *
 * Titik bersampel tipis tidak ikut dihitung: ia tidak diestimasi, jadi punya
 * penanda tetap sendiri dan tidak boleh ikut menggeser rentang.
 */
export function confidenceDomainOf(metrics: Iterable<PointMetric>): Domain {
  const nilai: number[] = [];
  for (const m of metrics) {
    if (!m.sampelTipis) nilai.push(m.confidence);
  }
  if (nilai.length === 0) return { min: 0, max: 1 };

  return { min: Math.min(...nilai), max: Math.max(...nilai) };
}

/* -------------------------------------------------------------------------
 * Turunan untuk panel
 * ---------------------------------------------------------------------- */

/** Seluruh titik satu stasiun, terurut dari kesenjangan terbesar. */
export function pointsOfStation(
  metrics: Map<number, PointMetric>,
  stationId: number,
): PointMetric[] {
  return [...metrics.values()]
    .filter((m) => m.stationId === stationId)
    .sort((a, b) => (b.gap.p50 ?? -1) - (a.gap.p50 ?? -1));
}

/**
 * Kategori yang permintaannya ada tapi gerainya belum memenuhi ambang.
 *
 * Ambangnya mengikuti proposal §5.2 — minimal 3 gerai — bukan angka karangan.
 * Diurutkan dari permintaan terbesar, karena itulah urutan yang menentukan
 * mana yang layak diisi lebih dulu.
 */
export function missingCategories(
  point: PointAnalytics,
  slot: SlotKey,
  ambangGerai = 3,
): CategoryAnalytics[] {
  const slotRow = slotOf(point, slot);
  if (!slotRow) return [];
  return slotRow.by_category
    .filter((c) => c.gerai_count < ambangGerai)
    .sort((a, b) => b.demand_share - a.demand_share);
}

/** Titik dengan kesenjangan terbesar — tampilan awal yang paling berguna. */
export function biggestGapPoint(payload: SpendingGapPayload): number | null {
  let terpilih: PointAnalytics | null = null;
  for (const p of payload.points) {
    if (p.sampel_tipis || p.total.gap.p50 === null) continue;
    if (!terpilih || p.total.gap.p50 > (terpilih.total.gap.p50 ?? -1)) {
      terpilih = p;
    }
  }
  return terpilih?.point_id ?? payload.points[0]?.point_id ?? null;
}

/**
 * Posisi 0–1 sebuah nilai di dalam rentang P10–P90, untuk menempatkan penanda
 * pada bar rentang. Dijepit supaya penanda tidak pernah keluar dari barnya.
 */
export function posisiDalamRentang(range: Range, nilai: number | null): number {
  if (nilai === null || range.p10 === null || range.p90 === null) return 0.5;
  const lebar = range.p90 - range.p10;
  if (lebar <= 0) return 0.5;
  return Math.min(1, Math.max(0, (nilai - range.p10) / lebar));
}
