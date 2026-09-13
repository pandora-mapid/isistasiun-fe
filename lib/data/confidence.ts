import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import type {
  ConfidenceGridProps,
  ConfidenceLayerEntry,
  ObservationPointProps,
  SlotKey,
  Station,
} from "./types";

/**
 * Membangun grid visual kepercayaan yang berpusat pada stasiun aktif.
 *
 * Setiap sel mewarisi nilai persis dari pintu terdekat. Tidak ada interpolasi
 * skor maupun jumlah sampel: `source_point_id` menyatakan bukti asalnya.
 */
export function buildStationConfidenceGrid(
  station: Station | null | undefined,
  slot: SlotKey,
  confidenceEntries: ConfidenceLayerEntry[] = [],
  points: FeatureCollection<Point, ObservationPointProps> | null = null,
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

  if (stEntries.length === 0) return empty;

  const stationPoints = (points?.features ?? []).filter(
    (feature) => feature.properties.station_id === station.id,
  );
  if (stationPoints.length === 0) return empty;

  const stepLng = 0.0055; // ~600m
  const stepLat = 0.0048; // ~530m
  const features: Feature<Polygon, ConfidenceGridProps>[] = [];
  let index = 1;
  for (let dy = 1; dy >= -1; dy--) {
    for (let dx = -1; dx <= 1; dx++) {
      const x1 = Number((centerLng + (dx - 0.5) * stepLng).toFixed(6));
      const x2 = Number((centerLng + (dx + 0.5) * stepLng).toFixed(6));
      const y1 = Number((centerLat + (dy - 0.5) * stepLat).toFixed(6));
      const y2 = Number((centerLat + (dy + 0.5) * stepLat).toFixed(6));
      const cellCenter: [number, number] = [(x1 + x2) / 2, (y1 + y2) / 2];
      const nearest = stationPoints.reduce((best, candidate) => {
        const distance = (feature: typeof candidate) => {
          const [lng, lat] = feature.geometry.coordinates;
          return (lng - cellCenter[0]) ** 2 + (lat - cellCenter[1]) ** 2;
        };
        return distance(candidate) < distance(best) ? candidate : best;
      });
      const evidence = stEntries.find(
        (entry) => entry.point_id === nearest.properties.id,
      );
      if (!evidence) continue;

      features.push({
        type: "Feature",
        id: `zone-${station.id}-${index}`,
        geometry: {
          type: "Polygon",
          coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]],
        },
        properties: {
          zone_id: `zone-${station.id}-${index}`,
          station_id: station.id,
          source_point_id: evidence.point_id,
          confidence_score: evidence.confidence_score,
          sample_count: evidence.sample_count,
          is_thin_sample: evidence.is_thin_sample,
        },
      });
      index++;
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
