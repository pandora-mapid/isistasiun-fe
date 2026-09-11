"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "./NavBar";
import { MapCanvas } from "./MapCanvas";
import { StationSearch } from "./StationSearch";
import { RetailLocations } from "./RetailLocations";
import { ComparisonDialog } from "./ComparisonDialog";
import { retailGeoJSON, type RetailLocation } from "@/lib/data/retail";
import { categoryStatusesFor, evidenceFor, pointRank } from "@/lib/analytics/demo-select";
import {
  biggestGapPoint,
  confidenceDomainOf,
  domainOf,
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
import type { PointFeatureState, SlotKey } from "@/lib/data/types";
import { usePetaData } from "@/lib/data/usePetaData";
import {
  desimal,
  jarak,
  persen,
  ribuan,
  rupiah,
  rupiahRingkas,
  TIDAK_DIESTIMASI,
} from "@/lib/format";
import { CATCHMENT_MINUTES, LAYER_GROUPS } from "@/lib/map/config";
import { scaleBarFor } from "@/lib/map/scale";
import { gapColorStops, DOMAIN_AWAL, LEGEND_DOT } from "@/lib/map/style";

export type PetaInitialQuery = {
  stationId: number | null;
  pointId: number | null;
  retailId: string | null;
  slot: SlotKey;
  category: CategoryFilter;
};

type LayerRow = {
  key: string;
  label: string;
  dot: string;
  tint: string;
};

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
  { key: "retail", label: "Retail & potensi toko", dot: "#047857", tint: "rgba(4,120,87,.08)" },
  { key: "gap", label: "Kesenjangan belanja", dot: "var(--data)", tint: "var(--data-wash)" },
  { key: "kepercayaan", label: "Kepercayaan data", dot: "var(--rule-strong)", tint: "var(--data-wash)" },
  { key: "arus", label: "Arus pintu stasiun", dot: "var(--data)", tint: "var(--data-wash)" },
  { key: "sewa", label: "Indeks sewa / arus", dot: "var(--ink-2)", tint: "rgba(22,19,15,.08)" },
  { key: "event", label: "Event & aktivasi", dot: "var(--ink-faint)", tint: "rgba(22,19,15,.06)" },
];

/** Baris yang benar-benar menggerakkan peta. */
const LAYER_TERSEDIA = LAYER_ROWS.filter((r) => r.key in LAYER_GROUPS);
const DEFAULT_ACTIVE_LAYERS = ["gap", "kepercayaan", "retail"];

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
  "bandingkan Stasiun B dengan Stasiun C",
  "kawasan mana yang sampelnya masih tipis?",
];

export function PetaScreen({ initialQuery }: { initialQuery: PetaInitialQuery }) {
  const { points, isochrones, analytics, stations, entrances, demo, error } =
    usePetaData();

  const [tab, setTab] = useState<"brief" | "copilot">("brief");
  const [layersOpen, setLayersOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState<string[]>(DEFAULT_ACTIVE_LAYERS);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(initialQuery.category);
  const [activeCatchment, setActiveCatchment] = useState<number>(5);
  const [activeSlot, setActiveSlot] = useState<SlotKey>(initialQuery.slot);
  const [showTransparansi, setShowTransparansi] = useState(false);
  const [showCopilotResult, setShowCopilotResult] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [stationTarget, setStationTarget] = useState<{ longitude: number; latitude: number; zoom?: number } | null>(null);
  const [selectedRetailChoice, setSelectedRetail] = useState<RetailLocation | null | undefined>(undefined);
  const retailLocations = useMemo(
    () => (demo?.retail ?? []).filter((location) =>
      activeCategory === ALL_CATEGORIES || location.category === activeCategory,
    ),
    [demo, activeCategory],
  );
  const retailData = useMemo(() => retailGeoJSON(retailLocations), [retailLocations]);
  const selectRetail = useCallback((location: RetailLocation) => {
    setSelectedRetail(location);
    setStationTarget({ longitude: location.longitude, latitude: location.latitude, zoom: 19 });
    setActiveLayers((current) => current.includes("retail") ? current : [...current, "retail"]);
  }, []);

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
        ? metricsFor(analytics, activeSlot, activeCategory)
        : new Map<number, PointMetric>(),
    [analytics, activeSlot, activeCategory],
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

  const linkedRetail = retailLocations.find((item) => item.id === initialQuery.retailId) ?? null;
  const selectedRetail = selectedRetailChoice === undefined ? linkedRetail : selectedRetailChoice;
  const linkedStation = stations?.find((item) => item.id === initialQuery.stationId);
  const effectiveStationTarget = useMemo(() => stationTarget ?? (
      selectedRetail
        ? { longitude: selectedRetail.longitude, latitude: selectedRetail.latitude, zoom: 19 }
        : linkedStation?.longitude !== undefined && linkedStation.latitude !== undefined
          ? { longitude: linkedStation.longitude, latitude: linkedStation.latitude }
          : null
    ), [stationTarget, selectedRetail, linkedStation]);

  // Tampilan awal jatuh ke titik dengan kesenjangan terbesar — itu yang paling
  // pantas dilihat lebih dulu, dan menghindari panel kosong saat halaman buka.
  const selectedPointId =
    pilihanTitik === undefined
      ? analytics
        ? initialQuery.pointId ??
          analytics.points.find((item) => item.station_id === initialQuery.stationId)?.point_id ??
          biggestGapPoint(analytics)
        : null
      : pilihanTitik;

  const selectedPoint = analytics ? findPoint(analytics, selectedPointId) : null;
  const selectedMetric =
    selectedPointId === null ? null : metrics.get(selectedPointId) ?? null;
  const selectedSlotRow = selectedPoint ? slotOf(selectedPoint, activeSlot) : null;
  const stationMetrics = selectedPoint
    ? pointsOfStation(metrics, selectedPoint.station_id)
    : [];
  const stationMax = Math.max(
    1,
    ...stationMetrics.map((m) => m.gap.p50 ?? 0),
  );
  const selectedRank = pointRank(stationMetrics, selectedPointId);
  const station = stations?.find((s) => s.id === selectedPoint?.station_id);
  const categoryStatuses = categoryStatusesFor(
    demo?.category_statuses ?? [],
    selectedPoint?.station_id,
  );
  const selectedEvidence = evidenceFor(demo?.evidence ?? [], selectedPointId);
  const evidenceDate = selectedEvidence
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" })
      .format(new Date(selectedEvidence.surveyed_at))
    : "Belum tersedia";

  const tabX = tab === "brief" ? 4 : 190;
  const chev = layersOpen ? 180 : 0;
  const layerCount = layersOpen
    ? `${activeLayers.length} dari ${LAYER_TERSEDIA.length} aktif`
    : `${activeLayers.length} aktif`;
  const legend = gapColorStops(gapDomain);
  /** Batang skala: `null` selama peta belum melaporkan ukurannya. */
  const scaleBar = metersPerPixel ? scaleBarFor(metersPerPixel, SKALA_MAKS_PX) : null;

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
        />
        <StationSearch stations={stations} error={error} onSelect={(target) => {
          setSelectedRetail(null);
          setStationTarget({ ...target });
          const point = analytics?.points.find((p) => p.station_id === target.id);
          setPilihanTitik(point?.point_id ?? null);
          setTab("brief");
          setLayersOpen(false);
          setShowTransparansi(false);
        }} />
        <RetailLocations locations={retailLocations} selected={selectedRetail} onSelect={selectRetail} onClose={() => setSelectedRetail(null)} />

        <div
          className="row glass"
          style={{
            position: "absolute",
            left: 24,
            bottom: 132,
            gap: 12,
            alignItems: "stretch",
            // Penjaga saja: isinya sekarang tetap, tapi kalau suatu saat ada
            // butir baru, lebih baik turun sebaris daripada meluber menutupi
            // panel di kanannya.
            flexWrap: "wrap",
            maxWidth: "calc(100% - 500px)",
            padding: "10px 16px 12px",
          }}
        >
          {/* Legenda mendatar dengan judul kelompok.

             Tetap satu baris kelompok berjajar — tingginya bertambah sebaris
             judul saja dan berhenti di situ, tidak ikut tumbuh bersama isinya.
             Itu syarat yang tidak boleh dilanggar: kartu ini melayang di atas
             peta, jadi tumbuh ke atas berarti menutupi peta.

             Judulnya menerangkan apa yang sedang dibaca; bentuk lambangnya
             tetap yang membedakan jenis — bulatan untuk tempat, persegi untuk
             wilayah, batang untuk jarak — supaya keduanya saling menguatkan,
             bukan judul sendirian yang menanggung beban. */}
          <span style={LEGENDA_GRUP}>
            <span className="k">Kesenjangan</span>
            <span className="row" style={{ gap: 8 }}>
              {/* Bulatannya membesar sekaligus menggelap, karena di peta besar
                 lingkaran memang membawa arti yang sama dengan warnanya. */}
              <span className="row" style={{ gap: 3 }}>
                {legend.map((stop, i) => {
                  const d =
                    LEGEND_DOT.min +
                    ((LEGEND_DOT.max - LEGEND_DOT.min) * i) / (legend.length - 1);
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
              <span className="fig" style={{ ...LEGENDA_TEKS, fontSize: 9.5, color: "var(--ink-faint)" }}>
                {rupiahRingkas(gapDomain.min)} → {rupiahRingkas(gapDomain.max)}
              </span>
            </span>
          </span>

          <span style={LEGENDA_SEKAT} />

          <span style={LEGENDA_GRUP}>
            <span className="k">Mutu data</span>
            <span className="row" style={{ gap: 14 }}>
              {/* "Sampel tipis" sengaja TIDAK ada di sini. Keputusan tim:
                 panel kanan sudah menerangkannya ("Tidak diestimasi" beserta
                 alasannya), jadi legendanya dianggap mengulang.

                 Titiknya tetap digambar berbeda di peta — lingkaran putih
                 bergaris abu — dan itu tidak boleh ikut dihapus: menghapusnya
                 akan membuat titik tanpa data terbaca sebagai titik bergap
                 terkecil, persis kebalikan dari maksudnya. */}
              <span className="row" style={{ ...LEGENDA_TEKS, gap: 8 }}>
                <span
                  title="halo makin tebal berarti kepercayaan makin rendah"
                  // Warna halo (rgba 100,116,139) sengaja tetap — ia cermin
                  // CONFIDENCE_COLOR di lib/map/style.ts yang tidak disentuh.
                  style={{ width: 12, height: 12, borderRadius: 999, background: "var(--surface)", boxShadow: "0 0 0 1.5px var(--surface), 0 0 0 4.5px rgba(100,116,139,.55)", flex: "none", marginLeft: 3 }}
                />
                Kepercayaan rendah
              </span>
            </span>
          </span>

          {/* Lapisan opsional (arus pintu) tidak diberi butir legenda:
             labelnya di peta sudah menulis satuannya sendiri — "380/jam" —
             jadi ia menerangkan dirinya tanpa kunci baca. Bandingkan dengan
             lingkaran sampel tipis yang tanpa kata sama sekali. */}
          <span style={LEGENDA_SEKAT} />

          <span style={LEGENDA_GRUP}>
            <span className="k">Kawasan</span>
            <span className="row" style={{ ...LEGENDA_TEKS, gap: 7 }}>
              {/* Persegi, bukan bulatan: ini wilayah, bukan tempat. Warna
                 sengaja tetap — cermin ISOCHRONE_COLOR di lib/map/style.ts. */}
              <span
                style={{ width: 22, height: 13, borderRadius: 3, background: "rgba(37,99,235,.16)", border: "1px dashed #2563EB", flex: "none" }}
              />
              Jangkauan jalan kaki {activeCatchment} menit
            </span>
          </span>

          <span style={LEGENDA_SEKAT} />

          <span style={LEGENDA_GRUP}>
            <span className="k">Skala</span>
            {/* Batang skala: PANJANG BATANGNYA yang mewakili jarak, jadi
               labelnya menempel di sebelahnya. Kotaknya berlebar tetap walau
               batangnya berubah, supaya legenda tidak bergoyang saat di-zoom. */}
            <span className="row" style={{ gap: 7 }}>
              <span style={{ position: "relative", height: 7, width: SKALA_MAKS_PX, flex: "none" }}>
                {scaleBar && (
                  <>
                    <span style={{ position: "absolute", left: 0, top: 3, width: scaleBar.widthPx, height: 1.5, background: "var(--ink)" }} />
                    <span style={{ position: "absolute", left: 0, top: 0, width: 1.5, height: 7, background: "var(--ink)" }} />
                    <span style={{ position: "absolute", left: scaleBar.widthPx - 1.5, top: 0, width: 1.5, height: 7, background: "var(--ink)" }} />
                  </>
                )}
              </span>
              <span className="fig" style={{ ...LEGENDA_TEKS, fontSize: 9.5, color: "var(--ink-muted)" }}>
                {scaleBar ? jarak(scaleBar.meters) : "—"}
              </span>
            </span>
          </span>
        </div>

        <div
          className="fig"
          style={{ position: "absolute", left: 24, bottom: 206, fontSize: 10.5, color: "var(--ink-faint)" }}
        >
          {analytics
            ? `data contoh · pipeline ${analytics.pipeline_version} · ${
                analytics.day_type === "weekday" ? "hari kerja" : "akhir pekan"
              } · dibuat ${analytics.generated_at.slice(0, 10)}`
            : "memuat data contoh…"}
        </div>

        <div
          className="glass"
          style={{ position: "absolute", left: 24, right: 462, bottom: 24, padding: "14px 18px 16px" }}
        >
          <div className="row" style={{ gap: 10, marginBottom: 11 }}>
            <span className="k">Slot waktu · hari kerja</span>
            <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>
              hanya slot yang benar-benar dicacah dapat dipilih — jam di antaranya tidak diinterpolasi
            </span>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {/* Barisnya sengaja RATA — pil dan garis penghubung bersaudara
               langsung di dalam satu flex row.

               Sebelumnya tiap slot dibungkus div ber-`flex: 1` yang juga
               memuat garisnya. Karena slot pertama tidak punya garis (tidak
               ada apa pun di kirinya untuk dihubungkan), jatah ruang
               pembungkus itu tersisa kosong di kanan pil `06–09` — dan
               timeline-nya terbaca putus tepat di ruas pertama. */}
            {SLOTS.map((slot, i) => {
              const active = activeSlot === slot.key;
              // Penanda "sampel tipis" hanya muncul kalau slot itu memang tipis
              // untuk titik yang sedang dipilih — bukan hiasan tetap.
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
                      padding: "9px 16px",
                      background: active ? "var(--ink)" : "var(--paper-2)",
                      color: active ? "var(--surface)" : "var(--ink-2)",
                      font: `${active ? 600 : 500} 12px/1 var(--font-inter)`,
                      boxShadow: active ? "var(--shadow-soft)" : "none",
                      borderRadius: 999,
                    }}
                  >
                    {slot.label}
                    {tipis && (
                      <span className="fig" style={{ opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>
                        tipis
                      </span>
                    )}
                  </button>
                </Fragment>
              );
            })}
            {/* Akhir pekan BUKAN slot kelima — ia sumbu lain: jenis hari.
               Empat pil di kiri adalah jendela waktu di dalam satu hari,
               sedangkan ini satu sampel pembanding di hari yang berbeda
               (janji proposal, datanya belum dicacah).

               Karena itu ia diputus dari rantai timeline dan diberi garis
               pemisah: duduk sebagai pil kelima yang seukuran dan sebentuk
               membuatnya terbaca sebagai pilihan waktu yang bisa dipencet,
               padahal bukan keduanya. */}
            <span
              style={{ width: 1, height: 22, background: "var(--rule)", margin: "0 6px", flex: "none" }}
            />
            <span className="row" style={{ gap: 8, flex: "none" }}>
              <span className="k">Pembanding</span>
              <span
                className="pill"
                title="satu sampel pembanding di akhir pekan — dijanjikan proposal, belum dicacah"
                style={{ padding: "9px 16px", border: "1.5px dashed var(--rule-strong)", background: "var(--paper-2)", color: "var(--ink-muted)", font: "500 12px/1 var(--font-inter)", cursor: "not-allowed" }}
              >
                Akhir pekan
              </span>
            </span>
          </div>
        </div>

        <div
          className="glass"
          style={{ position: "absolute", right: 24, top: 112, bottom: 44, width: 414, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <div style={{ flex: "none", padding: "14px 14px 12px" }}>
            <div className="row pill" style={{ position: "relative", background: "var(--paper-2)", padding: 4 }}>
              <div
                className="pill"
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  width: 186,
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-soft)",
                  transition: "left .18s cubic-bezier(.4,0,.2,1)",
                  left: tabX,
                }}
              />
              <button
                onClick={() => setTab("brief")}
                style={{ all: "unset", position: "relative", flex: 1, textAlign: "center", padding: "9px 0", font: "600 12.5px/1 var(--font-inter)", color: "var(--ink)", cursor: "pointer" }}
              >
                Ringkasan
              </button>
              <button
                onClick={() => setTab("copilot")}
                style={{ all: "unset", position: "relative", flex: 1, textAlign: "center", padding: "9px 0", font: "600 12.5px/1 var(--font-inter)", color: "var(--ink)", cursor: "pointer" }}
              >
                Tanya Data
              </button>
            </div>
          </div>

          {tab === "brief" && (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ flex: "none", padding: "4px 22px 18px" }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="k" style={{ marginBottom: 10 }}>
                      Brief simpul · {slotLabel(activeSlot)}
                    </div>
                    <div style={{ font: "600 34px/1.05 var(--font-inter)", letterSpacing: "-.01em" }}>
                      {selectedPoint
                        ? stationNames.get(selectedPoint.station_id) ?? "Simpul"
                        : "Pilih titik"}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 12 }}>
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
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="sc" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 22px 8px" }}>
                <div style={{ borderRadius: "var(--r-md)", background: "var(--paper-2)", marginBottom: 26, overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setLayersOpen((v) => !v)}
                    className="row layers-toggle btn-reset"
                    aria-expanded={layersOpen}
                    style={{ gap: 10, width: "100%", padding: "13px 15px", cursor: "pointer" }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flex: "none", color: "var(--ink)", transition: "transform .18s cubic-bezier(.4,0,.2,1)", transform: `rotate(${chev}deg)` }}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <span className="k" style={{ flex: 1 }}>Lapisan &amp; filter</span>
                    <span className="fig" style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>{layerCount}</span>
                  </button>

                  {!layersOpen && (
                    <div className="row" style={{ gap: 7, padding: "0 15px 13px", whiteSpace: "nowrap", overflow: "hidden" }}>
                      {LAYER_ROWS.filter((r) => activeLayers.includes(r.key))
                        .slice(0, 3)
                        .map((r) => (
                          <span key={r.key} className="row" style={{ gap: 5, flex: "none" }}>
                            <span className="dot" style={{ background: r.dot }} />
                            <span style={{ fontSize: 11.5 }}>{r.label.replace(" belanja", "").replace(" stasiun", "").replace(" data", "")}</span>
                          </span>
                        ))}
                      <span style={{ width: 1, height: 14, background: "var(--rule)", flex: "none" }} />
                      <span className="fig" style={{ fontSize: 11.5, color: "var(--ink-muted)", flex: "none" }}>
                        {categoryLabel(activeCategory)} · {activeCatchment} mnt
                      </span>
                    </div>
                  )}

                  {layersOpen && (
                    <div style={{ padding: "2px 15px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {LAYER_ROWS.map((r) => {
                          const tersedia = r.key in LAYER_GROUPS;
                          const on = activeLayers.includes(r.key);
                          return (
                            <button
                              type="button"
                              key={r.key}
                              onClick={() => toggleLayer(r.key)}
                              className="lyr btn-reset"
                              // Bukan `disabled`: baris tanpa data tetap layak
                              // dijangkau Tab supaya keterangan "belum ada data"
                              // ikut terbaca — yang dicegah hanya efeknya, dan
                              // itu sudah dijaga `toggleLayer`.
                              aria-disabled={!tersedia}
                              aria-pressed={on}
                              title={
                                tersedia
                                  ? undefined
                                  : "lapisan ini belum punya data — lihat ROADMAP §6"
                              }
                              style={{
                                ...(on ? { background: r.tint, color: "var(--ink)", fontWeight: 600 } : {}),
                                ...(tersedia
                                  ? {}
                                  : { cursor: "not-allowed", color: "var(--ink-faint)" }),
                              }}
                            >
                              <span
                                className="dot"
                                style={{ background: tersedia ? r.dot : "var(--rule)" }}
                              />
                              <span style={{ flex: 1 }}>{r.label}</span>
                              {!tersedia && (
                                <span className="fig" style={{ fontSize: 9.5, color: "var(--ink-faint)" }}>
                                  belum ada data
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="k" style={{ margin: "18px 0 10px" }}>Kategori usaha</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[{ key: ALL_CATEGORIES, label: "Semua" }, ...CATEGORIES].map((c) => {
                          const active = activeCategory === c.key;
                          const dot = CATEGORY_DOT[c.key];
                          return (
                            <button
                              type="button"
                              key={c.key}
                              className="chip btn-reset"
                              aria-pressed={active}
                              onClick={() => setActiveCategory(c.key as CategoryFilter)}
                              style={active ? { background: "var(--ink)", color: "var(--surface)", borderColor: "var(--ink)" } : undefined}
                            >
                              {dot && <span className="dot" style={{ background: dot }} />}
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "var(--ink-faint)", marginTop: 8 }}>
                        Kategori dan slot tidak menyembunyikan titik — keduanya
                        mengubah warna dan ukurannya, supaya jumlah titik yang
                        dibandingkan selalu sama.
                      </div>

                      <div className="k" style={{ margin: "18px 0 10px" }}>Kawasan tangkapan</div>
                      <div className="row pill" style={{ background: "var(--surface)", padding: 3 }}>
                        {CATCHMENT_MINUTES.map((m) => {
                          const active = activeCatchment === m;
                          return (
                            <button
                              type="button"
                              key={m}
                              onClick={() => setActiveCatchment(m)}
                              className="pill btn-reset"
                              aria-pressed={active}
                              style={{
                                flex: 1,
                                textAlign: "center",
                                padding: "8px 0",
                                fontSize: 12,
                                fontWeight: active ? 600 : 400,
                                background: active ? "var(--ink)" : "transparent",
                                color: active ? "var(--surface)" : "var(--ink-2)",
                                cursor: "pointer",
                              }}
                            >
                              {m} mnt
                            </button>
                          );
                        })}
                      </div>

                      <div className="k" style={{ margin: "18px 0 9px" }}>
                        Kesenjangan · {slotLabel(activeSlot)} · {categoryLabel(activeCategory)}
                      </div>
                      <div className="row" style={{ height: 9, gap: 2 }}>
                        {legend.map((stop) => (
                          <span
                            key={stop.color}
                            title={`≥ ${rupiah(Math.round(stop.at))}`}
                            style={{ flex: 1, height: 9, background: stop.color }}
                          />
                        ))}
                      </div>
                      <div className="fig row" style={{ justifyContent: "space-between", fontSize: 10, color: "var(--ink-faint)", marginTop: 6 }}>
                        <span>{rupiah(gapDomain.min)}</span>
                        <span>{rupiah(gapDomain.max)}</span>
                      </div>
                      <div className="row" style={{ alignItems: "flex-start", gap: 9, marginTop: 12 }}>
                        {/* Garis putus abu (#94A3B8) sengaja tetap — cermin
                           THIN_SAMPLE_COLOR di lib/map/style.ts. */}
                        <span style={{ width: 13, height: 13, borderRadius: 12, border: "1.5px dashed #94A3B8", flex: "none", marginTop: 1 }} />
                        <span style={{ fontSize: 11, lineHeight: 1.45, color: "var(--ink-muted)" }}>
                          Sampel tipis — tidak diestimasi, tidak dibaca aman maupun bermasalah
                        </span>
                      </div>

                      <button onClick={() => setLayersOpen(false)} className="b bp" style={{ width: "100%", marginTop: 16 }}>
                        Terapkan &amp; tutup
                      </button>
                    </div>
                  )}
                </div>

                {!selectedMetric && (
                  <div style={{ borderRadius: "var(--r-md)", padding: 24, background: "var(--data-wash)", fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-muted)" }}>
                    Belum ada titik yang dipilih. Klik salah satu lingkaran di
                    peta — ukurannya mengikuti besar kesenjangan pada slot dan
                    kategori yang sedang aktif.
                  </div>
                )}

                {selectedMetric && (
                  <>
                    <div style={{ borderRadius: "var(--r-md)", padding: 24, background: "var(--data-wash)" }}>
                      <div className="k" style={{ marginBottom: 12 }}>
                        Kesenjangan belanja
                        {activeCategory !== ALL_CATEGORIES && ` · ${categoryLabel(activeCategory)}`}
                      </div>
                      {selectedMetric.gap.p50 === null ? (
                        <>
                          <div className="fig" style={{ fontWeight: 700, fontSize: 22, lineHeight: 1.15, color: "var(--ink-muted)" }}>
                            Tidak diestimasi
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 9 }}>
                            sampelnya belum memenuhi ambang 3 gerai × 2 blok —
                            titik ini tidak dibaca aman maupun bermasalah
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="fig" style={{ fontWeight: 700, fontSize: 25, lineHeight: 1.15, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>
                            {rupiah(selectedMetric.gap.p10)} – {ribuan(selectedMetric.gap.p90 ?? 0)}
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 9 }}>
                            per {slotLabel(activeSlot)} hari kerja · rentang P10–P90 · 10.000 iterasi
                          </div>
                          {/* Bar ini ADALAH rentang P10–P90 titik tersebut:
                             ujung kiri P10, ujung kanan P90, penanda putih di
                             median. Sengaja tidak dipetakan ke skala warna —
                             P90 selalu melampaui batas atas skala (yang disusun
                             dari median antar titik), jadi pitanya akan selalu
                             mentok di ujung kanan dan tidak memberi tahu apa
                             pun. */}
                          <div style={{ position: "relative", height: 12, margin: "18px 0 8px" }}>
                            <div className="pill" style={{ position: "absolute", inset: 0, background: "var(--rule-soft)" }} />
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
                          <div className="fig row" style={{ justifyContent: "space-between", fontSize: 10, color: "var(--ink-faint)" }}>
                            <span>P10 {rupiahRingkas(selectedMetric.gap.p10)}</span>
                            <span>median {rupiahRingkas(selectedMetric.gap.p50)}</span>
                            <span>P90 {rupiahRingkas(selectedMetric.gap.p90)}</span>
                          </div>
                        </>
                      )}
                      <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "var(--ink-muted)", marginTop: 14 }}>
                        Batas atas peluang pendapatan non-tiket, <b style={{ color: "var(--ink)" }}>bukan</b> pendapatan yang pasti diperoleh.
                      </div>
                    </div>

                    <dl className="point-facts" aria-label="Ringkasan mutu titik">
                      <div><dt>Peringkat di stasiun</dt><dd>{selectedRank ? `#${selectedRank.rank} dari ${selectedRank.total}` : TIDAK_DIESTIMASI}</dd></div>
                      <div><dt>Confidence</dt><dd>{desimal(selectedMetric.confidence)}</dd></div>
                      <div><dt>Jumlah sampel</dt><dd>{selectedPoint ? `${selectedPoint.sample_meta.gerai_count} gerai × ${selectedPoint.sample_meta.blok_count} blok` : "—"}</dd></div>
                    </dl>

                    <div style={{ padding: "28px 0 20px" }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                        <span className="k">Uraian F × E × C × V</span>
                        <Link href="/metodologi" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--data)" }}>Metodologi →</Link>
                      </div>
                      <div style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                        <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid var(--rule)" }}>
                          <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>F — arus pintu</span>
                          <span className="fig" style={{ fontSize: 13, fontWeight: 600 }}>
                            {selectedMetric.variables ? ribuan(selectedMetric.variables.F) : "—"}{" "}
                            <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>org/jam</span>
                          </span>
                        </div>
                        <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid var(--rule)" }}>
                          <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>E — entry ratio</span>
                          <span className="fig" style={{ fontSize: 13, fontWeight: 600 }}>
                            {persen(selectedMetric.variables?.E)}
                          </span>
                        </div>
                        <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid var(--rule)" }}>
                          <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>C — konversi</span>
                          <span className="fig" style={{ fontSize: 13, fontWeight: 600 }}>
                            {persen(selectedMetric.variables?.C, 0)}
                          </span>
                        </div>
                        <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", background: "var(--data-wash)" }}>
                          <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
                            V — nilai transaksi{" "}
                            <span style={{ fontSize: 9.5, color: "var(--ink-faint)" }}>
                              {activeCategory === ALL_CATEGORIES ? "AI" : `AI · ${categoryLabel(activeCategory)}`}
                            </span>
                          </span>
                          <span className="fig" style={{ fontSize: 13, fontWeight: 700, color: "var(--data)" }}>
                            {rupiah(nilaiV)}
                          </span>
                        </div>
                      </div>
                      <div className="row" style={{ justifyContent: "space-between", marginTop: 14 }}>
                        <span className="fig" style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
                          Potensi {rupiahRingkas(selectedMetric.potensi.p50)} − tertangkap{" "}
                          {rupiahRingkas(selectedMetric.tertangkap.p50)}
                        </span>
                        <button
                          onClick={() => setShowTransparansi(true)}
                          style={{ all: "unset", cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: "var(--data)" }}
                        >
                          Lihat bukti →
                        </button>
                      </div>
                    </div>

                    <div style={{ height: 1, background: "var(--rule)" }} />

                    <div style={{ padding: "26px 0" }}>
                      <div className="k" style={{ marginBottom: 16 }}>Kesenjangan per titik</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
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
                              style={{ gap: 11, width: "100%", cursor: "pointer" }}
                            >
                              <span
                                style={{
                                  width: 100,
                                  fontSize: 12,
                                  fontWeight: aktif ? 600 : 400,
                                  color: nilai === null ? "var(--ink-faint)" : aktif ? "var(--ink)" : "var(--ink-2)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {pointLabels.get(m.pointId) ?? `#${m.pointId}`}
                              </span>
                              {nilai === null ? (
                                <span className="pill" style={{ flex: 1, height: 14, background: "var(--paper-2)", border: "1px dashed var(--rule-strong)" }} />
                              ) : (
                                <span className="pill" style={{ flex: 1, height: 14, background: "var(--rule-soft)" }}>
                                  <span
                                    className="pill"
                                    style={{
                                      display: "block",
                                      width: `${Math.max(3, (nilai / stationMax) * 100)}%`,
                                      height: 14,
                                      background: aktif ? "var(--data)" : "var(--ink-2)",
                                    }}
                                  />
                                </span>
                              )}
                              <span
                                className="fig"
                                style={{ width: 100, textAlign: "right", fontSize: nilai === null ? 10.5 : 11, color: nilai === null ? "var(--ink-faint)" : undefined }}
                              >
                                {nilai === null ? "sampel tipis" : rupiah(nilai)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ height: 1, background: "var(--rule)" }} />

                    <div style={{ padding: "26px 0 4px" }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 15 }}>
                        <span className="k">Status kategori</span>
                        <span style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>data mock · permintaan vs gerai</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {categoryStatuses.length === 0 && (
                          <div style={{ fontSize: 12, color: "var(--ink-muted)", padding: "8px 2px" }}>
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
                              borderBottom: i < categoryStatuses.length - 1 ? "1px solid var(--rule)" : undefined,
                              cursor: "pointer",
                            }}
                          >
                            <span className="row" style={{ gap: 7, fontSize: 13, fontWeight: c.status === "kosong" ? 600 : 400 }}>
                              {categoryLabel(c.category)}
                              <span className={`category-status category-status-${c.status}`}>{c.status}</span>
                            </span>
                            <span className="fig" style={{ fontSize: 11.5, color: "var(--ink-2)" }}>
                              {persen(c.demand_share, 0)} · {c.gerai_count} gerai
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ flex: "none", padding: "16px 22px 20px", display: "flex", gap: 8, boxShadow: "0 -1px 0 var(--rule)" }}>
                <button className="b bs" style={{ flex: 1 }}>Tabel atribut</button>
                <button className="b bp" style={{ flex: 1 }}>Unduh brief</button>
              </div>
            </div>
          )}

          {tab === "copilot" && (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div className="sc" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 22px 12px" }}>
                <div className="row" style={{ gap: 8, marginBottom: 14 }}>
                  <span className="dot" style={{ background: "var(--data)" }} />
                  <span className="k">Tanya data peta</span>
                </div>

                {/* User's question — right-aligned, solid ink bubble. */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: "82%" }}>
                    <div className="k" style={{ textAlign: "right", color: "var(--ink-faint)", marginBottom: 4 }}>Kamu</div>
                    <div
                      style={{ borderRadius: "var(--r-md)", borderBottomRightRadius: 4, background: "var(--ink)", padding: "11px 15px", fontSize: 13, color: "var(--surface)" }}
                    >
                      simpul mana yang kekurangan gerai apotek pagi hari?
                    </div>
                  </div>
                </div>

                {/* AI's answer — left-aligned, neutral bubble with a small
                   sparkle avatar, so the two speakers are never ambiguous.
                   Isinya masih contoh: copilot baru tersambung di Fase 3.6. */}
                {showCopilotResult && (
                  <div className="row" style={{ gap: 8, alignItems: "flex-start", marginTop: 12 }}>
                    <span
                      style={{ width: 22, height: 22, borderRadius: 999, background: "var(--data-wash)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 17 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--data)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
                      </svg>
                    </span>
                    <div style={{ maxWidth: "82%" }}>
                      <div className="k" style={{ color: "var(--ink-faint)", marginBottom: 4 }}>Asisten data</div>
                      <div style={{ borderRadius: "var(--r-md)", borderTopLeftRadius: 4, background: "var(--paper-2)", padding: "16px 18px" }}>
                        <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                          2 dari 3 simpul. Permintaan apotek di kawasan <b>Stasiun B</b> terbaca 37% tanpa satu pun gerai di dalam stasiun.
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                          <span className="chip" style={{ background: "var(--data-wash)", borderColor: "transparent", color: "var(--data)" }}>Lapisan → Kategori hilang</span>
                          <span className="chip" style={{ background: "var(--data-wash)", borderColor: "transparent", color: "var(--data)" }}>
                            Kategori → {categoryLabel(activeCategory)}
                          </span>
                          <span className="chip" style={{ background: "var(--data-wash)", borderColor: "transparent", color: "var(--data)" }}>
                            Slot → {slotLabel(activeSlot)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "var(--ink-muted)", marginTop: 14 }}>
                          Setiap jawaban mengubah lapisan peta, dan menyebut slot waktu yang dipakai. Tidak ada angka di luar slot yang dicacah.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="k" style={{ margin: "20px 0 10px" }}>Pertanyaan lain</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {QUESTIONS.map((q) => (
                    <button
                      type="button"
                      key={q}
                      onClick={() => setShowCopilotResult(true)}
                      className="lyr btn-reset"
                      style={{ border: "1px solid var(--rule)", borderRadius: "var(--r-md)", width: "100%", padding: "10px 15px", fontSize: 12.5 }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: "none", padding: "12px 16px 18px", boxShadow: "0 -1px 0 var(--rule)" }}>
                <div className="pill row" style={{ gap: 10, border: "1px solid var(--rule)", padding: "5px 5px 5px 16px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--data)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
                  </svg>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--ink-faint)" }}>tanya tentang simpul ini…</span>
                  <button onClick={() => setShowCopilotResult(true)} className="b bp" style={{ padding: "9px 16px", fontSize: 12 }}>
                    Tanya
                  </button>
                </div>
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
              style={{ width: "100%", maxWidth: 700, background: "var(--surface)", borderRadius: "var(--r-md)", boxShadow: "var(--shadow-lift)", overflow: "hidden" }}
            >
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", padding: "24px 26px 20px" }}>
                <div>
                  <div className="k" style={{ marginBottom: 8 }}>
                    Panel transparansi · {pointLabels.get(selectedPoint.point_id) ?? "titik"}
                  </div>
                  <div id="transparansi-judul" style={{ font: "800 21px/1.15 var(--font-inter)", letterSpacing: "-.015em" }}>
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div style={{ display: "flex", gap: 22, padding: "0 26px 26px" }}>
                <div style={{ width: 230, flex: "none" }}>
                  <div className="k" style={{ marginBottom: 9 }}>Foto sumber · data mock</div>
                  <div style={{ height: 206, borderRadius: "var(--r-md)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1.5, color: "var(--ink-faint)", textAlign: "center", padding: "0 16px" }}>
                    {selectedEvidence?.photo_label ?? "Foto sumber belum tersedia"}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--paper-2)", boxShadow: "0 0 0 2px var(--data)" }} />
                    <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--paper-2)" }} />
                    <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: "var(--paper-2)" }} />
                    <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", border: "1.5px dashed var(--rule-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--ink-faint)" }}>
                      +{Math.max(0, selectedPoint.evidence.struk_terbaca - 3)}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="k" style={{ marginBottom: 9 }}>Hasil baca AI</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderRadius: "var(--r-md) var(--r-md) 0 0", background: "var(--data-wash)", fontSize: 12 }}>
                      <span style={{ color: "var(--ink-muted)" }}>Kategori (dinormalisasi)</span>
                      <span>
                        {activeCategory === ALL_CATEGORIES
                          ? "seluruh kategori"
                          : categoryLabel(activeCategory)}
                      </span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", background: "var(--data-wash)", fontSize: 12 }}>
                      <span style={{ color: "var(--ink-muted)" }}>Slot yang dicacah</span>
                      <span>
                        {SLOTS.find((s) => s.key === activeSlot)?.jam ?? slotLabel(activeSlot)}
                      </span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "12px 14px", borderRadius: "0 0 var(--r-md) var(--r-md)", background: "var(--data-wash)", fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>Jumlah dibayarkan</span>
                      <span className="fig" style={{ fontWeight: 700, color: "var(--data)" }}>{rupiah(nilaiV)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <div style={{ flex: 1, borderRadius: "var(--r-md)", background: "var(--paper-2)", padding: 14 }}>
                      <div className="k" style={{ fontSize: 9, marginBottom: 7 }}>Keyakinan</div>
                      <div className="fig" style={{ font: "700 18px/1 var(--font-mono)" }}>
                        {desimal(selectedEvidence?.confidence ?? selectedPoint.confidence)}
                      </div>
                      <div className="pill" style={{ height: 5, background: "var(--rule-soft)", marginTop: 9 }}>
                        <div
                          className="pill"
                          style={{ width: `${(selectedEvidence?.confidence ?? selectedPoint.confidence) * 100}%`, height: 5, background: "var(--data)" }}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1, borderRadius: "var(--r-md)", background: "var(--paper-2)", padding: 14 }}>
                      <div className="k" style={{ fontSize: 9, marginBottom: 7 }}>Cakupan</div>
                      <div className="fig" style={{ font: "700 18px/1 var(--font-mono)" }}>
                        {selectedEvidence?.receipt_readable ?? selectedPoint.evidence.struk_terbaca} / {selectedEvidence?.receipt_total ?? selectedPoint.evidence.struk_total}
                      </div>
                      <div style={{ fontSize: 10, lineHeight: 1.4, color: "var(--ink-muted)", marginTop: 6 }}>
                        struk terbaca · {selectedEvidence?.receipt_ambiguous ?? selectedPoint.evidence.struk_ambigu} ambigu dikeluarkan
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 10, alignItems: "flex-start", marginTop: 12, borderRadius: "var(--r-md)", background: "var(--data-wash)", padding: "13px 15px", fontSize: 11.5, lineHeight: 1.55 }}>
                    <span className="dot" style={{ background: "var(--data)", marginTop: 5 }} />
                    {selectedMetric.sampelTipis ? (
                      <span>
                        Sampel kategori ini masih di bawah ambang{" "}
                        {selectedPoint.sample_meta.gerai_count} gerai ×{" "}
                        {selectedPoint.sample_meta.blok_count} blok, jadi nilainya{" "}
                        <b>{TIDAK_DIESTIMASI}</b> dan titiknya ditandai pada lapisan kepercayaan data.
                      </span>
                    ) : (
                      <span>
                        Dihitung dari {selectedPoint.evidence.struk_terbaca} struk pada{" "}
                        {selectedPoint.sample_meta.gerai_count} gerai ×{" "}
                        {selectedPoint.sample_meta.blok_count} blok pencacahan —
                        memenuhi ambang minimum proposal §5.2.
                      </span>
                    )}
                  </div>
                  {selectedSlotRow && (
                    <div className="fig" style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 10 }}>
                      slot {slotLabel(activeSlot)} · gap {rupiahRingkas(selectedSlotRow.gap.p50)} ·
                      kepercayaan {desimal(selectedPoint.confidence)}
                    </div>
                  )}
                  {selectedEvidence && (
                    <dl className="evidence-meta">
                      <div><dt>Jenis bukti</dt><dd>{selectedEvidence.types.join(" · ")}</dd></div>
                      <div><dt>Dataset</dt><dd>{selectedEvidence.dataset}</dd></div>
                      <div><dt>Waktu survei</dt><dd>{evidenceDate} WIB</dd></div>
                      <div><dt>Sumber</dt><dd>{selectedEvidence.sources.join(" · ")}</dd></div>
                      <div className="evidence-mock"><dt>Status</dt><dd>Data mock untuk demonstrasi antarmuka</dd></div>
                    </dl>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {showComparison && analytics && stations && demo && (
          <ComparisonDialog
            stations={stations}
            analytics={analytics}
            statuses={demo.category_statuses}
            activeSlot={activeSlot}
            activeCategory={activeCategory}
            onClose={() => setShowComparison(false)}
            onOpenStation={(target) => {
              if (target.longitude === undefined || target.latitude === undefined) return;
              setStationTarget({ longitude: target.longitude, latitude: target.latitude });
              setPilihanTitik(analytics.points.find((point) => point.station_id === target.id)?.point_id ?? null);
              setSelectedRetail(null);
              setShowComparison(false);
            }}
          />
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
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, pointerEvents: "none" }}
      >
        <NavBar
          active="peta"
          cta={
            <div className="row" style={{ gap: 10 }}>
              <button type="button" className="b bs" onClick={() => setShowComparison(true)}>Bandingkan</button>
              <button className="b bp">Brief PDF</button>
            </div>
          }
        />
      </div>
    </div>
  );
}
