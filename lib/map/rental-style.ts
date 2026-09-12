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
      // `is_outlier` sengaja TIDAK digambar di peta. Ia sempat jadi tepi
      // tebal di sini, dan dua hal membatalkannya: efek pemilihan di
      // `MapCanvas` menulis ulang `circle-stroke-width` di keempat cabangnya
      // (jadi tebalnya hilang begitu ada yang dipilih), dan tepi tebal tanpa
      // baris legenda adalah lambang yang tidak menjelaskan dirinya. Pencilan
      // muncul di panel detail sebagai kalimat, di tempat ia bisa disebutkan
      // alasannya.
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

/**
 * Angka indeks sewa/arus di bawah tiap petak — "rupiah per orang lewat".
 *
 * Layer sendiri, terpisah dari `rentalLabelLayer` yang menulis nama petak,
 * karena keduanya tidak ada pada himpunan petak yang sama: nama selalu ada,
 * indeks hanya ada untuk petak yang arusnya terukur. Satu layer untuk keduanya
 * berarti petak tanpa indeks menulis label kosong.
 *
 * Hanya muncul dari zoom 16 ke atas — di bawah itu petak-petak Manggarai
 * berhimpit dalam beberapa piksel dan seluruh angkanya saling menabrak.
 */
export function rentalIndexLayer(): SymbolLayerSpecification {
  return {
    id: LAYER.rentalIndex,
    type: "symbol",
    source: SOURCE.rental,
    minzoom: 16,
    // `index_label` disiapkan sebagai properti fitur di `lib/data/rent.ts`,
    // bukan dirangkai di sini: `text-field` adalah properti layout, dan
    // pemformatan rupiah bukan urusan ekspresi MapLibre. Petak tanpa indeks
    // tidak punya kuncinya sama sekali, jadi saringan inilah yang membuatnya
    // tak berlabel — alih-alih tertulis "Rp 0", yang berarti gratis.
    filter: ["has", "index_label"],
    layout: {
      "text-field": ["get", "index_label"],
      "text-font": LABEL_FONT,
      "text-size": 10.5,
      "text-anchor": "top",
      // Di bawah nama petak (`text-offset: [0, 1.1]`), bukan menimpanya.
      "text-offset": [0, 2.4],
      "text-max-width": 10,
      "text-optional": true,
    },
    paint: {
      "text-color": "#b45f33",
      "text-halo-color": "#faf8f4",
      "text-halo-width": 1.6,
    },
  };
}
