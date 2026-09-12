"use client";

import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, Point, Polygon } from "geojson";
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Domain } from "@/lib/analytics/select";
import type { RetailLocation } from "@/lib/data/retail";
import { rentalCircleLayer, rentalLabelLayer } from "@/lib/map/rental-style";
import { retailCircleLayer, retailLabelLayer } from "@/lib/map/retail-style";
import { stationCircleLayer, stationLabelLayer } from "@/lib/map/station-style";
import type {
  ConfidenceGridProps,
  IsochroneProps,
  ObservationPointProps,
  PointFeatureState,
  RentalAsset,
  Station,
} from "@/lib/data/types";
import {
  resolveBasemapUrl,
  CAMERA,
  FIT_PADDING,
  INITIAL_VIEW,
  LAYER,
  LAYER_ORDER,
  SOURCE,
  STUDY_BOUNDS,
} from "@/lib/map/config";
import {
  isochroneFillLayer,
  isochroneLineLayer,
  confidenceBoundaryLayer,
  confidenceFillLayer,
  pointArusLayer,
  pointCircleLayer,
  pointConfidenceLayer,
  pointLabelLayer,
  scaleDependentPaint,
} from "@/lib/map/style";

const EMPTY_RETAIL: FeatureCollection<Point, RetailLocation> = {
  type: "FeatureCollection",
  features: [],
};

const EMPTY_STATIONS: FeatureCollection<Point, Station> = {
  type: "FeatureCollection",
  features: [],
};

const EMPTY_RENTALS: FeatureCollection<Point, RentalAsset> = {
  type: "FeatureCollection",
  features: [],
};

type Props = {
  /** Geometri titik pengamatan. `null` selama data belum termuat. */
  points: FeatureCollection<Point, ObservationPointProps> | null;
  /** Geometri isochrone. `null` selama data belum termuat. */
  isochrones: FeatureCollection<Polygon, IsochroneProps> | null;
  /**
   * Titik beserta angka yang akan ditulis sebagai label, sebagai **properti**.
   *
   * Terpisah dari `featureStates` karena `text-field` adalah properti layout,
   * dan MapLibre menolak ekspresi `feature-state` di layout. Jadi angka yang
   * perlu dibaca sebagai tulisan harus ikut di dalam properti fitur.
   */
  labelData: FeatureCollection<Point> | null;
  /**
   * Angka yang ditempelkan ke tiap titik, mengikuti slot dan kategori yang
   * sedang dipilih. Kuncinya id fitur.
   */
  featureStates: Map<number, PointFeatureState>;
  /** Rentang nilai gap yang sedang aktif — menentukan warna dan ukuran. */
  gapDomain: Domain;
  /** Sebaran skor kepercayaan yang sedang aktif — menentukan kepekatan halo. */
  confidenceDomain: Domain;
  /** Grid polygon mutu data; titik pintu tetap berada di atasnya dan interaktif. */
  confidenceGrid?: FeatureCollection<Polygon, ConfidenceGridProps> | null;
  /** Kawasan tangkapan yang sedang dipilih: 3, 5, atau 10 menit. */
  catchmentMinutes: number;
  /** ID layer peta yang boleh terlihat. Selebihnya disembunyikan. */
  visibleLayers: readonly string[];
  selectedPointId: number | null;
  onSelectPoint: (pointId: number) => void;
  /** Pesan kegagalan dari lapisan data, ditampilkan di slot yang sama. */
  dataError?: string | null;
  /**
   * Berapa meter yang diwakili satu piksel layar, dilaporkan tiap kali kamera
   * bergerak. Dipakai legenda untuk menggambar batang skala yang sungguhan.
   */
  onScaleChange?: (metersPerPixel: number) => void;
  stationTarget?: { longitude: number; latitude: number; zoom?: number } | null;
  retailLocations?: FeatureCollection<Point, RetailLocation>;
  selectedRetailId?: string | null;
  onSelectRetail?: (location: RetailLocation) => void;
  stationLocations?: FeatureCollection<Point, Station>;
  selectedStationId?: number | null;
  onSelectStation?: (station: Station) => void;
  rentalLocations?: FeatureCollection<Point, RentalAsset>;
  selectedRentalId?: string | null;
  onSelectRental?: (asset: RentalAsset) => void;
  /**
   * Boleh digeser, di-zoom, dan diklik. Bawaannya ya.
   *
   * Dimatikan untuk peta hero di Beranda: di sana peta adalah gambar yang
   * hidup, bukan alat. Membiarkannya interaktif berarti gulungan halaman
   * tertelan peta begitu kursor melintasinya — pengunjung terjebak di tengah
   * halaman tanpa tahu kenapa.
   *
   * Saat mati, kendali navigasi tidak dipasang dan pendengar sorot/klik tidak
   * didaftarkan sama sekali — bukan sekadar disembunyikan.
   */
  interactive?: boolean;
  /**
   * Ruang yang dikosongkan saat menyesuaikan tampilan ke kawasan studi.
   *
   * Bawaannya `FIT_PADDING`, yang angkanya mengikuti panel-panel melayang di
   * halaman Peta. Peta hero tidak punya panel itu, jadi ia mengirim padding
   * sendiri — kalau tidak, petanya menyusut ke tengah menyisakan ruang untuk
   * sesuatu yang tidak ada di sana.
   */
  fitPadding?: { top: number; bottom: number; left: number; right: number };
  /**
   * Radius kliping DOM untuk pembungkus peta — chrome embed, bukan gaya peta
   * (`lib/map/style.ts` tetap satu-satunya sumber warna/ukuran layer). Dipakai
   * peta hero Beranda supaya sudut kanvas MapLibre benar-benar terpotong
   * membulat; `/peta` tidak mengopernya → tanpa radius, seperti sebelumnya.
   */
  borderRadius?: number | string;
  /**
   * Sudut tempat kredit peta ("© MAPID Maps …") duduk. Bawaannya `bottom-right`
   * (MapLibre bawaan). Peta hero Beranda memindahnya ke `top-left`: kartu
   * sorotan menggantung keluar dari sudut kiri-bawah, jadi kredit di bawah
   * mana pun akan tertutup — dan kredit yang tak terbaca melanggar lisensi
   * basemap. Nilai lain memakai `AttributionControl` yang dipasang sendiri.
   */
  attributionPosition?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";
};

/** Batas menunggu style basemap sebelum dianggap gagal. */
const STYLE_TIMEOUT_MS = 10_000;

/**
 * Menunjuk worker MapLibre ke salinan yang kita sajikan sendiri.
 *
 * MapLibre v6 memisahkan worker ke berkas tersendiri dan menghitung alamatnya
 * dari `import.meta.url`. Di bawah Turbopack nilai itu bukan URL http(s),
 * sehingga MapLibre memanggil `new Worker("")` — worker menunjuk ke halaman
 * itu sendiri, menjalankan HTML alih-alih kode MapLibre. Gejalanya: tidak ada
 * tile yang diminta, GeoJSON tidak pernah diproses, peta kosong, dan **tidak
 * ada pesan error apa pun**.
 *
 * Berkasnya disalin ke `public/maplibre/` oleh `scripts/copy-maplibre-worker.mjs`
 * yang berjalan otomatis pada `predev` dan `prebuild`.
 *
 * Dipanggil di tingkat modul agar berlaku sebelum peta mana pun dibuat.
 */
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

/**
 * Latar polos tanpa jaringan, dipakai kalau basemap gagal dimuat.
 *
 * Tujuannya supaya kegagalan basemap tidak ikut menjatuhkan lapisan data —
 * titik dan isochrone tetap tergambar walaupun tanpa peta dasar.
 */
const OFFLINE_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: "latar",
      // Nada kertas hangat (~`--paper-2`), bukan slate dingin — style MapLibre
      // berupa JSON, jadi ditulis literal, bukan lewat `var()`.
      type: "background" as const,
      paint: { "background-color": "#F3EFE7" },
    },
  ],
};

/**
 * Kegagalan pengambilan sumber daya peta beserta status HTTP-nya — atau `null`
 * kalau errornya bukan jenis itu.
 *
 * MapLibre membungkus kegagalan HTTP sebagai `AJAXError`, satu-satunya jenis
 * error yang membawa `status` dan `url`. Tanpa keduanya, kegagalan mengambil
 * tile tidak bisa dibedakan dari kesalahan gaya biasa.
 */
function sumberDayaGagal(
  error: unknown,
): { status: number; host: string } | null {
  const e = error as { status?: unknown; url?: unknown };
  if (typeof e?.status !== "number" || e.status < 400) return null;
  let host = "";
  try {
    host = new URL(String(e.url ?? ""), window.location.href).host;
  } catch {
    host = "";
  }
  return { status: e.status, host };
}

/**
 * Menunggu style siap menerima `addSource` / `addLayer`, dengan batas waktu.
 *
 * Dua hal yang sengaja dihindari di sini, keduanya pernah membuat peta diam
 * membisu tanpa pesan apa pun:
 *
 * 1. **Jangan menunggu event `load`.** `load` baru menyala setelah SELURUH
 *    tile viewport selesai. Kalau satu tile menggantung — hal biasa pada
 *    basemap pihak ketiga — event itu tidak pernah menyala, padahal style
 *    sudah lama siap. `style.load` adalah sinyal yang tepat.
 * 2. **Jangan mengandalkan `isStyleLoaded()`.** Nilainya tetap `false` selama
 *    masih ada sumber yang memuat, jadi tidak bisa dipakai sebagai penanda
 *    kesiapan.
 *
 * Pendengar dipasang segera setelah peta dibuat — sebelum ada kerja async —
 * supaya event tidak keburu lewat sebelum sempat didengarkan.
 */
function styleReadyPromise(map: MapLibreMap): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), STYLE_TIMEOUT_MS);
    map.once("style.load" as never, () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

/**
 * Kanvas peta MapLibre.
 *
 * Komponen ini **tidak memuat data dan tidak menyimpan state filter** — ia
 * hanya menggambar apa yang diberikan lewat props, dan melaporkan balik titik
 * mana yang diklik. Pemisahan itu yang diminta ROADMAP §1: mengganti tampilan
 * panel tidak boleh menyentuh logika, dan sebaliknya. Nilai warna serta ukuran
 * seluruhnya tinggal di `lib/map/style.ts`.
 *
 * Angka analitik ditempelkan lewat `setFeatureState`, bukan digabung ke
 * properti GeoJSON — supaya cara kerjanya sama persis dengan Fase 2 saat
 * geometri datang dari tile vektor dan angkanya dari Go API. Dengan begitu
 * ekspresi gaya tidak perlu diubah sama sekali nanti.
 */
export function MapCanvas({
  points,
  isochrones,
  labelData,
  featureStates,
  gapDomain,
  confidenceDomain,
  confidenceGrid = null,
  catchmentMinutes,
  visibleLayers,
  selectedPointId,
  onSelectPoint,
  dataError = null,
  onScaleChange,
  stationTarget,
  retailLocations = EMPTY_RETAIL,
  selectedRetailId = null,
  onSelectRetail,
  stationLocations = EMPTY_STATIONS,
  selectedStationId = null,
  onSelectStation,
  rentalLocations = EMPTY_RENTALS,
  selectedRentalId = null,
  onSelectRental,
  interactive = true,
  fitPadding = FIT_PADDING,
  borderRadius,
  attributionPosition = "bottom-right",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  /** Peta siap menerima source dan layer. */
  const [styleReady, setStyleReady] = useState(false);
  /** Source dan layer sudah terpasang — penjaga seluruh efek di bawah. */
  const [layersReady, setLayersReady] = useState(false);
  /** Pesan yang ditampilkan di atas peta: kegagalan keras maupun peringatan. */
  const [notice, setNotice] = useState<string | null>(null);
  const [analysisAvailable, setAnalysisAvailable] = useState(true);
  /** Titik yang sedang disorot kursor, supaya bisa dibersihkan saat berpindah. */
  const hoveredRef = useRef<number | null>(null);
  /** Apakah glyph label bisa diambil — ikut gagal kalau basemap gagal. */
  const glyphsAvailableRef = useRef(true);
  /**
   * Pesan kegagalan sudah pernah ditampilkan.
   *
   * Tile yang gagal datang berulang kali — satu per tile, per tingkat zoom.
   * Tanpa penjaga ini, pesannya ditulis ulang puluhan kali dan menimpa pesan
   * pertama yang justru paling menjelaskan.
   */
  const noticeShownRef = useRef(false);
  /**
   * Penangan klik selalu dibaca dari ref, bukan ditutup di dalam closure.
   * Pendengar peta dipasang sekali seumur hidup layer; kalau closure-nya ikut
   * dibekukan di sana, klik akan memanggil versi lama dari `onSelectPoint`.
   */
  const onSelectRef = useRef(onSelectPoint);
  useEffect(() => {
    onSelectRef.current = onSelectPoint;
  }, [onSelectPoint]);

  // --- membuat peta, sekali seumur komponen -------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: resolveBasemapUrl(),
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      // MapLibre hanya bisa menaruh kredit bawaan di kanan-bawah; sudut lain
      // berarti matikan yang bawaan lalu pasang `AttributionControl` sendiri
      // (di bawah, sesudah peta dibuat).
      attributionControl:
        attributionPosition === "bottom-right" ? { compact: true } : false,
      // Di atas 60 derajat pandangan mulai menatap cakrawala dan peta jadi
      // sulit dibaca — sekaligus membuat kendali kemiringan terasa liar.
      maxPitch: CAMERA.maxPitch,
      // Mematikan ini melepas SELURUH penangan bawaan sekaligus — geser, zoom,
      // putar, gulung. Itu yang dibutuhkan peta hero: ia gambar yang hidup,
      // bukan alat, dan peta yang menelan gulungan halaman di tengah landing
      // page adalah jebakan, bukan fitur.
      interactive,
    });
    mapRef.current = map;

    // Dipaparkan supaya pengujian dan penelusuran manual bisa memeriksa
    // keadaan peta. Tidak pernah dipakai oleh kode aplikasi.
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __map?: MapLibreMap }).__map = map;
    }

    // Dipasang SEBELUM kerja async apa pun, supaya event tidak keburu lewat.
    const ready = styleReadyPromise(map);

    // Compass ditampilkan dengan `visualizePitch` supaya arah DAN kemiringan
    // terlihat, bukan ditebak.
    //
    // `visualizePitch` juga mengubah perilaku kliknya: MapLibre memanggil
    // `resetNorthPitch()` alih-alih `resetNorth()`, sehingga sekali klik
    // meratakan bearing DAN pitch ke nol tanpa memindahkan pusat peta. Itulah
    // sebabnya tidak ada tombol "ratakan" buatan sendiri — compass sudah
    // melakukannya persis.
    if (interactive) {
      map.addControl(
        new NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-left",
      );
    }

    // Kredit peta yang dipindah dari sudut bawaannya (lihat `attributionControl`
    // di atas). Hero Beranda memakai `top-left` supaya kartu sorotan yang
    // menggantung di kiri-bawah tidak menutupi "© MAPID Maps".
    if (attributionPosition !== "bottom-right") {
      map.addControl(
        new AttributionControl({ compact: true }),
        attributionPosition,
      );
    }

    // MapLibre melaporkan kegagalan style/tile lewat event ini. Tanpa
    // pendengar, kegagalannya hanya muncul di console dan peta diam membisu.
    let lastMapError: string | null = null;
    /** Style sudah selesai dimuat — sesudah ini jalur timeout tidak berlaku. */
    let styleSudahTermuat = false;
    map.on("error", (event) => {
      lastMapError = event.error?.message ?? "Peta melaporkan kesalahan";
      console.error("[MapCanvas]", event.error);

      // Kegagalan SESUDAH style termuat tidak tertangkap jalur timeout di
      // bawah, dan itu justru bentuk kegagalan yang paling mungkin terjadi di
      // produksi: proxy mengirim `style.json` yang sah tapi lupa menulis ulang
      // `glyphs`, `sprite`, atau `sources.*.tiles`, sehingga browser menembak
      // MAPID tanpa key. `style.load` menyala normal, lalu setiap tile 401 —
      // peta dasar kosong tanpa satu pun pesan di layar (ROADMAP §4.4).
      if (!styleSudahTermuat || noticeShownRef.current) return;
      const gagal = sumberDayaGagal(event.error);
      if (!gagal) return;
      noticeShownRef.current = true;
      setNotice(
        `Sebagian peta dasar gagal dimuat (HTTP ${gagal.status}${
          gagal.host ? ` dari ${gagal.host}` : ""
        }). Lapisan data tetap ditampilkan.`,
      );
    });

    let cancelled = false;

    // Basemap datang dari jaringan dan bisa gagal. Kalau gagal, lapisan data
    // kita tetap harus tergambar — jadi tunggunya dibatasi, lalu jatuh ke
    // latar polos tanpa jaringan.
    (async () => {
      let basemapOk = await ready;
      if (cancelled) return;

      if (!basemapOk) {
        const fallbackReady = styleReadyPromise(map);
        map.setStyle(OFFLINE_STYLE);
        basemapOk = await fallbackReady;
        if (cancelled) return;
        noticeShownRef.current = true;
        setNotice(
          lastMapError
            ? `Basemap gagal dimuat (${lastMapError}). Lapisan data tetap ditampilkan di atas latar polos.`
            : "Basemap gagal dimuat — periksa koneksi internet. Lapisan data tetap ditampilkan di atas latar polos.",
        );
      }
      // Label butuh glyph dari jaringan; tanpa basemap layer label dilewati.
      glyphsAvailableRef.current = basemapOk;
      styleSudahTermuat = true;
      setStyleReady(true);
    })();

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
    };
    // `interactive` dan `attributionPosition` sengaja tidak masuk daftar:
    // keduanya menentukan bagaimana peta DIBUAT, dan peta hanya dibuat sekali.
    // Memasukkannya berarti membongkar-pasang ulang seluruh peta saat berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- memasang source, layer, dan penangan interaksi ---------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !points || !isochrones || layersReady) return;

    map.addSource(SOURCE.isochrones, { type: "geojson", data: isochrones });
    map.addSource(SOURCE.points, { type: "geojson", data: points });
    map.addSource(SOURCE.confidenceGrid, {
      type: "geojson",
      data: confidenceGrid ?? { type: "FeatureCollection", features: [] },
    });
    map.addSource(SOURCE.rental, {
      type: "geojson",
      data: rentalLocations,
    });
    map.addSource(SOURCE.stationMarkers, {
      type: "geojson",
      data: stationLocations,
    });
    map.addSource(SOURCE.retail, { type: "geojson", data: retailLocations });
    map.addSource(SOURCE.pointLabels, {
      type: "geojson",
      data: labelData ?? { type: "FeatureCollection", features: [] },
    });

    // Urutan mengikuti LAYER_ORDER: isochrone paling bawah, label paling atas.
    map.addLayer(isochroneFillLayer());
    map.addLayer(isochroneLineLayer());
    map.addLayer(confidenceFillLayer());
    map.addLayer(confidenceBoundaryLayer());
    map.addLayer(stationCircleLayer());
    if (glyphsAvailableRef.current) map.addLayer(stationLabelLayer());
    map.addLayer(rentalCircleLayer());
    if (glyphsAvailableRef.current) map.addLayer(rentalLabelLayer());
    map.addLayer(pointConfidenceLayer(gapDomain, confidenceDomain));
    map.addLayer(pointCircleLayer(gapDomain));
    // Seluruh layer bertulisan butuh glyph dari jaringan; lewati kalau basemap
    // saja gagal dimuat, karena endpoint glyph-nya ikut hilang.
    if (glyphsAvailableRef.current) {
      // Urutannya mengikuti LAYER_ORDER: arus lebih dulu, nama titik sesudahnya
      // — lihat catatan di sana soal prioritas penempatan simbol.
      map.addLayer(pointArusLayer());
      map.addLayer(pointLabelLayer());
    }

    map.addLayer(retailCircleLayer());
    if (glyphsAvailableRef.current) map.addLayer(retailLabelLayer());

    // Bawa tampilan ke seluruh kawasan studi, sisakan ruang untuk panel
    // melayang.
    //
    // Kotaknya datang dari konstanta, BUKAN dijumlahkan dari fitur yang sedang
    // dimuat. Menjumlahkan fitur kebetulan bekerja selama geometri berupa
    // GeoJSON — browser memegang daftar lengkapnya — tetapi berhenti bekerja
    // begitu geometri pindah ke tile vektor: yang diterima hanya fitur di
    // dalam layar, dan peta akan terbuka di tempat acak. Lihat ROADMAP §4.1.
    map.fitBounds(new LngLatBounds(STUDY_BOUNDS), {
      padding: fitPadding,
      duration: 0,
    });

    setLayersReady(true);
    // `gapDomain` sengaja tidak masuk daftar: layer dipasang
    // sekali, lalu skalanya diperbarui oleh efek tersendiri di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    styleReady,
    points,
    isochrones,
    labelData,
    layersReady,
    retailLocations,
    stationLocations,
    confidenceGrid,
    rentalLocations,
  ]);

  // Tunggu pemasangan layer agar fitBounds awal tidak menimpa pencarian.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady || !stationTarget) return;
    map.flyTo({
      center: [stationTarget.longitude, stationTarget.latitude],
      zoom: stationTarget.zoom ?? 16.5,
      bearing: 0,
      pitch: 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      duration: 1100,
    });
  }, [layersReady, stationTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady || !interactive || !onSelectRetail) return;
    const select = (event: {
      features?: { properties?: Record<string, unknown> }[];
    }) => {
      const id = event.features?.[0]?.properties?.id;
      const location = retailLocations.features.find(
        (feature) => feature.properties.id === id,
      )?.properties;
      if (location && onSelectRetail) onSelectRetail(location);
    };
    const enter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const leave = () => {
      map.getCanvas().style.cursor = "";
    };
    map.on("click", LAYER.retailCircle, select);
    map.on("mouseenter", LAYER.retailCircle, enter);
    map.on("mouseleave", LAYER.retailCircle, leave);
    return () => {
      map.off("click", LAYER.retailCircle, select);
      map.off("mouseenter", LAYER.retailCircle, enter);
      map.off("mouseleave", LAYER.retailCircle, leave);
    };
  }, [layersReady, interactive, retailLocations, onSelectRetail]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady) return;
    map.setPaintProperty(LAYER.retailCircle, "circle-stroke-color", [
      "case",
      ["==", ["get", "id"], selectedRetailId ?? ""],
      "#0f172a",
      "#ffffff",
    ]);
    map.setPaintProperty(LAYER.retailCircle, "circle-stroke-width", [
      "case",
      ["==", ["get", "id"], selectedRetailId ?? ""],
      3,
      2,
    ]);
  }, [layersReady, selectedRetailId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady || !interactive || !onSelectStation) return;
    const select = (event: {
      features?: { properties?: Record<string, unknown> }[];
      point?: { x: number; y: number };
    }) => {
      // Entrance and retail markers have click priority when their small
      // circles overlap an asset marker at this zoom level.
      if (event.point) {
        const blockingLayers = [
          LAYER.pointCircle,
          LAYER.retailCircle,
          LAYER.stationCircle,
        ];
        const blocked = blockingLayers.some(
          (layer) =>
            map.getLayer(layer) &&
            map.queryRenderedFeatures(event.point as never, { layers: [layer] })
              .length > 0,
        );
        if (blocked) return;
      }
      const id = event.features?.[0]?.properties?.id;
      const st = stationLocations.features.find(
        (feature) => feature.properties.id === id,
      )?.properties;
      if (st && onSelectStation) onSelectStation(st);
    };
    const enter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const leave = () => {
      map.getCanvas().style.cursor = "";
    };
    map.on("click", LAYER.stationCircle, select);
    map.on("mouseenter", LAYER.stationCircle, enter);
    map.on("mouseleave", LAYER.stationCircle, leave);
    if (map.getLayer(LAYER.stationLabel)) {
      map.on("click", LAYER.stationLabel, select);
      map.on("mouseenter", LAYER.stationLabel, enter);
      map.on("mouseleave", LAYER.stationLabel, leave);
    }
    return () => {
      map.off("click", LAYER.stationCircle, select);
      map.off("mouseenter", LAYER.stationCircle, enter);
      map.off("mouseleave", LAYER.stationCircle, leave);
      if (map.getLayer(LAYER.stationLabel)) {
        map.off("click", LAYER.stationLabel, select);
        map.off("mouseenter", LAYER.stationLabel, enter);
        map.off("mouseleave", LAYER.stationLabel, leave);
      }
    };
  }, [layersReady, interactive, stationLocations, onSelectStation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady || !map.getLayer(LAYER.stationCircle)) return;
    map.setPaintProperty(LAYER.stationCircle, "circle-color", [
      "case",
      ["==", ["get", "id"], selectedStationId ?? 0],
      "#2563eb",
      "#0f172a",
    ]);
    map.setPaintProperty(LAYER.stationCircle, "circle-stroke-width", [
      "case",
      ["==", ["get", "id"], selectedStationId ?? 0],
      4,
      2.5,
    ]);
  }, [layersReady, selectedStationId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady || !interactive || !onSelectRental) return;
    const select = (event: {
      features?: { properties?: Record<string, unknown> }[];
      point?: { x: number; y: number };
    }) => {
      // Entrance and retail markers have click priority when their small
      // circles overlap an asset marker at this zoom level.
      if (event.point) {
        const blockingLayers = [
          LAYER.pointCircle,
          LAYER.retailCircle,
          LAYER.stationCircle,
        ];
        const blocked = blockingLayers.some(
          (layer) =>
            map.getLayer(layer) &&
            map.queryRenderedFeatures(event.point as never, { layers: [layer] })
              .length > 0,
        );
        if (blocked) return;
      }
      const id = event.features?.[0]?.properties?.id;
      const asset = rentalLocations.features.find(
        (feature) => feature.properties.id === id,
      )?.properties;
      if (asset) onSelectRental(asset);
    };
    const enter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const leave = () => {
      map.getCanvas().style.cursor = "";
    };
    map.on("click", LAYER.rentalCircle, select);
    map.on("mouseenter", LAYER.rentalCircle, enter);
    map.on("mouseleave", LAYER.rentalCircle, leave);
    if (map.getLayer(LAYER.rentalLabel)) {
      map.on("click", LAYER.rentalLabel, select);
      map.on("mouseenter", LAYER.rentalLabel, enter);
      map.on("mouseleave", LAYER.rentalLabel, leave);
    }
    return () => {
      map.off("click", LAYER.rentalCircle, select);
      map.off("mouseenter", LAYER.rentalCircle, enter);
      map.off("mouseleave", LAYER.rentalCircle, leave);
      if (map.getLayer(LAYER.rentalLabel)) {
        map.off("click", LAYER.rentalLabel, select);
        map.off("mouseenter", LAYER.rentalLabel, enter);
        map.off("mouseleave", LAYER.rentalLabel, leave);
      }
    };
  }, [layersReady, interactive, rentalLocations, onSelectRental]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady || !map.getLayer(LAYER.rentalCircle)) return;
    map.setPaintProperty(LAYER.rentalCircle, "circle-stroke-color", [
      "case",
      ["==", ["get", "id"], selectedRentalId ?? ""],
      "#0f172a",
      "#ffffff",
    ]);
    map.setPaintProperty(LAYER.rentalCircle, "circle-stroke-width", [
      "case",
      ["==", ["get", "id"], selectedRentalId ?? ""],
      3,
      2,
    ]);
  }, [layersReady, selectedRentalId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady || !stationLocations) return;
    const src = map.getSource(SOURCE.stationMarkers);
    if (src && "setData" in src) {
      (src as { setData: (d: unknown) => void }).setData(stationLocations);
    }
  }, [stationLocations, layersReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady) return;
    const src = map.getSource(SOURCE.rental);
    if (src && "setData" in src) {
      (src as { setData: (d: unknown) => void }).setData(rentalLocations);
    }
  }, [rentalLocations, layersReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady || !confidenceGrid) return;
    const src = map.getSource(SOURCE.confidenceGrid);
    if (src && "setData" in src) {
      (src as { setData: (d: unknown) => void }).setData(confidenceGrid);
    }
  }, [confidenceGrid, layersReady]);

  // --- interaksi titik: sorot dan pilih -----------------------------------
  //
  // Berdiri sebagai efek tersendiri, TIDAK menumpang pada efek pemasangan
  // layer di atas. Efek itu memasang `layersReady` sebagai dependensi sekaligus
  // sebagai penjaga keluar-awal, jadi begitu `layersReady` menyala ia berjalan
  // sekali lagi: pembersihannya melepas seluruh pendengar, lalu penjaganya
  // keluar sebelum sempat memasangnya kembali. Hasilnya peta yang tampak
  // sempurna tapi tidak menanggapi satu klik pun.
  useEffect(() => {
    const map = mapRef.current;
    // Peta non-interaktif tidak mendaftarkan pendengar sama sekali — bukan
    // memasangnya lalu mengabaikannya. Kursor "pointer" di atas sesuatu yang
    // tidak bisa diklik adalah janji yang tidak ditepati.
    if (!map || !layersReady || !interactive) return;

    const clearHover = () => {
      if (hoveredRef.current === null) return;
      map.setFeatureState(
        { source: SOURCE.points, id: hoveredRef.current },
        { hover: false },
      );
      hoveredRef.current = null;
    };

    const onMove = (e: { features?: { id?: string | number }[] }) => {
      const id = e.features?.[0]?.id;
      if (typeof id !== "number" || hoveredRef.current === id) return;
      clearHover();
      hoveredRef.current = id;
      map.setFeatureState({ source: SOURCE.points, id }, { hover: true });
      map.getCanvas().style.cursor = "pointer";
    };

    const onLeave = () => {
      clearHover();
      map.getCanvas().style.cursor = "";
    };

    const onClick = (e: { features?: { id?: string | number }[] }) => {
      const id = e.features?.[0]?.id;
      if (typeof id === "number") onSelectRef.current(id);
    };

    map.on("mousemove", LAYER.pointCircle, onMove);
    map.on("mouseleave", LAYER.pointCircle, onLeave);
    map.on("click", LAYER.pointCircle, onClick);

    return () => {
      map.off("mousemove", LAYER.pointCircle, onMove);
      map.off("mouseleave", LAYER.pointCircle, onLeave);
      map.off("click", LAYER.pointCircle, onClick);
    };
  }, [layersReady, interactive]);

  // --- menempelkan seluruh keadaan fitur ke peta --------------------------
  //
  // Angka analitik DAN penanda "sedang dipilih" ditulis di satu tempat yang
  // sama, dan diterapkan ulang pada `sourcedata`. Alasannya bukan kerapian:
  // tile GeoJSON diregenerasi setiap kali datanya berubah, dan seluruh
  // feature-state ikut hilang saat itu terjadi. Sempat `terpilih` disetel
  // lewat efeknya sendiri yang hanya berjalan sekali — akibatnya angka-angka
  // kembali dengan sendirinya sesudah regenerasi, sementara lingkaran yang
  // dipilih diam-diam kehilangan tanda tanpa satu pun pesan error.
  //
  // Di Fase 2 alasannya sama persis, hanya pemicunya yang berbeda: tile vektor
  // baru yang masuk saat peta digeser (ROADMAP 2.4).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady) return;

    const apply = () => {
      for (const [id, state] of featureStates) {
        map.setFeatureState(
          { source: SOURCE.points, id },
          {
            ...state,
            terpilih: id === selectedPointId,
            hover: id === hoveredRef.current,
          },
        );
      }
    };

    apply();
    map.on("sourcedata", apply);
    return () => {
      map.off("sourcedata", apply);
    };
  }, [featureStates, selectedPointId, layersReady]);

  // --- angka label mengikuti slot dan kategori yang sedang dipilih --------
  //
  // Source-nya di-`setData` ulang, bukan disetel lewat feature-state, karena
  // `text-field` adalah properti layout dan MapLibre menolak feature-state di
  // sana. Isinya hanya sebanyak titik pengamatan, jadi ongkosnya kecil.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady || !labelData) return;

    const src = map.getSource(SOURCE.pointLabels);
    if (src && "setData" in src) {
      (src as { setData: (d: unknown) => void }).setData(labelData);
    }
  }, [labelData, layersReady]);

  // --- skala warna & ukuran mengikuti rentang data aktif ------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady) return;

    for (const { layer, property, value } of scaleDependentPaint(
      gapDomain,
      confidenceDomain,
    )) {
      if (map.getLayer(layer)) {
        map.setPaintProperty(layer, property as never, value as never);
      }
    }
  }, [gapDomain, confidenceDomain, layersReady]);

  // --- melaporkan skala peta ke legenda -----------------------------------
  //
  // Diukur, bukan dihitung dari rumus proyeksi: dua titik di kanvas
  // dikembalikan ke koordinat bumi lalu diukur jaraknya. Cara ini otomatis
  // benar untuk lintang mana pun dan tidak ikut salah kalau MapLibre mengubah
  // konvensi zoom-nya.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !onScaleChange) return;

    const RENTANG_PX = 100;
    const update = () => {
      const tengah = map.getCanvas().clientHeight / 2;
      const kiri = map.unproject([0, tengah]);
      const kanan = map.unproject([RENTANG_PX, tengah]);
      onScaleChange(kiri.distanceTo(kanan) / RENTANG_PX);
    };

    update();
    map.on("move", update);
    map.on("resize", update);
    return () => {
      map.off("move", update);
      map.off("resize", update);
    };
  }, [styleReady, onScaleChange]);

  // Basemap tetap bebas dijelajahi. Status ini hanya menerangkan apakah pusat
  // kamera masih berada di kotak dua stasiun yang memiliki data prototipe.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const update = () => {
      const center = map.getCenter();
      setAnalysisAvailable(
        center.lng >= STUDY_BOUNDS[0] &&
          center.lng <= STUDY_BOUNDS[2] &&
          center.lat >= STUDY_BOUNDS[1] &&
          center.lat <= STUDY_BOUNDS[3],
      );
    };
    update();
    map.on("moveend", update);
    return () => {
      map.off("moveend", update);
    };
  }, [styleReady]);

  // --- filter isochrone mengikuti pilihan kawasan tangkapan ---------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady) return;

    const apply = () => {
      if (!map.getLayer(LAYER.isochroneFill)) return;
      const filter = ["==", ["get", "duration_min"], catchmentMinutes];
      // Filter memakai ["get"] — bukan feature-state — karena `duration_min`
      // ikut di dalam geometri. Lihat DATA_CONTRACT.md §A1.
      map.setFilter(LAYER.isochroneFill, filter as never);
      map.setFilter(LAYER.isochroneLine, filter as never);
    };

    apply();
    map.on("sourcedata", apply);
    return () => {
      map.off("sourcedata", apply);
    };
  }, [catchmentMinutes, layersReady]);

  // --- lapisan yang dihidupkan dari panel ---------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady) return;

    for (const id of LAYER_ORDER) {
      if (!map.getLayer(id)) continue;
      // Isochrone dan station markers tidak diatur panel lapisan — kemunculannya
      // selalu aktif sebagai referensi navigasi spasial.
      if (
        id === LAYER.isochroneFill ||
        id === LAYER.isochroneLine ||
        id === LAYER.stationCircle ||
        id === LAYER.stationLabel
      ) {
        continue;
      }
      map.setLayoutProperty(
        id,
        "visibility",
        visibleLayers.includes(id) ? "visible" : "none",
      );
    }
  }, [visibleLayers, layersReady]);

  const pesan = dataError ?? notice;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius,
        overflow: borderRadius ? "hidden" : undefined,
      }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {pesan && (
        <div
          className="glass"
          style={{
            // Digeser ke kanan supaya tidak menutupi kolom kontrol peta.
            position: "absolute",
            left: 60,
            top: 14,
            maxWidth: 420,
            padding: "12px 16px",
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--ink-2)",
            borderLeft: "3px solid var(--rule-strong)",
            zIndex: 5,
          }}
        >
          {pesan}
        </div>
      )}
      {!analysisAvailable && (
        <div className="analysis-unavailable" role="status">
          <strong>Analisis belum tersedia</strong>
          <span>
            Peta dapat dijelajahi, tetapi data mock hanya tersedia di Manggarai
            dan Sudirman.
          </span>
        </div>
      )}
    </div>
  );
}
