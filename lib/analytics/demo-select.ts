import { ALL_CATEGORIES, type CategoryFilter } from "@/lib/data/dimensions";
import type {
  CategoryKey,
  MockCategoryStatus,
  MockComparisonSummary,
  MockEvidence,
  MockRecommendation,
  SlotKey,
  SpendingGapPayload,
  Station,
} from "@/lib/data/types";
import { metricsFor } from "./select";
import type { PointMetric } from "./select";

export function categoryStatusesFor(
  rows: MockCategoryStatus[],
  stationId?: number,
): MockCategoryStatus[] {
  return rows
    .filter((row) => stationId === undefined || row.station_id === stationId)
    .sort((a, b) => b.demand_share - a.demand_share);
}

export function recommendationsFor(
  rows: MockRecommendation[],
  stationId: number | "all",
): MockRecommendation[] {
  return rows
    .filter((row) => stationId === "all" || row.station_id === stationId)
    .sort((a, b) => {
      if (a.sampel_tipis !== b.sampel_tipis) return a.sampel_tipis ? 1 : -1;
      return (b.gap_p50 ?? -1) - (a.gap_p50 ?? -1);
    });
}

export function evidenceFor(rows: MockEvidence[], pointId: number | null): MockEvidence | null {
  return rows.find((row) => row.point_id === pointId) ?? null;
}

/**
 * Powers `ComparisonDialog` (the peta "Bandingkan" button) — sums the p50 of
 * every point at `station`, at the slot × category filter currently active
 * on the map. This is an on-the-fly point rollup, **not** the same thing as
 * `lib/analytics/summary.ts`'s `bandingkanSimpul`: that one reads a
 * station-scoped Monte Carlo run from `GET /analytics/station-summary`
 * (`StationSummaryPayload`), carries a P10–P90 range, and flags its `basis`
 * so a summed number can never pass for a simulated one
 * (`../../../Context/02-BACKEND-SPEC.md §3.5b`). This function has no such
 * flag — it only ever sums, and only ever at p50 — so don't reach for it as
 * a substitute for the station-summary comparison, and don't assume the two
 * dialogs will show matching numbers for the same two stations.
 */
export function comparisonSummary(
  station: Station,
  analytics: SpendingGapPayload,
  statuses: MockCategoryStatus[],
  slot: SlotKey,
  category: CategoryFilter,
): MockComparisonSummary {
  const metrics = [...metricsFor(analytics, slot, category).values()]
    .filter((metric) => metric.stationId === station.id);
  const estimated = metrics.filter((metric) => !metric.sampelTipis);
  const potential = estimated.reduce((sum, metric) => sum + (metric.potensi.p50 ?? 0), 0);
  const captured = estimated.reduce((sum, metric) => sum + (metric.tertangkap.p50 ?? 0), 0);
  const gap = estimated.reduce((sum, metric) => sum + (metric.gap.p50 ?? 0), 0);
  const flow = estimated.reduce((sum, metric) => sum + (metric.arus ?? 0), 0);
  const confidence = metrics.length
    ? metrics.reduce((sum, metric) => sum + metric.confidence, 0) / metrics.length
    : 0;
  const missing = statuses
    .filter((row) => row.station_id === station.id && row.status !== "terisi")
    .filter((row) => category === ALL_CATEGORIES || row.category === category)
    .map((row) => row.category);

  return {
    station_id: station.id,
    station_name: station.name,
    potential_p50: potential,
    captured_p50: captured,
    gap_p50: gap,
    capture_rate: potential > 0 ? captured / potential : null,
    pedestrian_flow: flow,
    confidence_average: confidence,
    thin_sample_points: metrics.length - estimated.length,
    missing_categories: missing,
  };
}

export type SlotComparison = {
  slot: SlotKey;
  by_station: Record<number, number>;
};

export function comparisonBySlot(
  stations: Station[],
  analytics: SpendingGapPayload,
  category: CategoryFilter,
  statuses: MockCategoryStatus[],
): SlotComparison[] {
  const slots: SlotKey[] = ["pagi", "siang", "sore", "malam"];
  return slots.map((slot) => ({
    slot,
    by_station: Object.fromEntries(stations.map((station) => [
      station.id,
      comparisonSummary(station, analytics, statuses, slot, category).gap_p50,
    ])),
  }));
}

export function missingCategoryKeys(rows: MockCategoryStatus[], stationId: number): CategoryKey[] {
  return rows.filter((row) => row.station_id === stationId && row.status !== "terisi")
    .map((row) => row.category);
}

export function recommendationOverview(rows: MockRecommendation[]) {
  const estimated = rows.filter((row) => !row.sampel_tipis && row.gap_p50 !== null);
  return {
    total_gap: estimated.reduce((sum, row) => sum + (row.gap_p50 ?? 0), 0),
    recommended: estimated.length,
    deferred: rows.length - estimated.length,
  };
}

export function recommendationHref(row: MockRecommendation): string {
  const params = new URLSearchParams({
    station: String(row.station_id),
    point: String(row.point_id),
    category: row.category,
    slot: row.slot,
  });
  if (row.retail_location_id) params.set("retail", row.retail_location_id);
  return `/peta?${params.toString()}`;
}

export function confidenceLabel(value: number): "tinggi" | "sedang" | "rendah" {
  if (value >= 0.8) return "tinggi";
  if (value >= 0.65) return "sedang";
  return "rendah";
}

export function pointRank(
  rows: PointMetric[],
  pointId: number | null,
): { rank: number; total: number } | null {
  const estimated = rows.filter((row) => row.gap.p50 !== null);
  const index = estimated.findIndex((row) => row.pointId === pointId);
  return index < 0 ? null : { rank: index + 1, total: estimated.length };
}

export type CategoryMatrixRow = {
  category: CategoryKey;
  by_station: Record<number, MockCategoryStatus | undefined>;
  demand_average: number;
};

export function categoryMatrix(
  rows: MockCategoryStatus[],
  stationIds: number[],
): CategoryMatrixRow[] {
  const categories: CategoryKey[] = ["fnb", "ritel", "apotek", "jasa", "lainnya"];
  return categories.map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    return {
      category,
      by_station: Object.fromEntries(stationIds.map((id) => [
        id,
        categoryRows.find((row) => row.station_id === id),
      ])),
      demand_average: categoryRows.length
        ? categoryRows.reduce((sum, row) => sum + row.demand_share, 0) / categoryRows.length
        : 0,
    };
  });
}
