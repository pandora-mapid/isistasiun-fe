"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Point } from "geojson";
import Link from "next/link";
import { NavBar } from "./NavBar";
import { MapCanvas } from "./MapCanvas";
import { StationSearch } from "./StationSearch";
import { ComparisonDialog } from "./ComparisonDialog";
import { BandingSimpulOverlay } from "./BandingSimpulOverlay";
import { TabelAtribut } from "./TabelAtribut";
import { BriefSimpul } from "./BriefSimpul";
import { barisAtribut, csvAtribut, namaBerkasAtribut } from "@/lib/export/rows";
import { unduhTeks } from "@/lib/export/unduh";
import { buildStationConfidenceGrid } from "@/lib/data/confidence";
import { retailGeoJSON, type RetailLocation } from "@/lib/data/retail";
import { rentalGeoJSON } from "@/lib/data/rental";
import type { RentPlot } from "@/lib/data/rent";
import {
  categoryStatusesFor,
  confidenceLabel,
  evidenceFor,
  pointRank,
} from "@/lib/analytics/demo-select";
import { RetailPanel, type FilterCategory } from "./RetailPanel";
import { RETAIL_KINDS, RETAIL_LEGEND } from "@/lib/map/retail-style";
import {
  biggestGapPoint,
  confidenceDomainOf,
  domainOf,
  findConfidence,
  findPoint,
  metricsFor,
  pointsOfStation,
  posisiDalamRentang,
  slotOf,
  type PointMetric,
} from "@/lib/analytics/select";
import {
  ALL_CATEGORIES,
  CATEGORIES,
  SLOTS,
  categoryLabel,
  slotLabel,
  type CategoryFilter,
} from "@/lib/data/dimensions";
import type { PointFeatureState, SlotKey, Station } from "@/lib/data/types";
import { usePetaData } from "@/lib/data/usePetaData";
import { askCopilot, type CopilotAnswer } from "@/lib/data/source";
import {
  desimal,
  jarak,
  persen,
  ribuan,
  rupiah,
  rupiahRingkas,
  TIDAK_DIESTIMASI,
} from "@/lib/format";
import {
  CATCHMENT_MINUTES,
  LAYER_GROUPS,
  namaBasemapDikenali,
  type BasemapName,
} from "@/lib/map/config";
import { MapToolbar, type LayerToggleItem } from "./map/MapToolbar";
import { scaleBarFor } from "@/lib/map/scale";
import {
  CONFIDENCE_GRID_RAMP,
  gapColorStops,
  DOMAIN_AWAL,
  LEGEND_DOT,
} from "@/lib/map/style";

export type PetaInitialQuery = {
  stationId: number | null;
  pointId: number | null;
  retailId: string | null;
  rentalId?: string | null;
  retailFilter?: FilterCategory;
  slot: SlotKey;
  category: CategoryFilter;
};

type LayerRow = {
  key: string;
  label: string;
  dot: string;
  tint: string;
};

function updatePetaUrl(values: Record<string, string | null>): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

/**
 * Baris panel lapisan.
 *
 * Baris yang punya pasangan di `LAYER_GROUPS` benar-benar menghidupkan dan
 * mematikan layer peta. Sisanya belum punya data sama sekali — panel
 * menandainya "belum ada data" alih-alih memasang sakelar yang diam-diam
 * tidak melakukan apa pun. Lihat ROADMAP §6 untuk yang mana saja janji
 * proposal dan kapan datanya diharapkan ada.
 *
 * Dua baris — *Kategori hilang* dan *Arus pintu* — sempat ditandai "belum ada
 * data" padahal datanya sudah ada sejak Fase 1 (`by_category` dan variabel
 * `F`). Yang belum ada waktu itu bentuk visualnya, bukan datanya, dan label
 * yang keliru itu membuat panel ini ikut menyesatkan.
 */
const LAYER_ROWS: LayerRow[] = [
  {
    key: "retail",
    label: "Retail & potensi toko",
    dot: "#047857",
    tint: "rgba(4,120,87,.08)",
  },
  {
    key: "gap",
    label: "Kesenjangan belanja",
    dot: "var(--data)",
    tint: "var(--data-wash)",
  },
  {
    key: "kepercayaan",
    label: "Kepercayaan data",
    dot: "var(--rule-strong)",
    tint: "var(--data-wash)",
  },
  {
    key: "arus",
    label: "Arus pintu stasiun",
    dot: "var(--data)",
    tint: "var(--data-wash)",
  },
  // Satu baris, bukan dua. "Indeks sewa / arus" dan "Aset sewa stasiun"
  // sempat berdiri sendiri-sendiri dan menyalakan petak Space KAI yang sama —
  // dua sakelar untuk satu himpunan petak. Inventaris dan indeksnya kini satu
  // source (lihat `lib/data/rent.ts`), jadi sakelarnya juga satu.
  {
    key: "rental",
    label: "Aset sewa & indeks arus",
    dot: "#047857",
    tint: "rgba(4,120,87,.08)",
  },
  {
    key: "event",
    label: "Event & aktivasi",
    dot: "var(--ink-faint)",
    tint: "rgba(22,19,15,.06)",
  },
];

/** Baris yang benar-benar menggerakkan peta. */
const LAYER_TERSEDIA = LAYER_ROWS.filter((r) => r.key in LAYER_GROUPS);
const DEFAULT_ACTIVE_LAYERS = ["gap", "kepercayaan", "retail", "rental"];

/** Warna titik kategori pada chip — murni hiasan, sepadan dengan legenda. */
const CATEGORY_DOT: Record<string, string> = {
  fnb: "var(--data)",
  ritel: "var(--ink-2)",
  apotek: "var(--data)",
  jasa: "var(--data)",
  lainnya: "var(--ink-2)",
};

/**
 * Ruang terlebar yang boleh dipakai batang skala jarak.
 *
 * Sempat dikecilkan ke 64 supaya sejajar dengan kolom lambang saat legenda
 * berupa daftar menurun. Susunan itu dibatalkan, jadi batasnya kembali ke
 * ukuran yang dipilih karena alasan keterbacaan, bukan karena tata letak.
 */
const SKALA_MAKS_PX = 92;

/** Satu butir keterangan di legenda: lambang dan tulisannya. */
const LEGENDA_TEKS: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ink-2)",
  whiteSpace: "nowrap",
};

/** Satu kelompok di legenda: judul kecil di atas, isinya di bawah. */
const LEGENDA_GRUP: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  flex: "none",
};

/**
 * Sekat antar kelompok di legenda.
 *
 * `alignSelf: stretch` — bukan tinggi tetap — supaya sekatnya membentang
 * setinggi kelompok tertinggi. Sekat pendek di tengah baris justru membuat
 * kelompoknya terlihat mengambang, dan itu keluhan yang pernah muncul.
 */
const LEGENDA_SEKAT: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  background: "var(--rule)",
  flex: "none",
};

/**
 * Garis penghubung antar pil slot waktu.
 *
 * `flex: 1` pada tiap ruas itulah yang membuat keempatnya berbagi sisa ruang
 * dengan rata; ditulis sekali di sini supaya tidak ada ruas yang diam-diam
 * beda dari yang lain.
 */
const GARIS_SLOT: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: "var(--rule-strong)",
};

const QUESTIONS = [
  "pintu mana yang gapnya paling besar sore hari?",
  "bandingkan Manggarai dengan Sudirman",
  "kawasan mana yang sampelnya masih tipis?",
];

/**
 * Copilot memakai kosakata kategori/slot backend (makanan_minuman, evening, …);
 * peta memakai kunci lokal (fnb, sore, …). Peta inilah jembatannya, jadi
 * `spatial_filter` dari AI bisa langsung menggerakkan filter peta.
 */
const AI_CATEGORY_TO_FE: Record<string, CategoryFilter> = {
  makanan_minuman: "fnb",
  ritel_kemasan: "ritel",
  apotek_kesehatan: "apotek",
  jasa: "jasa",
  lainnya: "lainnya",
};
const AI_SLOT_TO_FE: Record<string, SlotKey> = {
  morning: "pagi",
  midday: "siang",
  evening: "sore",
  night: "malam",
};

export function PetaScreen({
  initialQuery,
}: {
  initialQuery: PetaInitialQuery;
}) {
  const {
    points,
    isochrones,
    analytics,
    confidence,
    stations,
    entrances,
    demo,
    rentals,
    error,
  } = usePetaData();

  const [activeRetailFilter, setActiveRetailFilter] = useState<FilterCategory>(
    initialQuery.retailFilter ?? "all",
  );
  const [tab, setTab] = useState<"brief" | "retail" | "copilot">(
    initialQuery.retailFilter || initialQuery.retailId || initialQuery.rentalId
      ? "retail"
      : "brief",
  );
  const [activeLayers, setActiveLayers] = useState<string[]>(
    DEFAULT_ACTIVE_LAYERS,
  );
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(
    initialQuery.category,
  );
  const [activeCatchment, setActiveCatchment] = useState<number>(5);
  const [activeSlot, setActiveSlot] = useState<SlotKey>(initialQuery.slot);
  const [bottomDockCollapsed, setBottomDockCollapsed] = useState(false);
  const [legendVisible, setLegendVisible] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const savedCollapsed = window.localStorage.getItem(
          "isistasiun_bottom_dock_collapsed",
        );
        if (savedCollapsed !== null) {
          setBottomDockCollapsed(savedCollapsed === "true");
        }
        const savedLegend = window.localStorage.getItem(
          "isistasiun_bottom_legend_visible",
        );
        if (savedLegend !== null) {
          setLegendVisible(savedLegend === "true");
        }
      } catch {
        // Abaikan bila localStorage tidak tersedia
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const updateDockCollapsed = (collapsed: boolean) => {
    setBottomDockCollapsed(collapsed);
    try {
      window.localStorage.setItem(
        "isistasiun_bottom_dock_collapsed",
        String(collapsed),
      );
    } catch {
      // Abaikan bila localStorage tidak tersedia
    }
  };

  const updateLegendVisible = (
    action: boolean | ((prev: boolean) => boolean),
  ) => {
    setLegendVisible((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      try {
        window.localStorage.setItem(
          "isistasiun_bottom_legend_visible",
          String(next),
        );
      } catch {
        // Abaikan bila localStorage tidak tersedia
      }
      return next;
    });
  };
  const [showTransparansi, setShowTransparansi] = useState(false);
  const [showCopilotResult, setShowCopilotResult] = useState(false);
  const [cqInput, setCqInput] = useState("");
  const [cqAsked, setCqAsked] = useState<string | null>(null);
  const [cqAnswer, setCqAnswer] = useState<CopilotAnswer | null>(null);
  const [cqLoading, setCqLoading] = useState(false);
  const [cqError, setCqError] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  /**
   * Overlay "Ringkasan & Bandingkan Simpul" — fitur TERPISAH dari
   * `showComparison` di atas. Dua tombol, dua label, dua sumber angka; lihat
   * catatan di `components/BandingSimpulOverlay.tsx`.
   */
  const [showBandingSimpul, setShowBandingSimpul] = useState(false);
  const [showTabel, setShowTabel] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [stationTarget, setStationTarget] = useState<{
    longitude: number;
    latitude: number;
    zoom?: number;
  } | null>(null);
  const [selectedRetailChoice, setSelectedRetail] = useState<
    RetailLocation | null | undefined
  >(undefined);
  const [selectedRentalChoice, setSelectedRental] = useState<
    RentPlot | null | undefined
  >(undefined);

  const [activeBasemap, setActiveBasemap] = useState<BasemapName>(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("basemap");
      if (param && namaBasemapDikenali(param)) return param;
    }
    return "liberty";
  });

  const handleSelectBasemap = useCallback((newBasemap: BasemapName) => {
    setActiveBasemap(newBasemap);
    updatePetaUrl({ basemap: newBasemap });
  }, []);

  const [resetTrigger, setResetTrigger] = useState(0);
  const handleResetView = useCallback(() => {
    setResetTrigger((prev) => prev + 1);
  }, []);

  const layerToggleItems: LayerToggleItem[] = useMemo(
    () =>
      LAYER_ROWS.map((r) => ({
        key: r.key,
        label: r.label,
        dot: r.dot,
        available: r.key in LAYER_GROUPS,
      })),
    [],
  );

  const handleRetailFilterChange = useCallback((filter: FilterCategory) => {
    setActiveRetailFilter(filter);
    updatePetaUrl({
      retail_filter: filter === "all" ? null : filter,
    });
    if (filter === "sewa") {
      setActiveLayers((current) =>
        current.includes("rental") ? current : [...current, "rental"],
      );
    }
    if (filter === "potensi" || filter === "existing" || filter === "ruko") {
      setActiveLayers((current) =>
        current.includes("retail") ? current : [...current, "retail"],
      );
    }
  }, []);

  const selectRetail = useCallback((location: RetailLocation) => {
    setSelectedRental(null);
    setSelectedRetail(location);
    setStationTarget({
      longitude: location.longitude,
      latitude: location.latitude,
      zoom: 19,
    });
    setActiveLayers((current) =>
      current.includes("retail") ? current : [...current, "retail"],
    );
    updatePetaUrl({
      retail: location.id,
      rental: null,
    });
    setTab("retail");
  }, []);

  const selectRental = useCallback((asset: RentPlot) => {
    setSelectedRental(asset);
    setSelectedRetail(null);
    setStationTarget({
      longitude: asset.longitude,
      latitude: asset.latitude,
      zoom: 19,
    });
    setActiveLayers((current) =>
      current.includes("rental") ? current : [...current, "rental"],
    );
    updatePetaUrl({
      rental: asset.id,
      retail: null,
    });
    setTab("retail");
  }, []);

  const handleCloseRetail = useCallback(() => {
    setSelectedRetail(null);
    updatePetaUrl({ retail: null });
  }, []);

  const handleCloseRental = useCallback(() => {
    setSelectedRental(null);
    updatePetaUrl({ rental: null });
  }, []);

  /**
   * Kirim pertanyaan ke copilot backend (`POST /copilot/query`) lalu terapkan
   * hasilnya ke peta: aktifkan `suggested_layers`, dan pindahkan filter
   * kategori/slot sesuai `spatial_filter`. Angka jawaban tidak di-parse di sini
   * — backend & verifier yang menjaminnya; kita hanya menampilkan prosanya.
   *
   * `station_id` sengaja tidak dikirim: backend memvalidasinya sebagai UUID,
   * sementara stasiun di peta memakai id numerik (1/2). Copilot tetap menjawab
   * tanpa konteks stasiun; peta sudah menampilkan kedua simpul.
   */
  const submitCopilot = useCallback(
    async (raw: string) => {
      const query = raw.trim();
      if (!query || cqLoading) return;
      setCqAsked(query);
      setCqInput("");
      setCqLoading(true);
      setCqError(false);
      setShowCopilotResult(true);
      try {
        const ans = await askCopilot(query);
        setCqAnswer(ans);
        const cat = ans.spatial_filter?.category;
        if (cat && AI_CATEGORY_TO_FE[cat])
          setActiveCategory(AI_CATEGORY_TO_FE[cat]);
        const slot = ans.spatial_filter?.time_slot;
        if (slot && AI_SLOT_TO_FE[slot]) setActiveSlot(AI_SLOT_TO_FE[slot]);
        const layers = (ans.suggested_layers ?? []).filter(
          (key) => key in LAYER_GROUPS,
        );
        if (layers.length) {
          setActiveLayers((prev) => Array.from(new Set([...prev, ...layers])));
        }
      } catch {
        setCqError(true);
      } finally {
        setCqLoading(false);
      }
    },
    [cqLoading],
  );

  /**
   * Titik yang dipilih pengguna.
   *
   * `undefined` berarti pengguna belum memutuskan apa pun — saat itu pilihan
   * jatuh ke titik berkesenjangan terbesar. `null` berarti pengguna memang
   * melepas pilihannya lewat tombol tutup. Perbedaan keduanya penting: tanpa
   * itu, melepas pilihan akan langsung terisi ulang oleh nilai bawaan.
   */
  const [pilihanTitik, setPilihanTitik] = useState<number | null | undefined>(
    undefined,
  );
  /** Meter per piksel layar, dilaporkan peta tiap kali kameranya bergerak. */
  const [metersPerPixel, setMetersPerPixel] = useState<number | null>(null);

  /**
   * Esc menutup modal transparansi.
   *
   * Latar gelapnya memang bisa diklik untuk menutup, tapi latar itu tidak bisa
   * dijangkau keyboard sama sekali — tanpa Esc, pengguna yang tidak memakai
   * tetikus hanya punya satu jalan keluar, yaitu menemukan tombol silangnya.
   */
  useEffect(() => {
    if (!showTransparansi) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowTransparansi(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showTransparansi]);

  /**
   * Peta melaporkan skala di setiap frame gerakan. Perubahan di bawah 1%
   * diabaikan supaya menggeser peta tidak memicu render ulang seluruh panel
   * — mengembalikan nilai lama membuat React berhenti di situ.
   */
  const handleScale = useCallback((nilai: number) => {
    setMetersPerPixel((prev) =>
      prev !== null && Math.abs(prev - nilai) / nilai < 0.01 ? prev : nilai,
    );
  }, []);

  /* ---------------------------------------------------------------------
   * Turunan data — seluruhnya lewat `lib/analytics/select.ts`, tidak ada
   * angka yang dihitung di dalam JSX. Peta dan panel membaca hasil yang
   * sama persis, jadi keduanya tidak bisa berbeda.
   * ------------------------------------------------------------------ */

  const metrics = useMemo(
    () =>
      analytics
        ? metricsFor(analytics, activeSlot, activeCategory, confidence ?? [])
        : new Map<number, PointMetric>(),
    [analytics, confidence, activeSlot, activeCategory],
  );

  const gapDomain = useMemo(
    () => (metrics.size ? domainOf(metrics.values()) : DOMAIN_AWAL),
    [metrics],
  );

  const confidenceDomain = useMemo(
    () => confidenceDomainOf(metrics.values()),
    [metrics],
  );

  const featureStates = useMemo(() => {
    const out = new Map<number, PointFeatureState>();
    for (const [id, m] of metrics) {
      out.set(id, {
        gap: m.gap.p50 ?? 0,
        sampel_tipis: m.sampelTipis,
        confidence: m.confidence,
      });
    }
    return out;
  }, [metrics]);

  /**
   * Titik beserta angka yang ditulis sebagai label di peta.
   *
   * Angkanya ikut sebagai **properti fitur**, bukan lewat `setFeatureState`,
   * karena `text-field` adalah properti layout dan MapLibre menolak ekspresi
   * feature-state di sana. Konsekuensinya source ini disusun ulang tiap kali
   * slot atau kategori berganti — murah, karena isinya cuma belasan titik.
   */
  const labelData = useMemo(() => {
    if (!points) return null;
    return {
      type: "FeatureCollection" as const,
      features: points.features.map((f) => {
        const m = metrics.get(f.properties.id);
        return {
          type: "Feature" as const,
          geometry: f.geometry,
          properties: {
            // `arus_teks` sengaja tidak disetel kalau angkanya tidak ada —
            // layer-nya memakai filter ["has", …], jadi titik tanpa angka
            // tidak menampilkan tulisan kosong.
            ...(m?.arus != null ? { arus_teks: `${ribuan(m.arus)}/jam` } : {}),
          },
        };
      }),
    };
  }, [points, metrics]);

  /**
   * Nama tiap titik dan tiap stasiun.
   *
   * Keduanya dibaca dari **atribut**, bukan dari geometri. Selama geometri
   * masih GeoJSON, browser kebetulan memegang daftar fitur lengkap sehingga
   * nama bisa diambil dari sana — tetapi begitu geometri pindah ke tile
   * vektor, yang diterima hanya fitur di dalam layar. Panel akan menampilkan
   * `#24` alih-alih "Pintu 4" untuk titik yang sedang tidak terlihat, dan
   * gejalanya sulit dilacak. Lihat ROADMAP §4.1.
   */
  const pointLabels = useMemo(() => {
    const out = new Map<number, string>();
    for (const e of entrances ?? []) out.set(e.id, e.point_label);
    return out;
  }, [entrances]);

  const stationNames = useMemo(() => {
    const out = new Map<number, string>();
    for (const st of stations ?? []) out.set(st.id, st.name);
    return out;
  }, [stations]);

  const visibleLayers = useMemo(
    () => activeLayers.flatMap((key) => LAYER_GROUPS[key] ?? []),
    [activeLayers],
  );

  // Tampilan awal jatuh ke titik dengan kesenjangan terbesar — itu yang paling
  // pantas dilihat lebih dulu, dan menghindari panel kosong saat halaman buka.
  const selectedPointId =
    pilihanTitik === undefined
      ? analytics
        ? (initialQuery.pointId ??
          analytics.points.find(
            (item) => item.station_id === initialQuery.stationId,
          )?.point_id ??
          biggestGapPoint(analytics))
        : null
      : pilihanTitik;

  const selectedPoint = analytics
    ? findPoint(analytics, selectedPointId)
    : null;
  const selectedMetric =
    selectedPointId === null ? null : (metrics.get(selectedPointId) ?? null);
  const selectedConfidence = findConfidence(
    confidence ?? [],
    selectedPointId,
    activeSlot,
  );
  const selectedSlotRow = selectedPoint
    ? slotOf(selectedPoint, activeSlot)
    : null;
  const stationMetrics = selectedPoint
    ? pointsOfStation(metrics, selectedPoint.station_id)
    : [];
  const stationMax = Math.max(1, ...stationMetrics.map((m) => m.gap.p50 ?? 0));
  const selectedRank = pointRank(stationMetrics, selectedPointId);
  const station = stations?.find((s) => s.id === selectedPoint?.station_id);
  const stationLocations = useMemo<FeatureCollection<Point, Station>>(
    () => ({
      type: "FeatureCollection",
      features: (stations ?? [])
        .filter(
          (s): s is Station & { longitude: number; latitude: number } =>
            typeof s.longitude === "number" &&
            typeof s.latitude === "number" &&
            Number.isFinite(s.longitude) &&
            Number.isFinite(s.latitude),
        )
        .map((s) => ({
          type: "Feature",
          id: s.id,
          geometry: {
            type: "Point",
            coordinates: [s.longitude, s.latitude],
          },
          properties: s,
        })),
    }),
    [stations],
  );

  const currentStation = useMemo(() => {
    if (station) return station;
    if (initialQuery.stationId) {
      const match = stations?.find((s) => s.id === initialQuery.stationId);
      if (match) return match;
    }
    return stations?.find((s) => s.id === 1) ?? stations?.[0] ?? null;
  }, [station, stations, initialQuery.stationId]);

  const rentalAssets = useMemo(
    () =>
      (rentals ?? []).filter(
        (asset) => !currentStation || asset.station_id === currentStation.id,
      ),
    [rentals, currentStation],
  );
  const rentalData = useMemo(() => rentalGeoJSON(rentalAssets), [rentalAssets]);

  const retailLocations = useMemo(
    () =>
      (demo?.retail ?? []).filter(
        (location) =>
          (!currentStation || location.station_id === currentStation.id) &&
          (activeCategory === ALL_CATEGORIES ||
            location.category === activeCategory),
      ),
    [demo, activeCategory, currentStation],
  );
  const retailData = useMemo(
    () => retailGeoJSON(retailLocations),
    [retailLocations],
  );
  const linkedRetail =
    retailLocations.find((item) => item.id === initialQuery.retailId) ?? null;
  const selectedRetail =
    selectedRetailChoice === undefined ? linkedRetail : selectedRetailChoice;
  const linkedRental =
    rentalAssets.find((item) => item.id === initialQuery.rentalId) ?? null;
  const selectedRental =
    selectedRentalChoice === undefined ? linkedRental : selectedRentalChoice;
  const linkedStation = stations?.find(
    (item) => item.id === initialQuery.stationId,
  );
  const effectiveStationTarget = useMemo(
    () =>
      stationTarget ??
      (selectedRetail
        ? {
            longitude: selectedRetail.longitude,
            latitude: selectedRetail.latitude,
            zoom: 19,
          }
        : selectedRental
          ? {
              longitude: selectedRental.longitude,
              latitude: selectedRental.latitude,
              zoom: 19,
            }
          : linkedStation?.longitude !== undefined &&
              linkedStation.latitude !== undefined
            ? {
                longitude: linkedStation.longitude,
                latitude: linkedStation.latitude,
              }
            : null),
    [stationTarget, selectedRetail, selectedRental, linkedStation],
  );

  const dynamicConfidenceGrid = useMemo(
    () =>
      buildStationConfidenceGrid(currentStation, activeSlot, confidence ?? []),
    [currentStation, activeSlot, confidence],
  );

  const handleSelectStation = useCallback(
    (target: Station) => {
      setSelectedRetail(null);
      setSelectedRental(null);
      if (
        typeof target.longitude === "number" &&
        typeof target.latitude === "number"
      ) {
        setStationTarget({
          longitude: target.longitude,
          latitude: target.latitude,
          zoom: 16.5,
        });
      }
      const point = analytics?.points.find((p) => p.station_id === target.id);
      setPilihanTitik(point?.point_id ?? null);
      updatePetaUrl({
        station: String(target.id),
        point: point ? String(point.point_id) : null,
        retail: null,
      });
      setTab("brief");
      setShowTransparansi(false);
    },
    [analytics],
  );

  const categoryStatuses = categoryStatusesFor(
    demo?.category_statuses ?? [],
    selectedPoint?.station_id,
  );
  const selectedEvidence = evidenceFor(demo?.evidence ?? [], selectedPointId);
  const evidenceDate = selectedEvidence
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(selectedEvidence.surveyed_at))
    : "Belum tersedia";

  const tabX = { brief: 4, retail: 130, copilot: 256 }[tab];
  const legend = gapColorStops(gapDomain);
  /** Batang skala: `null` selama peta belum melaporkan ukurannya. */
  const scaleBar = metersPerPixel
    ? scaleBarFor(metersPerPixel, SKALA_MAKS_PX)
    : null;

  function toggleLayer(key: string) {
    if (!(key in LAYER_GROUPS)) return;
    setActiveLayers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  /** Nilai V yang sedang berlaku: milik kategori kalau ada, kalau tidak agregat. */
  const nilaiV =
    selectedMetric?.kategori?.nilai_transaksi ??
    selectedMetric?.variables?.V ??
    null;

  return (
    <div
      className="page-canvas paper-canvas peta-canvas"
      style={{ height: "100vh", position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--paper-2)",
        }}
      >
        {/* Peta sungguhan. Kanvas mengisi kotak berposisi absolut ini, dan
           seluruh panel — termasuk pil nav di bawah — melayang di atasnya. */}
        <MapCanvas
          points={points}
          isochrones={isochrones}
          labelData={labelData}
          featureStates={featureStates}
          gapDomain={gapDomain}
          confidenceDomain={confidenceDomain}
          confidenceGrid={dynamicConfidenceGrid}
          catchmentMinutes={activeCatchment}
          visibleLayers={visibleLayers}
          selectedPointId={selectedPointId}
          onSelectPoint={setPilihanTitik}
          dataError={error}
          onScaleChange={handleScale}
          stationTarget={effectiveStationTarget}
          retailLocations={retailData}
          selectedRetailId={selectedRetail?.id ?? null}
          onSelectRetail={selectRetail}
          rentalLocations={rentalData}
          selectedRentalId={selectedRental?.id ?? null}
          onSelectRental={selectRental}
          stationLocations={stationLocations}
          selectedStationId={currentStation?.id ?? null}
          onSelectStation={handleSelectStation}
          activeRetailFilter={activeRetailFilter}
          basemap={activeBasemap}
          resetTrigger={resetTrigger}
        />
        <MapToolbar
          activeLayers={activeLayers}
          onToggleLayer={toggleLayer}
          layerItems={layerToggleItems}
          activeCatchment={activeCatchment}
          onSelectCatchment={setActiveCatchment}
          activeBasemap={activeBasemap}
          onSelectBasemap={handleSelectBasemap}
          onResetView={handleResetView}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat as CategoryFilter)}
          categories={[
            { key: ALL_CATEGORIES, label: "Semua" },
            ...CATEGORIES.map((c) => ({
              key: c.key,
              label: c.label,
              dot: CATEGORY_DOT[c.key],
            })),
          ]}
        />
        <StationSearch
          stations={stations}
          selectedStationId={currentStation?.id ?? null}
          error={error}
          onSelect={handleSelectStation}
        />
        <div
          className="peta-chip-stasiun"
          style={{
            position: "absolute",
            top: 178,
            left: 64,
            zIndex: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          {(stations ?? [])
            .filter(
              (s) =>
                typeof s.longitude === "number" &&
                typeof s.latitude === "number" &&
                Number.isFinite(s.longitude) &&
                Number.isFinite(s.latitude),
            )
            .map((s) => {
              const isSelected = currentStation?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectStation(s)}
                  className="pill btn-reset"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 13px",
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 500,
                    background: isSelected
                      ? "#0f172a"
                      : "rgba(255, 255, 255, 0.92)",
                    color: isSelected ? "#ffffff" : "#0f172a",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                    border: `1px solid ${isSelected ? "#0f172a" : "#cbd5e1"}`,
                    cursor: "pointer",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 13 }}>🚆</span>
                  <span>Stasiun {s.name}</span>
                </button>
              );
            })}
        </div>

        {/* BILAH KONTROL WAKTU & LEGENDA (UNIFIED COMPACT DOCK) */}
        <>
          <button
            type="button"
            onClick={() => updateDockCollapsed(false)}
            className="pill btn-reset map-bottom-dock-transition"
            title="Tampilkan kontrol waktu & legenda"
            aria-label="Tampilkan kontrol waktu dan legenda"
            aria-expanded={!bottomDockCollapsed}
            aria-controls="map-bottom-dock"
            aria-hidden={!bottomDockCollapsed}
            tabIndex={bottomDockCollapsed ? 0 : -1}
            style={{
              position: "absolute",
              left: 24,
              bottom: 18,
              zIndex: 15,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid #cbd5e1",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
              color: "#0f172a",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              opacity: bottomDockCollapsed ? 1 : 0,
              visibility: bottomDockCollapsed ? "visible" : "hidden",
              pointerEvents: bottomDockCollapsed ? "auto" : "none",
              transform: bottomDockCollapsed
                ? "translateY(0) scale(1)"
                : "translateY(8px) scale(0.96)",
              transformOrigin: "left bottom",
              transition: bottomDockCollapsed
                ? "opacity 220ms ease, transform 240ms cubic-bezier(.22,1,.36,1), visibility 0s linear"
                : "opacity 160ms ease, transform 200ms cubic-bezier(.4,0,.2,1), visibility 0s linear 200ms",
            }}
          >
            <span style={{ fontSize: 13 }}>⏱️</span>
            <span>Slot: {slotLabel(activeSlot)}</span>
            <span style={{ color: "#64748b", fontSize: 11, fontWeight: 450 }}>
              · Buka Kontrol &amp; Legenda
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>

          <div
            id="map-bottom-dock"
            className="glass map-bottom-dock-transition"
            aria-hidden={bottomDockCollapsed}
            inert={bottomDockCollapsed}
            style={{
              position: "absolute",
              left: 24,
              bottom: 18,
              maxWidth: "calc(100% - 480px)",
              zIndex: 15,
              padding: "8px 14px 10px",
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(14px)",
              border: "1px solid #cbd5e1",
              boxShadow: "0 6px 24px rgba(15, 23, 42, 0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              opacity: bottomDockCollapsed ? 0 : 1,
              visibility: bottomDockCollapsed ? "hidden" : "visible",
              pointerEvents: bottomDockCollapsed ? "none" : "auto",
              transform: bottomDockCollapsed
                ? "translateY(10px) scale(0.98)"
                : "translateY(0) scale(1)",
              transformOrigin: "left bottom",
              transition: bottomDockCollapsed
                ? "opacity 180ms ease, transform 220ms cubic-bezier(.4,0,.2,1), visibility 0s linear 220ms"
                : "opacity 220ms ease, transform 260ms cubic-bezier(.22,1,.36,1), visibility 0s linear",
            }}
          >
            {/* Baris 1: Header Ringkas + Tombol Aksi */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  className="k"
                  style={{ fontSize: 10, letterSpacing: "0.04em" }}
                >
                  SLOT WAKTU
                </span>
                <span style={{ fontSize: 10, color: "var(--ink-faint)" }}>
                  · Hari kerja
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {/* Tombol Toggle Legenda */}
                <button
                  type="button"
                  onClick={() => updateLegendVisible((v) => !v)}
                  className="btn-reset"
                  aria-expanded={legendVisible}
                  aria-controls="map-legend-content"
                  title={
                    legendVisible ? "Sembunyikan legenda" : "Tampilkan legenda"
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10.5,
                    fontWeight: 500,
                    color: legendVisible ? "#0f172a" : "#64748b",
                    background: legendVisible
                      ? "rgba(15, 23, 42, 0.06)"
                      : "transparent",
                    padding: "2px 7px",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span>Legenda</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                      transform: legendVisible
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Tombol Sembunyikan Seluruh Dock */}
                <button
                  type="button"
                  onClick={() => updateDockCollapsed(true)}
                  className="btn-reset"
                  title="Sembunyikan bilah agar peta bersih"
                  aria-label="Sembunyikan kontrol waktu dan legenda"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 10.5,
                    fontWeight: 500,
                    color: "#64748b",
                    padding: "2px 6px",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  <span>Sembunyikan</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Baris 2: Tombol Slot Waktu */}
            <div className="row" style={{ gap: 5, alignItems: "center" }}>
              {SLOTS.map((slot, i) => {
                const active = activeSlot === slot.key;
                const tipis =
                  selectedPoint?.by_slot.find((s) => s.slot === slot.key)
                    ?.sampel_tipis ?? false;
                return (
                  <Fragment key={slot.key}>
                    {i > 0 && <span style={GARIS_SLOT} />}
                    <button
                      onClick={() => setActiveSlot(slot.key)}
                      title={`dicacah ${slot.jam}`}
                      className="pill"
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        padding: "6px 14px",
                        background: active ? "var(--ink)" : "var(--paper-2)",
                        color: active ? "var(--surface)" : "var(--ink-2)",
                        font: `${active ? 600 : 500} 11.5px/1 var(--font-inter)`,
                        boxShadow: active ? "var(--shadow-soft)" : "none",
                        borderRadius: 999,
                        transition: "all 0.12s ease",
                      }}
                    >
                      {slot.label}
                      {tipis && (
                        <span
                          className="fig"
                          style={{
                            opacity: 0.7,
                            fontWeight: 400,
                            marginLeft: 4,
                          }}
                        >
                          tipis
                        </span>
                      )}
                    </button>
                  </Fragment>
                );
              })}

              <span
                style={{
                  width: 1,
                  height: 18,
                  background: "var(--rule)",
                  margin: "0 4px",
                  flex: "none",
                }}
              />

              <span className="row" style={{ gap: 6, flex: "none" }}>
                <span className="k" style={{ fontSize: 10 }}>
                  Pembanding
                </span>
                <span
                  className="pill"
                  title="satu sampel pembanding di akhir pekan — dijanjikan proposal, belum dicacah"
                  style={{
                    padding: "6px 12px",
                    border: "1.5px dashed var(--rule-strong)",
                    background: "var(--paper-2)",
                    color: "var(--ink-muted)",
                    font: "500 11px/1 var(--font-inter)",
                    cursor: "not-allowed",
                    borderRadius: 999,
                  }}
                >
                  Akhir pekan
                </span>
              </span>
            </div>

            {/* Baris 3 (Opsional): Konten Legenda yang Padat */}
            <div
              id="map-legend-content"
              className="map-legend-transition"
              aria-hidden={!legendVisible}
              style={{
                display: "grid",
                gridTemplateRows: legendVisible ? "1fr" : "0fr",
                opacity: legendVisible ? 1 : 0,
                visibility: legendVisible ? "visible" : "hidden",
                transition: legendVisible
                  ? "grid-template-rows 260ms cubic-bezier(.22,1,.36,1), opacity 180ms ease, visibility 0s linear"
                  : "grid-template-rows 220ms cubic-bezier(.4,0,.2,1), opacity 140ms ease, visibility 0s linear 220ms",
              }}
            >
              <div style={{ minHeight: 0, overflow: "hidden" }}>
                <div
                  className="row"
                  style={{
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                    paddingTop: 6,
                    marginTop: 2,
                    borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <span style={LEGENDA_GRUP}>
                    <span className="k">
                      Kesenjangan · {slotLabel(activeSlot)} ·{" "}
                      {categoryLabel(activeCategory)}
                    </span>
                    <span className="row" style={{ gap: 8 }}>
                      <span className="row" style={{ gap: 3 }}>
                        {legend.map((stop, i) => {
                          const d =
                            LEGEND_DOT.min +
                            ((LEGEND_DOT.max - LEGEND_DOT.min) * i) /
                              (legend.length - 1);
                          return (
                            <span
                              key={stop.color}
                              title={`kesenjangan ≥ ${rupiah(Math.round(stop.at))}`}
                              style={{
                                width: d,
                                height: d,
                                borderRadius: 999,
                                background: stop.color,
                                boxShadow: "0 0 0 1px var(--rule)",
                                flex: "none",
                              }}
                            />
                          );
                        })}
                      </span>
                      <span
                        className="fig"
                        style={{
                          ...LEGENDA_TEKS,
                          fontSize: 9.5,
                          color: "var(--ink-faint)",
                          display: "inline-flex",
                          gap: 3,
                        }}
                      >
                        <span>{rupiah(gapDomain.min)}</span>
                        <span>→</span>
                        <span>{rupiah(gapDomain.max)}</span>
                      </span>
                    </span>
                  </span>

                  {activeLayers.includes("kepercayaan") && (
                    <>
                      <span style={LEGENDA_SEKAT} />
                      <span style={LEGENDA_GRUP}>
                        <span className="k">Mutu data</span>
                        <span className="row" style={{ gap: 12 }}>
                          <span
                            className="row"
                            style={{ ...LEGENDA_TEKS, gap: 6 }}
                          >
                            <span
                              style={{
                                width: 16,
                                height: 10,
                                background: CONFIDENCE_GRID_RAMP.thin,
                                border: "1px solid #334155",
                                flex: "none",
                              }}
                            />
                            Rendah
                          </span>
                          <span
                            className="row"
                            style={{ ...LEGENDA_TEKS, gap: 5 }}
                          >
                            <span
                              style={{
                                width: 16,
                                height: 10,
                                background: CONFIDENCE_GRID_RAMP.medium,
                                border: "1px solid #334155",
                                flex: "none",
                              }}
                            />
                            Sedang
                          </span>
                          <span
                            className="row"
                            style={{ ...LEGENDA_TEKS, gap: 5 }}
                          >
                            <span
                              style={{
                                width: 16,
                                height: 10,
                                background: CONFIDENCE_GRID_RAMP.strong,
                                border: "1px solid #334155",
                                flex: "none",
                              }}
                            />
                            Memadai
                          </span>
                          <span
                            className="row"
                            style={{ ...LEGENDA_TEKS, gap: 5 }}
                          >
                            <span
                              style={{
                                width: 16,
                                height: 10,
                                background: CONFIDENCE_GRID_RAMP.empty,
                                border: "1px solid #334155",
                                flex: "none",
                              }}
                            />
                            Belum ada data
                          </span>
                        </span>
                      </span>
                    </>
                  )}

                  <span style={LEGENDA_SEKAT} />

                  <span style={LEGENDA_GRUP}>
                    <span className="k">Kawasan</span>
                    <span className="row" style={{ ...LEGENDA_TEKS, gap: 6 }}>
                      <span
                        style={{
                          width: 18,
                          height: 11,
                          borderRadius: 2,
                          background: "rgba(37,99,235,.16)",
                          border: "1px dashed #2563EB",
                          flex: "none",
                        }}
                      />
                      Jangkauan jalan kaki {activeCatchment} menit
                    </span>
                  </span>

                  <span style={LEGENDA_SEKAT} />

                  <span style={LEGENDA_GRUP}>
                    <span className="k">Skala</span>
                    <span className="row" style={{ gap: 6 }}>
                      <span
                        style={{
                          position: "relative",
                          height: 7,
                          width: SKALA_MAKS_PX,
                          flex: "none",
                        }}
                      >
                        {scaleBar && (
                          <>
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 3,
                                width: scaleBar.widthPx,
                                height: 1.5,
                                background: "var(--ink)",
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: 1.5,
                                height: 7,
                                background: "var(--ink)",
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                left: scaleBar.widthPx - 1.5,
                                top: 0,
                                width: 1.5,
                                height: 7,
                                background: "var(--ink)",
                              }}
                            />
                          </>
                        )}
                      </span>
                      <span
                        className="fig"
                        style={{
                          ...LEGENDA_TEKS,
                          fontSize: 9.5,
                          color: "var(--ink-muted)",
                        }}
                      >
                        {scaleBar ? jarak(scaleBar.meters) : "—"}
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>

        <div
          className="glass peta-panel"
          style={{
            position: "absolute",
            right: 24,
            top: 112,
            bottom: 44,
            width: 414,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ flex: "none", padding: "14px 14px 12px" }}>
            <div
              className="row pill"
              style={{
                position: "relative",
                background: "var(--paper-2)",
                padding: 4,
              }}
            >
              <div
                className="pill"
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  width: 122,
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-soft)",
                  transition: "left .18s cubic-bezier(.4,0,.2,1)",
                  left: tabX,
                }}
              />
              {(
                [
                  ["brief", "Ringkasan"],
                  ["retail", "Retail"],
                  ["copilot", "Tanya Data"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  aria-pressed={tab === key}
                  style={{
                    all: "unset",
                    position: "relative",
                    flex: 1,
                    textAlign: "center",
                    padding: "9px 0",
                    font: "600 12.5px/1 var(--font-inter)",
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {tab === "brief" && (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ flex: "none", padding: "4px 22px 18px" }}>
                <div
                  className="row"
                  style={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div className="k" style={{ marginBottom: 10 }}>
                      Brief simpul · {slotLabel(activeSlot)}
                    </div>
                    <div
                      style={{
                        font: "600 34px/1.05 var(--font-inter)",
                        letterSpacing: "-.01em",
                      }}
                    >
                      {selectedPoint
                        ? (stationNames.get(selectedPoint.station_id) ??
                          "Simpul")
                        : "Pilih titik"}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--ink-muted)",
                        marginTop: 12,
                      }}
                    >
                      {selectedPoint
                        ? `${pointLabels.get(selectedPoint.point_id) ?? "titik"} · ${
                            station ? `kawasan ${station.typology}` : "kawasan"
                          } · ${station?.point_count ?? stationMetrics.length} titik`
                        : "klik salah satu titik di peta untuk membuka ringkasannya"}
                    </div>
                  </div>
                  {selectedPoint && (
                    <button
                      type="button"
                      className="ic btn-reset"
                      onClick={() => setPilihanTitik(null)}
                      title="lepas pilihan"
                      aria-label="Lepas pilihan titik"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div
                className="sc"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: "0 22px 8px",
                }}
              >
                {!selectedMetric && (
                  <div
                    style={{
                      borderRadius: "var(--r-md)",
                      padding: 24,
                      background: "var(--data-wash)",
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "var(--ink-muted)",
                    }}
                  >
                    Belum ada titik yang dipilih. Klik salah satu lingkaran di
                    peta — ukurannya mengikuti besar kesenjangan pada slot dan
                    kategori yang sedang aktif.
                  </div>
                )}

                {selectedMetric && (
                  <>
                    <div
                      style={{
                        borderRadius: "var(--r-md)",
                        padding: 24,
                        background: "var(--data-wash)",
                      }}
                    >
                      <div className="k" style={{ marginBottom: 12 }}>
                        Kesenjangan belanja
                        {activeCategory !== ALL_CATEGORIES &&
                          ` · ${categoryLabel(activeCategory)}`}
                      </div>
                      {selectedMetric.gap.p50 === null ? (
                        <>
                          <div
                            className="fig"
                            style={{
                              fontWeight: 700,
                              fontSize: 22,
                              lineHeight: 1.15,
                              color: "var(--ink-muted)",
                            }}
                          >
                            Tidak diestimasi
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "var(--ink-muted)",
                              marginTop: 9,
                            }}
                          >
                            sampelnya belum memenuhi ambang 3 gerai × 2 blok —
                            titik ini tidak dibaca aman maupun bermasalah
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="fig"
                            style={{
                              fontWeight: 700,
                              fontSize: 25,
                              lineHeight: 1.15,
                              letterSpacing: "-.01em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {rupiah(selectedMetric.gap.p10)} –{" "}
                            {ribuan(selectedMetric.gap.p90 ?? 0)}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "var(--ink-muted)",
                              marginTop: 9,
                            }}
                          >
                            per {slotLabel(activeSlot)} hari kerja · rentang
                            P10–P90 · 10.000 iterasi
                          </div>
                          {/* Bar ini ADALAH rentang P10–P90 titik tersebut:
                             ujung kiri P10, ujung kanan P90, penanda putih di
                             median. Sengaja tidak dipetakan ke skala warna —
                             P90 selalu melampaui batas atas skala (yang disusun
                             dari median antar titik), jadi pitanya akan selalu
                             mentok di ujung kanan dan tidak memberi tahu apa
                             pun. */}
                          <div
                            style={{
                              position: "relative",
                              height: 12,
                              margin: "18px 0 8px",
                            }}
                          >
                            <div
                              className="pill"
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "var(--rule-soft)",
                              }}
                            />
                            <div
                              className="pill"
                              style={{
                                position: "absolute",
                                left: 0,
                                width: `${posisiDalamRentang(selectedMetric.gap, selectedMetric.gap.p50) * 100}%`,
                                top: 0,
                                bottom: 0,
                                background: "var(--data-mid)",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                left: `${posisiDalamRentang(selectedMetric.gap, selectedMetric.gap.p50) * 100}%`,
                                top: -3,
                                width: 18,
                                height: 18,
                                borderRadius: 12,
                                background: "var(--surface)",
                                boxShadow: "var(--shadow-soft)",
                                marginLeft: -9,
                              }}
                            />
                          </div>
                          <div
                            className="fig row"
                            style={{
                              justifyContent: "space-between",
                              fontSize: 10,
                              color: "var(--ink-faint)",
                            }}
                          >
                            <span>
                              P10 {rupiahRingkas(selectedMetric.gap.p10)}
                            </span>
                            <span>
                              median {rupiahRingkas(selectedMetric.gap.p50)}
                            </span>
                            <span>
                              P90 {rupiahRingkas(selectedMetric.gap.p90)}
                            </span>
                          </div>
                        </>
                      )}
                      <div
                        style={{
                          fontSize: 11.5,
                          lineHeight: 1.55,
                          color: "var(--ink-muted)",
                          marginTop: 14,
                        }}
                      >
                        Batas atas peluang pendapatan non-tiket,{" "}
                        <b style={{ color: "var(--ink)" }}>bukan</b> pendapatan
                        yang pasti diperoleh.
                      </div>
                    </div>

                    <dl
                      className="point-facts"
                      aria-label="Ringkasan mutu titik"
                    >
                      <div>
                        <dt>Peringkat di stasiun</dt>
                        <dd>
                          {selectedRank
                            ? `#${selectedRank.rank} dari ${selectedRank.total}`
                            : TIDAK_DIESTIMASI}
                        </dd>
                      </div>
                      <div>
                        <dt>Kepercayaan data</dt>
                        <dd>
                          {selectedMetric.sampelTipis
                            ? "Tidak diestimasi"
                            : `${confidenceLabel(selectedMetric.confidence)} · ${desimal(selectedMetric.confidence)}`}
                          <span
                            aria-hidden="true"
                            style={{
                              display: "block",
                              height: 4,
                              marginTop: 6,
                              overflow: "hidden",
                              borderRadius: 99,
                              background: "var(--rule-soft)",
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                width: `${selectedMetric.confidence * 100}%`,
                                height: "100%",
                                borderRadius: 99,
                                background: selectedMetric.sampelTipis
                                  ? "var(--rule-strong)"
                                  : "var(--data)",
                              }}
                            />
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt>Jumlah sampel</dt>
                        <dd>
                          {selectedConfidence
                            ? `${selectedConfidence.sample_meta.store_count} gerai · ${selectedConfidence.sample_meta.valid_store_blocks} blok valid`
                            : selectedPoint
                              ? `${selectedPoint.sample_meta.gerai_count} gerai × ${selectedPoint.sample_meta.blok_count} blok`
                              : "—"}
                        </dd>
                      </div>
                    </dl>

                    <div style={{ padding: "28px 0 20px" }}>
                      <div
                        className="row"
                        style={{
                          justifyContent: "space-between",
                          marginBottom: 16,
                        }}
                      >
                        <span className="k">Uraian F × E × C × V</span>
                        <Link
                          href="/metodologi"
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "var(--data)",
                          }}
                        >
                          Metodologi →
                        </Link>
                      </div>
                      <div
                        style={{
                          border: "1px solid var(--rule)",
                          borderRadius: "var(--r-md)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          className="row"
                          style={{
                            justifyContent: "space-between",
                            padding: "11px 14px",
                            borderBottom: "1px solid var(--rule)",
                          }}
                        >
                          <span
                            style={{ fontSize: 12.5, color: "var(--ink-2)" }}
                          >
                            F — arus pintu
                          </span>
                          <span
                            className="fig"
                            style={{ fontSize: 13, fontWeight: 600 }}
                          >
                            {selectedMetric.variables
                              ? ribuan(selectedMetric.variables.F)
                              : "—"}{" "}
                            <span
                              style={{
                                color: "var(--ink-faint)",
                                fontWeight: 400,
                              }}
                            >
                              org/jam
                            </span>
                          </span>
                        </div>
                        <div
                          className="row"
                          style={{
                            justifyContent: "space-between",
                            padding: "11px 14px",
                            borderBottom: "1px solid var(--rule)",
                          }}
                        >
                          <span
                            style={{ fontSize: 12.5, color: "var(--ink-2)" }}
                          >
                            E — entry ratio
                          </span>
                          <span
                            className="fig"
                            style={{ fontSize: 13, fontWeight: 600 }}
                          >
                            {persen(selectedMetric.variables?.E)}
                          </span>
                        </div>
                        <div
                          className="row"
                          style={{
                            justifyContent: "space-between",
                            padding: "11px 14px",
                            borderBottom: "1px solid var(--rule)",
                          }}
                        >
                          <span
                            style={{ fontSize: 12.5, color: "var(--ink-2)" }}
                          >
                            C — konversi
                          </span>
                          <span
                            className="fig"
                            style={{ fontSize: 13, fontWeight: 600 }}
                          >
                            {persen(selectedMetric.variables?.C, 0)}
                          </span>
                        </div>
                        <div
                          className="row"
                          style={{
                            justifyContent: "space-between",
                            padding: "11px 14px",
                            background: "var(--data-wash)",
                          }}
                        >
                          <span
                            style={{ fontSize: 12.5, color: "var(--ink-2)" }}
                          >
                            V — nilai transaksi{" "}
                            <span
                              style={{
                                fontSize: 9.5,
                                color: "var(--ink-faint)",
                              }}
                            >
                              {activeCategory === ALL_CATEGORIES
                                ? "AI"
                                : `AI · ${categoryLabel(activeCategory)}`}
                            </span>
                          </span>
                          <span
                            className="fig"
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--data)",
                            }}
                          >
                            {rupiah(nilaiV)}
                          </span>
                        </div>
                      </div>
                      <div
                        className="row"
                        style={{
                          justifyContent: "space-between",
                          marginTop: 14,
                        }}
                      >
                        <span
                          className="fig"
                          style={{ fontSize: 11.5, color: "var(--ink-muted)" }}
                        >
                          Potensi {rupiahRingkas(selectedMetric.potensi.p50)} −
                          tertangkap{" "}
                          {rupiahRingkas(selectedMetric.tertangkap.p50)}
                        </span>
                        <button
                          onClick={() => setShowTransparansi(true)}
                          style={{
                            all: "unset",
                            cursor: "pointer",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "var(--data)",
                          }}
                        >
                          Lihat bukti →
                        </button>
                      </div>
                    </div>

                    <div style={{ height: 1, background: "var(--rule)" }} />

                    <div style={{ padding: "26px 0" }}>
                      <div className="k" style={{ marginBottom: 16 }}>
                        Kesenjangan per titik
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 11,
                        }}
                      >
                        {stationMetrics.map((m) => {
                          const aktif = m.pointId === selectedPointId;
                          const nilai = m.gap.p50;
                          return (
                            <button
                              type="button"
                              key={m.pointId}
                              className="row btn-reset"
                              aria-pressed={aktif}
                              onClick={() => setPilihanTitik(m.pointId)}
                              style={{
                                gap: 11,
                                width: "100%",
                                cursor: "pointer",
                              }}
                            >
                              <span
                                style={{
                                  width: 100,
                                  fontSize: 12,
                                  fontWeight: aktif ? 600 : 400,
                                  color:
                                    nilai === null
                                      ? "var(--ink-faint)"
                                      : aktif
                                        ? "var(--ink)"
                                        : "var(--ink-2)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {pointLabels.get(m.pointId) ?? `#${m.pointId}`}
                              </span>
                              {nilai === null ? (
                                <span
                                  className="pill"
                                  style={{
                                    flex: 1,
                                    height: 14,
                                    background: "var(--paper-2)",
                                    border: "1px dashed var(--rule-strong)",
                                  }}
                                />
                              ) : (
                                <span
                                  className="pill"
                                  style={{
                                    flex: 1,
                                    height: 14,
                                    background: "var(--rule-soft)",
                                  }}
                                >
                                  <span
                                    className="pill"
                                    style={{
                                      display: "block",
                                      width: `${Math.max(3, (nilai / stationMax) * 100)}%`,
                                      height: 14,
                                      background: aktif
                                        ? "var(--data)"
                                        : "var(--ink-2)",
                                    }}
                                  />
                                </span>
                              )}
                              <span
                                className="fig"
                                style={{
                                  width: 100,
                                  textAlign: "right",
                                  fontSize: nilai === null ? 10.5 : 11,
                                  color:
                                    nilai === null
                                      ? "var(--ink-faint)"
                                      : undefined,
                                }}
                              >
                                {nilai === null
                                  ? "sampel tipis"
                                  : rupiah(nilai)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ height: 1, background: "var(--rule)" }} />

                    <div style={{ padding: "26px 0 4px" }}>
                      <div
                        className="row"
                        style={{
                          justifyContent: "space-between",
                          marginBottom: 15,
                        }}
                      >
                        <span className="k">Status kategori</span>
                        <span
                          style={{ fontSize: 10.5, color: "var(--ink-faint)" }}
                        >
                          data mock · permintaan vs gerai
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {categoryStatuses.length === 0 && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--ink-muted)",
                              padding: "8px 2px",
                            }}
                          >
                            Status kategori belum tersedia untuk simpul ini.
                          </div>
                        )}
                        {categoryStatuses.map((c, i) => (
                          <button
                            type="button"
                            key={c.category}
                            className="row btn-reset"
                            onClick={() => setActiveCategory(c.category)}
                            style={{
                              width: "100%",
                              justifyContent: "space-between",
                              padding: "10px 2px",
                              borderBottom:
                                i < categoryStatuses.length - 1
                                  ? "1px solid var(--rule)"
                                  : undefined,
                              cursor: "pointer",
                            }}
                          >
                            <span
                              className="row"
                              style={{
                                gap: 7,
                                fontSize: 13,
                                fontWeight: c.status === "kosong" ? 600 : 400,
                              }}
                            >
                              {categoryLabel(c.category)}
                              <span
                                className={`category-status category-status-${c.status}`}
                              >
                                {c.status}
                              </span>
                            </span>
                            <span
                              className="fig"
                              style={{ fontSize: 11.5, color: "var(--ink-2)" }}
                            >
                              {persen(c.demand_share, 0)} · {c.gerai_count}{" "}
                              gerai
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div
                style={{
                  flex: "none",
                  padding: "16px 22px 20px",
                  display: "flex",
                  gap: 8,
                  boxShadow: "0 -1px 0 var(--rule)",
                }}
              >
                <button
                  type="button"
                  className="b bs"
                  style={{ flex: 1 }}
                  onClick={() => setShowTabel(true)}
                  disabled={!analytics || !entrances}
                >
                  Tabel atribut
                </button>
                {/* "Unduh brief" mengunduh CSV potongan yang sedang tampil —
                   tanpa membuka tabelnya dulu, karena itu memang jalan pintas
                   yang dijanjikan tombolnya. Barisnya disusun modul yang sama
                   dengan tabel, jadi isinya tidak bisa berbeda. */}
                <button
                  type="button"
                  className="b bp"
                  style={{ flex: 1 }}
                  onClick={() => {
                    if (!analytics || !entrances) return;
                    const rows = barisAtribut(
                      analytics,
                      entrances,
                      activeSlot,
                      activeCategory,
                    );
                    unduhTeks(
                      namaBerkasAtribut(analytics, activeSlot, activeCategory),
                      csvAtribut(rows),
                    );
                  }}
                  disabled={!analytics || !entrances}
                >
                  Unduh brief
                </button>
              </div>
            </div>
          )}

          {tab === "retail" && (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ flex: "none", padding: "4px 22px 14px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <div
                    className="k"
                    style={{ fontSize: 11, letterSpacing: "0.08em" }}
                  >
                    KATALOG ASET &amp; POTENSI
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--data)",
                      background: "var(--data-wash)",
                      padding: "2px 8px",
                      borderRadius: "var(--r-pill)",
                    }}
                  >
                    Stasiun {currentStation?.name ?? "Manggarai"}
                  </span>
                </div>
                {/* Legenda Pill yang Elegan & Informatif */}
                <div
                  style={{
                    display: "flex",
                    gap: 7,
                    flexWrap: "wrap",
                    marginTop: 10,
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "4px 10px",
                      borderRadius: "var(--r-pill)",
                      background: "var(--surface)",
                      border: "1px solid var(--rule)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                      fontSize: 11.5,
                      color: "var(--ink)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "#2563eb",
                        boxShadow: "0 0 0 1.5px #60a5fa",
                        flex: "none",
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>Sewa Tempat</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: 999,
                        background: "var(--paper-2)",
                        color: "var(--ink-muted)",
                        marginLeft: 1,
                      }}
                    >
                      {rentalAssets.length}
                    </span>
                  </div>
                  {RETAIL_KINDS.map((kind) => {
                    const count = retailLocations.filter(
                      (l) => l.kind === kind,
                    ).length;
                    return (
                      <div
                        key={kind}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "4px 10px",
                          borderRadius: "var(--r-pill)",
                          background: "var(--surface)",
                          border: "1px solid var(--rule)",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                          fontSize: 11.5,
                          color: "var(--ink)",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: RETAIL_LEGEND[kind].fill,
                            boxShadow: `0 0 0 1.5px ${RETAIL_LEGEND[kind].stroke}`,
                            flex: "none",
                          }}
                        />
                        <span style={{ fontWeight: 500 }}>
                          {RETAIL_LEGEND[kind].label}
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: "1px 6px",
                            borderRadius: 999,
                            background: "var(--paper-2)",
                            color: "var(--ink-muted)",
                            marginLeft: 1,
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div
                className="sc"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: "0 22px 16px",
                }}
              >
                <RetailPanel
                  locations={retailLocations}
                  rentalAssets={rentalAssets}
                  selected={selectedRetail}
                  selectedRental={selectedRental}
                  activeFilter={activeRetailFilter}
                  onFilterChange={handleRetailFilterChange}
                  onSelect={selectRetail}
                  onSelectRental={selectRental}
                  onClose={handleCloseRetail}
                  onCloseRental={handleCloseRental}
                />
              </div>
            </div>
          )}

          {tab === "copilot" && (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="sc"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: "4px 22px 12px",
                }}
              >
                <div className="row" style={{ gap: 8, marginBottom: 14 }}>
                  <span className="dot" style={{ background: "var(--data)" }} />
                  <span className="k">Tanya data peta</span>
                </div>

                {/* User's question — right-aligned, solid ink bubble. */}
                {cqAsked && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ maxWidth: "82%" }}>
                      <div
                        className="k"
                        style={{
                          textAlign: "right",
                          color: "var(--ink-faint)",
                          marginBottom: 4,
                        }}
                      >
                        Kamu
                      </div>
                      <div
                        style={{
                          borderRadius: "var(--r-md)",
                          borderBottomRightRadius: 4,
                          background: "var(--ink)",
                          padding: "11px 15px",
                          fontSize: 13,
                          color: "var(--surface)",
                        }}
                      >
                        {cqAsked}
                      </div>
                    </div>
                  </div>
                )}

                {/* AI's answer — left-aligned, neutral bubble with a small
                   sparkle avatar, so the two speakers are never ambiguous.
                   Isinya masih contoh: copilot baru tersambung di Fase 3.6. */}
                {showCopilotResult && (
                  <div
                    className="row"
                    style={{ gap: 8, alignItems: "flex-start", marginTop: 12 }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: "var(--data-wash)",
                        flex: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 17,
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--data)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
                      </svg>
                    </span>
                    <div style={{ maxWidth: "82%" }}>
                      <div
                        className="k"
                        style={{ color: "var(--ink-faint)", marginBottom: 4 }}
                      >
                        Asisten data
                      </div>
                      <div
                        style={{
                          borderRadius: "var(--r-md)",
                          borderTopLeftRadius: 4,
                          background: "var(--paper-2)",
                          padding: "16px 18px",
                        }}
                      >
                        {cqLoading ? (
                          <div
                            style={{
                              fontSize: 13.5,
                              lineHeight: 1.55,
                              color: "var(--ink-muted)",
                            }}
                          >
                            Menyusun jawaban…
                          </div>
                        ) : cqError ? (
                          <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                            Gagal menghubungi layanan data. Coba lagi sebentar.
                          </div>
                        ) : cqAnswer ? (
                          <>
                            <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                              {cqAnswer.answer}
                            </div>
                            {((cqAnswer.suggested_layers?.length ?? 0) > 0 ||
                              cqAnswer.spatial_filter?.category ||
                              cqAnswer.spatial_filter?.time_slot) && (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 6,
                                  marginTop: 14,
                                }}
                              >
                                {(cqAnswer.suggested_layers ?? []).map(
                                  (layer) => (
                                    <span
                                      key={layer}
                                      className="chip"
                                      style={{
                                        background: "var(--data-wash)",
                                        borderColor: "transparent",
                                        color: "var(--data)",
                                      }}
                                    >
                                      Lapisan →{" "}
                                      {LAYER_ROWS.find((r) => r.key === layer)
                                        ?.label ?? layer}
                                    </span>
                                  ),
                                )}
                                {cqAnswer.spatial_filter?.category && (
                                  <span
                                    className="chip"
                                    style={{
                                      background: "var(--data-wash)",
                                      borderColor: "transparent",
                                      color: "var(--data)",
                                    }}
                                  >
                                    Kategori → {categoryLabel(activeCategory)}
                                  </span>
                                )}
                                {cqAnswer.spatial_filter?.time_slot && (
                                  <span
                                    className="chip"
                                    style={{
                                      background: "var(--data-wash)",
                                      borderColor: "transparent",
                                      color: "var(--data)",
                                    }}
                                  >
                                    Slot → {slotLabel(activeSlot)}
                                  </span>
                                )}
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: 11.5,
                                lineHeight: 1.5,
                                color: "var(--ink-muted)",
                                marginTop: 14,
                              }}
                            >
                              Jawaban menyesuaikan lapisan &amp; filter peta.
                              Angka hanya dari slot yang dicacah.
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
                <div className="k" style={{ margin: "20px 0 10px" }}>
                  Pertanyaan lain
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 7 }}
                >
                  {QUESTIONS.map((q) => (
                    <button
                      type="button"
                      key={q}
                      onClick={() => submitCopilot(q)}
                      disabled={cqLoading}
                      className="lyr btn-reset"
                      style={{
                        border: "1px solid var(--rule)",
                        borderRadius: "var(--r-md)",
                        width: "100%",
                        padding: "10px 15px",
                        fontSize: 12.5,
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  flex: "none",
                  padding: "12px 16px 18px",
                  boxShadow: "0 -1px 0 var(--rule)",
                }}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitCopilot(cqInput);
                  }}
                  className="pill row"
                  style={{
                    gap: 10,
                    border: "1px solid var(--rule)",
                    padding: "5px 5px 5px 16px",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--data)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
                  </svg>
                  <input
                    value={cqInput}
                    onChange={(e) => setCqInput(e.target.value)}
                    placeholder="tanya tentang data peta…"
                    aria-label="Tanya data peta"
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: "var(--ink)",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      font: "inherit",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={cqLoading || !cqInput.trim()}
                    className="b bp"
                    style={{ padding: "9px 16px", fontSize: 12 }}
                  >
                    {cqLoading ? "…" : "Tanya"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {showTransparansi && selectedPoint && selectedMetric && (
          <div
            onClick={() => setShowTransparansi(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(22,19,15,.55)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              zIndex: 30,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="transparansi-judul"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 700,
                background: "var(--surface)",
                borderRadius: "var(--r-md)",
                boxShadow: "var(--shadow-lift)",
                overflow: "hidden",
              }}
            >
              <div
                className="row"
                style={{
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "24px 26px 20px",
                }}
              >
                <div>
                  <div className="k" style={{ marginBottom: 8 }}>
                    Panel transparansi ·{" "}
                    {pointLabels.get(selectedPoint.point_id) ?? "titik"}
                  </div>
                  <div
                    id="transparansi-judul"
                    style={{
                      font: "800 21px/1.15 var(--font-inter)",
                      letterSpacing: "-.015em",
                    }}
                  >
                    Dari mana angka V = {rupiah(nilaiV)} berasal
                  </div>
                </div>
                <button
                  type="button"
                  // Fokus dipindah ke dalam modal begitu ia terbuka. Tanpa ini
                  // fokus tertinggal di tombol "Lihat bukti" yang sekarang
                  // tertutup lapisan gelap, dan Tab berikutnya menyusuri panel
                  // di baliknya, bukan isi modalnya.
                  autoFocus
                  className="ic btn-reset"
                  onClick={() => setShowTransparansi(false)}
                  aria-label="Tutup panel transparansi"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div style={{ display: "flex", gap: 22, padding: "0 26px 26px" }}>
                <div style={{ width: 230, flex: "none" }}>
                  <div className="k" style={{ marginBottom: 9 }}>
                    Foto sumber · data mock
                  </div>
                  <div
                    style={{
                      height: 206,
                      borderRadius: "var(--r-md)",
                      background: "var(--paper-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      lineHeight: 1.5,
                      color: "var(--ink-faint)",
                      textAlign: "center",
                      padding: "0 16px",
                    }}
                  >
                    {selectedEvidence?.photo_label ??
                      "Foto sumber belum tersedia"}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--r-md)",
                        background: "var(--paper-2)",
                        boxShadow: "0 0 0 2px var(--data)",
                      }}
                    />
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--r-md)",
                        background: "var(--paper-2)",
                      }}
                    />
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--r-md)",
                        background: "var(--paper-2)",
                      }}
                    />
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--r-md)",
                        border: "1.5px dashed var(--rule-strong)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "var(--ink-faint)",
                      }}
                    >
                      +{Math.max(0, selectedPoint.evidence.struk_terbaca - 3)}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="k" style={{ marginBottom: 9 }}>
                    Hasil baca AI
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <div
                      className="row"
                      style={{
                        justifyContent: "space-between",
                        padding: "11px 14px",
                        borderRadius: "var(--r-md) var(--r-md) 0 0",
                        background: "var(--data-wash)",
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: "var(--ink-muted)" }}>
                        Kategori (dinormalisasi)
                      </span>
                      <span>
                        {activeCategory === ALL_CATEGORIES
                          ? "seluruh kategori"
                          : categoryLabel(activeCategory)}
                      </span>
                    </div>
                    <div
                      className="row"
                      style={{
                        justifyContent: "space-between",
                        padding: "11px 14px",
                        background: "var(--data-wash)",
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: "var(--ink-muted)" }}>
                        Slot yang dicacah
                      </span>
                      <span>
                        {SLOTS.find((s) => s.key === activeSlot)?.jam ??
                          slotLabel(activeSlot)}
                      </span>
                    </div>
                    <div
                      className="row"
                      style={{
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: "0 0 var(--r-md) var(--r-md)",
                        background: "var(--data-wash)",
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Jumlah dibayarkan</span>
                      <span
                        className="fig"
                        style={{ fontWeight: 700, color: "var(--data)" }}
                      >
                        {rupiah(nilaiV)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <div
                      style={{
                        flex: 1,
                        borderRadius: "var(--r-md)",
                        background: "var(--paper-2)",
                        padding: 14,
                      }}
                    >
                      <div
                        className="k"
                        style={{ fontSize: 9, marginBottom: 7 }}
                      >
                        Keyakinan
                      </div>
                      <div
                        className="fig"
                        style={{ font: "700 18px/1 var(--font-mono)" }}
                      >
                        {desimal(
                          selectedEvidence?.confidence ??
                            selectedMetric.confidence,
                        )}
                      </div>
                      <div
                        className="pill"
                        style={{
                          height: 5,
                          background: "var(--rule-soft)",
                          marginTop: 9,
                        }}
                      >
                        <div
                          className="pill"
                          style={{
                            width: `${(selectedEvidence?.confidence ?? selectedMetric.confidence) * 100}%`,
                            height: 5,
                            background: "var(--data)",
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        borderRadius: "var(--r-md)",
                        background: "var(--paper-2)",
                        padding: 14,
                      }}
                    >
                      <div
                        className="k"
                        style={{ fontSize: 9, marginBottom: 7 }}
                      >
                        Cakupan
                      </div>
                      <div
                        className="fig"
                        style={{ font: "700 18px/1 var(--font-mono)" }}
                      >
                        {selectedEvidence?.receipt_readable ??
                          selectedPoint.evidence.struk_terbaca}{" "}
                        /{" "}
                        {selectedEvidence?.receipt_total ??
                          selectedPoint.evidence.struk_total}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          lineHeight: 1.4,
                          color: "var(--ink-muted)",
                          marginTop: 6,
                        }}
                      >
                        struk terbaca ·{" "}
                        {selectedEvidence?.receipt_ambiguous ??
                          selectedPoint.evidence.struk_ambigu}{" "}
                        ambigu dikeluarkan
                      </div>
                    </div>
                  </div>
                  <div
                    className="row"
                    style={{
                      gap: 10,
                      alignItems: "flex-start",
                      marginTop: 12,
                      borderRadius: "var(--r-md)",
                      background: "var(--data-wash)",
                      padding: "13px 15px",
                      fontSize: 11.5,
                      lineHeight: 1.55,
                    }}
                  >
                    <span
                      className="dot"
                      style={{ background: "var(--data)", marginTop: 5 }}
                    />
                    {selectedMetric.sampelTipis ? (
                      <span>
                        Sampel kategori ini masih di bawah ambang{" "}
                        {selectedConfidence?.sample_meta.store_count ??
                          selectedPoint.sample_meta.gerai_count}{" "}
                        gerai ·{" "}
                        {selectedConfidence?.sample_meta.valid_store_blocks ??
                          selectedPoint.sample_meta.blok_count}{" "}
                        blok valid, jadi nilainya <b>{TIDAK_DIESTIMASI}</b> dan
                        titiknya ditandai pada lapisan kepercayaan data.
                      </span>
                    ) : (
                      <span>
                        Dihitung dari {selectedPoint.evidence.struk_terbaca}{" "}
                        struk pada{" "}
                        {selectedConfidence?.sample_meta.store_count ??
                          selectedPoint.sample_meta.gerai_count}{" "}
                        gerai ·{" "}
                        {selectedConfidence?.sample_meta.valid_store_blocks ??
                          selectedPoint.sample_meta.blok_count}{" "}
                        blok valid — memenuhi ambang minimum proposal §5.2.
                      </span>
                    )}
                  </div>
                  {selectedSlotRow && (
                    <div
                      className="fig"
                      style={{
                        fontSize: 10.5,
                        color: "var(--ink-faint)",
                        marginTop: 10,
                      }}
                    >
                      slot {slotLabel(activeSlot)} · gap{" "}
                      {rupiahRingkas(selectedSlotRow.gap.p50)} · kepercayaan{" "}
                      {desimal(selectedMetric.confidence)}
                    </div>
                  )}
                  {selectedEvidence && (
                    <dl className="evidence-meta">
                      <div>
                        <dt>Jenis bukti</dt>
                        <dd>{selectedEvidence.types.join(" · ")}</dd>
                      </div>
                      <div>
                        <dt>Dataset</dt>
                        <dd>{selectedEvidence.dataset}</dd>
                      </div>
                      <div>
                        <dt>Waktu survei</dt>
                        <dd>{evidenceDate} WIB</dd>
                      </div>
                      <div>
                        <dt>Sumber</dt>
                        <dd>{selectedEvidence.sources.join(" · ")}</dd>
                      </div>
                      <div className="evidence-mock">
                        <dt>Status</dt>
                        <dd>Data mock untuk demonstrasi antarmuka</dd>
                      </div>
                    </dl>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pil nav mengambang di atas peta full-bleed — bahasa yang sama dengan
         panel brief & legenda yang juga melayang. Di bawah modal transparansi
         (`zIndex: 30`) supaya modal tetap menutupinya.

         `pointerEvents: none` di pembungkus + `auto` di baris nav: bagian
         transparan pembungkus (gutter samping, celah di atas pil) meneruskan
         klik ke peta, hanya baris nav sendiri yang menangkapnya. */}
      <div
        className="peta-nav-float"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <NavBar
          active="peta"
          cta={
            <div className="row" style={{ gap: 10 }}>
              <button
                type="button"
                className="b bs"
                onClick={() => setShowComparison(true)}
              >
                Bandingkan
              </button>
              {/* Label sengaja dibuat panjang dan berbeda: tombol di sebelahnya
                 juga "membandingkan", tapi dari angka yang lain sama sekali. */}
              <button
                type="button"
                className="b bs"
                onClick={() => setShowBandingSimpul(true)}
              >
                Ringkasan &amp; Bandingkan Simpul
              </button>
              <button
                type="button"
                className="b bp"
                onClick={() => setShowBrief(true)}
              >
                Brief PDF
              </button>
            </div>
          }
        />
      </div>

      {showBandingSimpul && (
        <BandingSimpulOverlay onClose={() => setShowBandingSimpul(false)} />
      )}

      {showTabel && analytics && entrances && (
        <TabelAtribut
          payload={analytics}
          entrances={entrances}
          slot={activeSlot}
          category={activeCategory}
          onClose={() => setShowTabel(false)}
        />
      )}

      {showBrief && <BriefSimpul onClose={() => setShowBrief(false)} />}

      {showComparison && analytics && stations && demo && (
        <ComparisonDialog
          stations={stations}
          analytics={analytics}
          statuses={demo.category_statuses}
          activeSlot={activeSlot}
          activeCategory={activeCategory}
          onClose={() => setShowComparison(false)}
          onOpenStation={(target) => {
            if (target.longitude === undefined || target.latitude === undefined)
              return;
            setStationTarget({
              longitude: target.longitude,
              latitude: target.latitude,
            });
            setPilihanTitik(
              analytics.points.find((point) => point.station_id === target.id)
                ?.point_id ?? null,
            );
            setSelectedRetail(null);
            setShowComparison(false);
          }}
        />
      )}
    </div>
  );
}
