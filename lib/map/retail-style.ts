import type { CircleLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import type { RetailKind } from "@/lib/data/retail";
import { LAYER, SOURCE } from "./config";
import { LABEL_FONT } from "./style";

export const RETAIL_LEGEND: Record<RetailKind, { label: string; color: string; description: string }> = {
  existing: { label: "Retail tersedia", color: "#047857", description: "Retail yang sudah tersedia berdasarkan penandaan lokasi." },
  potential: { label: "Potensi toko", color: "#b45309", description: "Lokasi kandidat toko. Estimasi potensi pendapatan belum tersedia." },
  shopfront: { label: "Ruko depan stasiun", color: "#7c3aed", description: "Lokasi ruko depan stasiun. Status ketersediaan dan harga sewa belum dicatat." },
};

export function retailCircleLayer(): CircleLayerSpecification {
  return {
    id: LAYER.retailCircle, type: "circle", source: SOURCE.retail,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 4, 16, 6, 19, 8],
      "circle-color": ["match", ["get", "kind"], "existing", RETAIL_LEGEND.existing.color, "potential", RETAIL_LEGEND.potential.color, RETAIL_LEGEND.shopfront.color],
      "circle-stroke-color": "#ffffff", "circle-stroke-width": 2,
    },
  };
}

export function retailLabelLayer(): SymbolLayerSpecification {
  return {
    id: LAYER.retailLabel, type: "symbol", source: SOURCE.retail, minzoom: 16,
    layout: { "text-field": ["get", "name"], "text-font": LABEL_FONT, "text-size": 12, "text-anchor": "top", "text-offset": [0, 1.1], "text-max-width": 14 },
    paint: { "text-color": "#0f172a", "text-halo-color": "#ffffff", "text-halo-width": 2 },
  };
}
