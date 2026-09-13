import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import { LAYER, SOURCE } from "./config";
import { LABEL_FONT } from "./style";

export function stationCircleLayer(): CircleLayerSpecification {
  return {
    id: LAYER.stationCircle,
    type: "circle",
    source: SOURCE.stationMarkers,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        11,
        8,
        14,
        11,
        17,
        14,
      ],
      "circle-color": "#0f172a",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2.5,
    },
  };
}

export function stationLabelLayer(): SymbolLayerSpecification {
  return {
    id: LAYER.stationLabel,
    type: "symbol",
    source: SOURCE.stationMarkers,
    layout: {
      "text-field": ["concat", "Stasiun ", ["get", "name"]],
      "text-font": LABEL_FONT,
      "text-size": [
        "interpolate",
        ["linear"],
        ["zoom"],
        11,
        10.5,
        14,
        12,
        17,
        13.5,
      ],
      "text-offset": [0, 1.4],
      "text-anchor": "top",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#0f172a",
      "text-halo-color": "#ffffff",
      "text-halo-width": 2,
    },
  };
}
