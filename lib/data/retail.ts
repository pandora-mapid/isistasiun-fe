import type { FeatureCollection, Point } from "geojson";
import type { MockRetailLocation, RetailKind } from "./types";

export type RetailLocation = MockRetailLocation;
export type { RetailKind };

export function retailGeoJSON(locations: MockRetailLocation[]): FeatureCollection<Point, MockRetailLocation> {
  return {
    type: "FeatureCollection",
    features: locations.map((location) => ({
      type: "Feature", id: location.id, properties: location,
      geometry: { type: "Point", coordinates: [location.longitude, location.latitude] },
    })),
  };
}
