"use client";

import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  resolveBasemapUrl,
  CAMERA,
  FIT_PADDING,
  INITIAL_VIEW,
  LAYER,
  SOURCE,
} from "@/lib/map/config";
import {
  isochroneFillLayer,
  isochroneLineLayer,
  pointCircleLayer,
  pointLabelLayer,
} from "@/lib/map/style";
import {
  loadIsochrones,
  loadObservationPoints,
  loadSpendingGap,
} from "@/lib/data/source";

type Props = {
  /** Kawasan tangkapan yang sedang dipilih: 3, 5, atau 10 menit. */
  catchmentMinutes: number;
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
 * Kanvas peta MapLibre — menggantikan basemap SVG ilustratif.
 *
 * Komponen ini hanya mengurus peta: memuat data, memasang layer, dan
 * menempelkan angka analitik ke fitur. Seluruh panel yang melayang di atasnya
 * tetap tinggal di `PetaScreen`, dan seluruh nilai warna/ukuran tinggal di
 * `lib/map/style.ts` (ROADMAP.md §1).
 *
 * Angka analitik sengaja ditempelkan lewat `setFeatureState`, bukan digabung
 * ke properti GeoJSON — supaya cara kerjanya sama persis dengan Fase 2 saat
 * geometri datang dari tile vektor dan angkanya dari Go API. Dengan begitu
 * ekspresi gaya di `style.ts` tidak perlu diubah sama sekali nanti.
 */
export function MapCanvas({ catchmentMinutes }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  /** Pesan yang ditampilkan di atas peta: kegagalan keras maupun peringatan. */
  const [notice, setNotice] = useState<string | null>(null);

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
    const styleReady = styleReadyPromise(map);

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

    async function build() {
      try {
        const [points, isochrones, analytics] = await Promise.all([
          loadObservationPoints(),
          loadIsochrones(),
          loadSpendingGap(),
        ]);
        if (cancelled) return;

        // Basemap datang dari jaringan dan bisa gagal. Kalau gagal, lapisan
        // data kita tetap harus tergambar — jadi tunggunya dibatasi, lalu
        // jatuh ke latar polos tanpa jaringan.
        let basemapOk = await styleReady;
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

        map.addSource(SOURCE.isochrones, { type: "geojson", data: isochrones });
        map.addSource(SOURCE.points, { type: "geojson", data: points });

        // Urutan penting: isochrone di bawah, titik di atasnya.
        map.addLayer(isochroneFillLayer());
        map.addLayer(isochroneLineLayer());
        map.addLayer(pointCircleLayer());
        // Label butuh glyph dari jaringan; lewati kalau basemap saja gagal.
        if (basemapOk) map.addLayer(pointLabelLayer());

        // Tempelkan angka analitik ke tiap fitur.
        for (const point of analytics.points) {
          map.setFeatureState(
            { source: SOURCE.points, id: point.point_id },
            {
              gap: point.total.gap.p50 ?? 0,
              sampel_tipis: point.sampel_tipis,
              confidence: point.confidence,
            },
          );
        }

        // Bawa tampilan ke seluruh titik, sisakan ruang untuk panel melayang.
        const bounds = new LngLatBounds();
        for (const feature of points.features) {
          bounds.extend(feature.geometry.coordinates as [number, number]);
        }
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: FIT_PADDING, duration: 0 });
        }
      } catch (err) {
        if (!cancelled) {
          setNotice(err instanceof Error ? err.message : "Peta gagal dimuat");
        }
      }
    }

    build();

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
    };
  }, []);



  // --- filter isochrone mengikuti pilihan kawasan tangkapan ---------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
  }, [catchmentMinutes]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />


      {notice && (
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
          {notice}
        </div>
      )}
    </div>
  );
}
