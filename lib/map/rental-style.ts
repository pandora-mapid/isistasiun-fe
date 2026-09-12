import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import { LAYER, SOURCE } from "./config";
import { LABEL_FONT } from "./style";

export function rentalCircleLayer(): CircleLayerSpecification {
  return {
    id: LAYER.rentalCircle,
    type: "circle",
    source: SOURCE.rental,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 5, 16, 7, 19, 9],
      "circle-color": [
        "match",
        ["get", "availability_status"],
        "occupied",
        "#64748b",
        "available",
        "#047857",
        "needs_verification",
        "#b45309",
        "#64748b",
      ],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
      "circle-opacity": 0.92,
    },
  };
}

export function rentalLabelLayer(): SymbolLayerSpecification {
  return {
    id: LAYER.rentalLabel,
    type: "symbol",
    source: SOURCE.rental,
    minzoom: 16,
    layout: {
      "text-field": ["get", "plot_name"],
      "text-font": LABEL_FONT,
      "text-size": 11,
      "text-anchor": "top",
      "text-offset": [0, 1.1],
      "text-max-width": 13,
      "text-optional": true,
    },
    paint: {
      "text-color": [
        "match",
        ["get", "availability_status"],
        "occupied",
        "#64748b",
        "available",
        "#047857",
        "needs_verification",
        "#b45309",
        "#64748b",
      ],
      "text-halo-color": "#ffffff",
      "text-halo-width": 2,
    },
  };
}
