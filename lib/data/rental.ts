import type { FeatureCollection, Point } from "geojson";
import type { RentalAsset, RentalAssetStatus } from "./types";

export const RENTAL_STATUS_LEGEND: Record<
  RentalAssetStatus,
  { label: string; color: string; description: string }
> = {
  occupied: {
    label: "Sudah disewa",
    color: "#64748b",
    description: "Aset tercatat sudah disewa.",
  },
  available: {
    label: "Tersedia",
    color: "#047857",
    description: "Aset tersedia menurut snapshot Space KAI.",
  },
  needs_verification: {
    label: "Perlu verifikasi",
    color: "#b45309",
    description: "Koordinat survei lokal; status dan detail aset belum diverifikasi.",
  },
};

export function rentalGeoJSON(
  assets: RentalAsset[],
): FeatureCollection<Point, RentalAsset> {
  return {
    type: "FeatureCollection",
    features: assets.map((asset) => ({
      type: "Feature",
      id: asset.id,
      geometry: {
        type: "Point",
        coordinates: [asset.longitude, asset.latitude],
      },
      properties: asset,
    })),
  };
}

export function rentalStatusLabel(status: RentalAssetStatus): string {
  return RENTAL_STATUS_LEGEND[status].label;
}
