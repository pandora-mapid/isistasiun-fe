"use client";

import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, Point, Polygon } from "geojson";
import {
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Domain } from "@/lib/analytics/select";
import type {
  IsochroneProps,
  ObservationPointProps,
  PointFeatureState,
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
  pointArusLayer,
  pointCircleLayer,
  pointConfidenceLayer,
  pointLabelLayer,
  scaleDependentPaint,
} from "@/lib/map/style";

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
      type: "background" as const,
      paint: { "background-color": "#F1F5F9" },
    },
  ],
};

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
  catchmentMinutes,
  visibleLayers,
  selectedPointId,
  onSelectPoint,
  dataError = null,
  onScaleChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  /** Peta siap menerima source dan layer. */
  const [styleReady, setStyleReady] = useState(false);
  /** Source dan layer sudah terpasang — penjaga seluruh efek di bawah. */
  const [layersReady, setLayersReady] = useState(false);
  /** Pesan yang ditampilkan di atas peta: kegagalan keras maupun peringatan. */
  const [notice, setNotice] = useState<string | null>(null);
  /** Titik yang sedang disorot kursor, supaya bisa dibersihkan saat berpindah. */
  const hoveredRef = useRef<number | null>(null);
  /** Apakah glyph label bisa diambil — ikut gagal kalau basemap gagal. */
  const glyphsAvailableRef = useRef(true);
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
      attributionControl: { compact: true },
      // Di atas 60 derajat pandangan mulai menatap cakrawala dan peta jadi
      // sulit dibaca — sekaligus membuat kendali kemiringan terasa liar.
      maxPitch: CAMERA.maxPitch,
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
    map.addControl(
      new NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-left",
    );

    // MapLibre melaporkan kegagalan style/tile lewat event ini. Tanpa
    // pendengar, kegagalannya hanya muncul di console dan peta diam membisu.
    let lastMapError: string | null = null;
    map.on("error", (event) => {
      lastMapError = event.error?.message ?? "Peta melaporkan kesalahan";
      console.error("[MapCanvas]", event.error);
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
        setNotice(
          lastMapError
            ? `Basemap gagal dimuat (${lastMapError}). Lapisan data tetap ditampilkan di atas latar polos.`
            : "Basemap gagal dimuat — periksa koneksi internet. Lapisan data tetap ditampilkan di atas latar polos.",
        );
      }
      // Label butuh glyph dari jaringan; tanpa basemap layer label dilewati.
      glyphsAvailableRef.current = basemapOk;
      setStyleReady(true);
    })();

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // --- memasang source, layer, dan penangan interaksi ---------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !points || !isochrones || layersReady) return;

    map.addSource(SOURCE.isochrones, { type: "geojson", data: isochrones });
    map.addSource(SOURCE.points, { type: "geojson", data: points });
    map.addSource(SOURCE.pointLabels, {
      type: "geojson",
      data: labelData ?? { type: "FeatureCollection", features: [] },
    });

    // Urutan mengikuti LAYER_ORDER: isochrone paling bawah, label paling atas.
    map.addLayer(isochroneFillLayer());
    map.addLayer(isochroneLineLayer());
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

    // Bawa tampilan ke seluruh kawasan studi, sisakan ruang untuk panel
    // melayang.
    //
    // Kotaknya datang dari konstanta, BUKAN dijumlahkan dari fitur yang sedang
    // dimuat. Menjumlahkan fitur kebetulan bekerja selama geometri berupa
    // GeoJSON — browser memegang daftar lengkapnya — tetapi berhenti bekerja
    // begitu geometri pindah ke tile vektor: yang diterima hanya fitur di
    // dalam layar, dan peta akan terbuka di tempat acak. Lihat ROADMAP §4.1.
    map.fitBounds(new LngLatBounds(STUDY_BOUNDS), {
      padding: FIT_PADDING,
      duration: 0,
    });

    setLayersReady(true);
    // `gapDomain` sengaja tidak masuk daftar: layer dipasang
    // sekali, lalu skalanya diperbarui oleh efek tersendiri di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleReady, points, isochrones, labelData, layersReady]);

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
    if (!map || !layersReady) return;

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
  }, [layersReady]);

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
      // Isochrone tidak diatur panel lapisan — kemunculannya ditentukan
      // filter kawasan tangkapan, jadi dibiarkan apa adanya.
      if (id === LAYER.isochroneFill || id === LAYER.isochroneLine) continue;
      map.setLayoutProperty(
        id,
        "visibility",
        visibleLayers.includes(id) ? "visible" : "none",
      );
    }
  }, [visibleLayers, layersReady]);

  const pesan = dataError ?? notice;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
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
            color: "#475569",
            borderLeft: "3px solid #94A3B8",
            zIndex: 5,
          }}
        >
          {pesan}
        </div>
      )}
    </div>
  );
}
