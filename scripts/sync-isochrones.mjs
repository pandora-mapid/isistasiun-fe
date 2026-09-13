import { readFile, writeFile } from "node:fs/promises";

const pointsPath = new URL("../public/mock/observation-points.geojson", import.meta.url);
const isochronesPath = new URL("../public/mock/isochrones.geojson", import.meta.url);

const points = JSON.parse(await readFile(pointsPath, "utf8"));
const isochrones = JSON.parse(await readFile(isochronesPath, "utf8"));
const targets = new Map(
  points.features.map((feature) => [feature.properties.id, feature.geometry.coordinates]),
);

const features = isochrones.features
  .filter((feature) => targets.has(feature.properties.point_id))
  .map((feature) => {
    const ring = feature.geometry.coordinates[0];
    const uniqueRing = ring.slice(0, -1);
    const center = uniqueRing.reduce(
      ([lng, lat], [x, y]) => [lng + x / uniqueRing.length, lat + y / uniqueRing.length],
      [0, 0],
    );
    const target = targets.get(feature.properties.point_id);
    const delta = [target[0] - center[0], target[1] - center[1]];
    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: [
          ring.map(([lng, lat]) => [
            Number((lng + delta[0]).toFixed(9)),
            Number((lat + delta[1]).toFixed(9)),
          ]),
        ],
      },
      properties: {
        ...feature.properties,
        geometry_status: "prototype-shape-recentered-to-measured-entrance",
      },
    };
  });

await writeFile(
  isochronesPath,
  `${JSON.stringify({ type: "FeatureCollection", features }, null, 2)}\n`,
  "utf8",
);
