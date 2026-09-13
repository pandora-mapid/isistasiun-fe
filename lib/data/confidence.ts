import type { Feature, FeatureCollection, Polygon } from "geojson";
import type {
  ConfidenceGridProps,
  ConfidenceLayerEntry,
  SlotKey,
  Station,
} from "./types";

/**
 * Membangun GeoJSON grid kepercayaan dinamis yang berpusat pada stasiun yang aktif.
 * Mengubah posisi polygon dan nilai skor berdasarkan stasiun dan slot waktu yang dipilih,
 * sehingga lapisan kepercayaan bergerak dinamis mengikuti fokus stasiun pengguna.
 */
export function buildStationConfidenceGrid(
  station: Station | null | undefined,
  slot: SlotKey,
  confidenceEntries: ConfidenceLayerEntry[] = [],
): FeatureCollection<Polygon, ConfidenceGridProps> {
  const empty: FeatureCollection<Polygon, ConfidenceGridProps> = {
    type: "FeatureCollection",
    features: [],
  };

  if (
    !station ||
    typeof station.longitude !== "number" ||
    typeof station.latitude !== "number" ||
    !Number.isFinite(station.longitude) ||
    !Number.isFinite(station.latitude)
  ) {
    return empty;
  }

  const centerLng = station.longitude;
  const centerLat = station.latitude;

  // Skor kepercayaan aktual untuk stasiun & slot ini
  const stEntries = confidenceEntries.filter(
    (e) => e.station_id === station.id && e.time_slot === slot,
  );

  const avgScore =
    stEntries.length > 0
      ? stEntries.reduce((acc, e) => acc + e.confidence_score, 0) /
        stEntries.length
      : station.id === 1
        ? slot === "pagi"
          ? 0.85
          : 0.88
        : slot === "pagi"
          ? 0.45
          : 0.82;

  // Catatan: Sudirman pagi memiliki sampel tipis (pass-by = 0, tidak berdenominator)
  const isSudirmanPagi = station.id === 2 && slot === "pagi";
  const hasThin = stEntries.some((e) => e.is_thin_sample) || isSudirmanPagi;
  const baseSampleCount =
    stEntries.reduce((acc, e) => acc + (e.sample_count ?? 0), 0) ||
    (hasThin ? 1 : 8);

  const stepLng = 0.0055; // ~600m
  const stepLat = 0.0048; // ~530m
  const features: Feature<Polygon, ConfidenceGridProps>[] = [];

  // Grid 3x3 di sekeliling simpul stasiun aktif
  let idx = 1;
  for (let dy = 1; dy >= -1; dy--) {
    for (let dx = -1; dx <= 1; dx++) {
      const isCenter = dx === 0 && dy === 0;
      const x1 = Number((centerLng + (dx - 0.5) * stepLng).toFixed(6));
      const x2 = Number((centerLng + (dx + 0.5) * stepLng).toFixed(6));
      const y1 = Number((centerLat + (dy - 0.5) * stepLat).toFixed(6));
      const y2 = Number((centerLat + (dy + 0.5) * stepLat).toFixed(6));

      const dist = Math.abs(dx) + Math.abs(dy);
      const score = isCenter
        ? avgScore
        : Math.max(0.35, Math.min(0.95, avgScore - dist * 0.07 + dx * 0.02));
      const isThin = isCenter ? hasThin : hasThin || score < 0.55;
      const samples = isCenter
        ? baseSampleCount
        : Math.max(1, Math.round(baseSampleCount * (1 - dist * 0.25)));

      features.push({
        type: "Feature",
        id: `zone-${station.id}-${idx}`,
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [x1, y1],
              [x2, y1],
              [x2, y2],
              [x1, y2],
              [x1, y1],
            ],
          ],
        },
        properties: {
          zone_id: `zone-${station.id}-${idx}`,
          station_id: station.id,
          confidence_score: Number(score.toFixed(2)),
          sample_count: samples,
          is_thin_sample: isThin,
        },
      });
      idx++;
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
