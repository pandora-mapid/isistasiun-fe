"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "./NavBar";
import { MapCanvas } from "./MapCanvas";
import {
  biggestGapPoint,
  confidenceDomainOf,
  domainOf,
  findPoint,
  metricsFor,
  missingCategories,
  pointsOfStation,
  posisiDalamRentang,
  slotOf,
  type PointMetric,
} from "@/lib/analytics/select";
import {
  ALL_CATEGORIES,
  CATEGORIES,
  DEFAULT_SLOT,
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
 */
const LAYER_ROWS: LayerRow[] = [
  { key: "gap", label: "Kesenjangan belanja", dot: "#1D4ED8", tint: "rgba(29,78,216,.1)" },
  { key: "potensi", label: "Potensi belanja", dot: "#475569", tint: "rgba(71,85,105,.1)" },
  { key: "kepercayaan", label: "Kepercayaan data", dot: "#CBD5E1", tint: "rgba(29,78,216,.08)" },
  { key: "kategori-hilang", label: "Kategori hilang", dot: "#60A5FA", tint: "rgba(96,165,250,.12)" },
  { key: "arus", label: "Arus pintu stasiun", dot: "#2563EB", tint: "rgba(37,99,235,.1)" },
  { key: "sewa", label: "Indeks sewa / arus", dot: "#334155", tint: "rgba(51,65,85,.1)" },
  { key: "event", label: "Event & aktivasi", dot: "#94A3B8", tint: "rgba(148,163,184,.14)" },
];

/** Baris yang benar-benar menggerakkan peta. */
const LAYER_TERSEDIA = LAYER_ROWS.filter((r) => r.key in LAYER_GROUPS);
const DEFAULT_ACTIVE_LAYERS = ["gap", "kepercayaan"];

/** Warna titik kategori pada chip — murni hiasan, sepadan dengan legenda. */
const CATEGORY_DOT: Record<string, string> = {
  fnb: "#1D4ED8",
  ritel: "#475569",
  apotek: "#2563EB",
  jasa: "#2563EB",
  lainnya: "#475569",
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
  color: "#475569",
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
  background: "rgba(15,23,42,.12)",
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
  background: "#CBD5E1",
};

const QUESTIONS = [
  "pintu mana yang gapnya paling besar sore hari?",
  "bandingkan Stasiun B dengan Stasiun C",
  "kawasan mana yang sampelnya masih tipis?",
];

export function PetaScreen() {
  const { points, isochrones, analytics, stations, error } = usePetaData();

  const [tab, setTab] = useState<"brief" | "copilot">("brief");
  const [layersOpen, setLayersOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState<string[]>(DEFAULT_ACTIVE_LAYERS);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [activeCatchment, setActiveCatchment] = useState<number>(5);
  const [activeSlot, setActiveSlot] = useState<SlotKey>(DEFAULT_SLOT);
  const [showTransparansi, setShowTransparansi] = useState(false);
  const [showCopilotResult, setShowCopilotResult] = useState(true);
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

  const potensiDomain = useMemo(
    () =>
      metrics.size
        ? domainOf(metrics.values(), (m) => m.potensi)
        : DOMAIN_AWAL,
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
        potensi: m.potensi.p50 ?? 0,
        sampel_tipis: m.sampelTipis,
        confidence: m.confidence,
      });
    }
    return out;
  }, [metrics]);

  /** Nama tiap titik, diambil dari geometri (bukan dari hasil analisis). */
  const pointLabels = useMemo(() => {
    const out = new Map<number, string>();
    for (const f of points?.features ?? []) {
      out.set(f.properties.id, f.properties.point_label);
    }
    return out;
  }, [points]);

  const stationNames = useMemo(() => {
    const out = new Map<number, string>();
    for (const f of points?.features ?? []) {
      out.set(f.properties.station_id, f.properties.station_name);
    }
    return out;
  }, [points]);

  const visibleLayers = useMemo(
    () => activeLayers.flatMap((key) => LAYER_GROUPS[key] ?? []),
    [activeLayers],
  );

  // Tampilan awal jatuh ke titik dengan kesenjangan terbesar — itu yang paling
  // pantas dilihat lebih dulu, dan menghindari panel kosong saat halaman buka.
  const selectedPointId =
    pilihanTitik === undefined
      ? analytics
        ? biggestGapPoint(analytics)
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
  const kategoriHilang = selectedPoint
    ? missingCategories(selectedPoint, activeSlot).slice(0, 3)
    : [];
  const station = stations?.find((s) => s.id === selectedPoint?.station_id);

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
      className="page-canvas"
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <NavBar
        active="peta"
        cta={
          <div className="row" style={{ gap: 10 }}>
            <button className="b bs">Bandingkan</button>
            <button className="b bp">Brief PDF</button>
          </div>
        }
      />
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          background: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {/* Peta sungguhan. Kanvas mengisi kotak berposisi relative ini,
           dan seluruh panel di bawah melayang di atasnya. */}
        <MapCanvas
          points={points}
          isochrones={isochrones}
          featureStates={featureStates}
          gapDomain={gapDomain}
          potensiDomain={potensiDomain}
          confidenceDomain={confidenceDomain}
          catchmentMinutes={activeCatchment}
          visibleLayers={visibleLayers}
          selectedPointId={selectedPointId}
          onSelectPoint={setPilihanTitik}
          dataError={error}
          onScaleChange={handleScale}
        />

        <div
          className="row"
          style={{
            position: "absolute",
            left: 24,
            bottom: 132,
            gap: 14,
            alignItems: "stretch",
            padding: "10px 16px 12px",
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
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
                        boxShadow: "0 0 0 1px rgba(15,23,42,.14)",
                        flex: "none",
                      }}
                    />
                  );
                })}
              </span>
              <span className="mono" style={{ ...LEGENDA_TEKS, fontSize: 9.5, color: "#94A3B8" }}>
                {rupiahRingkas(gapDomain.min)} → {rupiahRingkas(gapDomain.max)}
              </span>
            </span>
          </span>

          <span style={LEGENDA_SEKAT} />

          <span style={LEGENDA_GRUP}>
            <span className="k">Mutu data</span>
            <span className="row" style={{ gap: 14 }}>
              <span className="row" style={{ ...LEGENDA_TEKS, gap: 6 }}>
                <span
                  className="dot"
                  title="tidak diestimasi — sampel di bawah 3 gerai × 2 blok"
                  style={{ background: "#fff", width: 12, height: 12, boxShadow: "0 0 0 1.5px #94A3B8" }}
                />
                Sampel tipis
              </span>
              <span className="row" style={{ ...LEGENDA_TEKS, gap: 8 }}>
                <span
                  title="halo makin tebal berarti kepercayaan makin rendah"
                  style={{ width: 12, height: 12, borderRadius: 999, background: "#fff", boxShadow: "0 0 0 1.5px #fff, 0 0 0 4.5px rgba(100,116,139,.55)", flex: "none", marginLeft: 3 }}
                />
                Kepercayaan rendah
              </span>
            </span>
          </span>

          <span style={LEGENDA_SEKAT} />

          <span style={LEGENDA_GRUP}>
            <span className="k">Kawasan</span>
            <span className="row" style={{ ...LEGENDA_TEKS, gap: 7 }}>
              {/* Persegi, bukan bulatan: ini wilayah, bukan tempat. */}
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
                    <span style={{ position: "absolute", left: 0, top: 3, width: scaleBar.widthPx, height: 1.5, background: "#0F172A" }} />
                    <span style={{ position: "absolute", left: 0, top: 0, width: 1.5, height: 7, background: "#0F172A" }} />
                    <span style={{ position: "absolute", left: scaleBar.widthPx - 1.5, top: 0, width: 1.5, height: 7, background: "#0F172A" }} />
                  </>
                )}
              </span>
              <span className="mono" style={{ ...LEGENDA_TEKS, fontSize: 9.5, color: "#64748B" }}>
                {scaleBar ? jarak(scaleBar.meters) : "—"}
              </span>
            </span>
          </span>
        </div>

        <div
          className="mono"
          style={{ position: "absolute", left: 24, bottom: 206, fontSize: 10.5, color: "rgba(15,23,42,.45)" }}
        >
          {analytics
            ? `data contoh · pipeline ${analytics.pipeline_version} · ${
                analytics.day_type === "weekday" ? "hari kerja" : "akhir pekan"
              } · dibuat ${analytics.generated_at.slice(0, 10)}`
            : "memuat data contoh…"}
        </div>

        <div
          className="glass"
          style={{ position: "absolute", left: 24, right: 462, bottom: 24, borderRadius: 14, border: "1px solid #E2E8F0", padding: "14px 18px 16px" }}
        >
          <div className="row" style={{ gap: 10, marginBottom: 11 }}>
            <span className="k">Slot waktu · hari kerja</span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
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
                      background: active ? "#1D4ED8" : "#F1F5F9",
                      color: active ? "#fff" : "#475569",
                      font: `${active ? 600 : 500} 12px/1 var(--font-inter)`,
                      boxShadow: active ? "0 6px 16px rgba(29,78,216,.2)" : "none",
                      borderRadius: 999,
                    }}
                  >
                    {slot.label}
                    {tipis && (
                      <span className="mono" style={{ opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>
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
              style={{ width: 1, height: 22, background: "rgba(15,23,42,.12)", margin: "0 6px", flex: "none" }}
            />
            <span className="row" style={{ gap: 8, flex: "none" }}>
              <span className="k">Pembanding</span>
              <span
                className="pill"
                title="satu sampel pembanding di akhir pekan — dijanjikan proposal, belum dicacah"
                style={{ padding: "9px 16px", border: "1.5px dashed #CBD5E1", background: "#E2E8F0", color: "#64748B", font: "500 12px/1 var(--font-inter)", cursor: "not-allowed" }}
              >
                Akhir pekan
              </span>
            </span>
          </div>
        </div>

        <div
          className="glass"
          style={{ position: "absolute", right: 24, top: 24, bottom: 24, width: 414, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <div style={{ flex: "none", padding: "14px 14px 12px" }}>
            <div className="row pill" style={{ position: "relative", background: "#F1F5F9", padding: 4 }}>
              <div
                className="pill"
                style={{
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  width: 186,
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(15,23,42,.1)",
                  transition: "left .18s cubic-bezier(.4,0,.2,1)",
                  left: tabX,
                }}
              />
              <button
                onClick={() => setTab("brief")}
                style={{ all: "unset", position: "relative", flex: 1, textAlign: "center", padding: "9px 0", font: "600 12.5px/1 var(--font-inter)", color: "#0F172A", cursor: "pointer" }}
              >
                Ringkasan
              </button>
              <button
                onClick={() => setTab("copilot")}
                style={{ all: "unset", position: "relative", flex: 1, textAlign: "center", padding: "9px 0", font: "600 12.5px/1 var(--font-inter)", color: "#0F172A", cursor: "pointer" }}
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
                    <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 12 }}>
                      {selectedPoint
                        ? `${pointLabels.get(selectedPoint.point_id) ?? "titik"} · ${
                            station ? `kawasan ${station.typology}` : "kawasan"
                          } · ${station?.point_count ?? stationMetrics.length} titik`
                        : "klik salah satu titik di peta untuk membuka ringkasannya"}
                    </div>
                  </div>
                  {selectedPoint && (
                    <div className="ic" onClick={() => setPilihanTitik(null)} title="lepas pilihan">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="sc" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 22px 8px" }}>
                <div style={{ borderRadius: 12, background: "#F1F5F9", marginBottom: 26, overflow: "hidden" }}>
                  <div
                    onClick={() => setLayersOpen((v) => !v)}
                    className="row layers-toggle"
                    style={{ gap: 10, padding: "13px 15px", cursor: "pointer" }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1D4ED8"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flex: "none", transition: "transform .18s cubic-bezier(.4,0,.2,1)", transform: `rotate(${chev}deg)` }}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <span className="k" style={{ flex: 1, color: "#1D4ED8" }}>Lapisan &amp; filter</span>
                    <span className="mono" style={{ fontSize: 10.5, color: "#94A3B8" }}>{layerCount}</span>
                  </div>

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
                      <span style={{ width: 1, height: 14, background: "rgba(15,23,42,.14)", flex: "none" }} />
                      <span className="mono" style={{ fontSize: 11.5, color: "#64748B", flex: "none" }}>
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
                            <div
                              key={r.key}
                              onClick={() => toggleLayer(r.key)}
                              className="lyr"
                              title={
                                tersedia
                                  ? undefined
                                  : "lapisan ini belum punya data — lihat ROADMAP §6"
                              }
                              style={{
                                ...(on ? { background: r.tint, color: "#0F172A", fontWeight: 600 } : {}),
                                ...(tersedia
                                  ? {}
                                  : { cursor: "not-allowed", color: "#94A3B8" }),
                              }}
                            >
                              <span
                                className="dot"
                                style={{ background: tersedia ? r.dot : "#E2E8F0" }}
                              />
                              <span style={{ flex: 1 }}>{r.label}</span>
                              {!tersedia && (
                                <span className="mono" style={{ fontSize: 9.5, color: "#94A3B8" }}>
                                  belum ada data
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="k" style={{ margin: "18px 0 10px" }}>Kategori usaha</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[{ key: ALL_CATEGORIES, label: "Semua" }, ...CATEGORIES].map((c) => {
                          const active = activeCategory === c.key;
                          const dot = CATEGORY_DOT[c.key];
                          return (
                            <span
                              key={c.key}
                              className="chip"
                              onClick={() => setActiveCategory(c.key as CategoryFilter)}
                              style={active ? { background: "#0F172A", color: "#fff", borderColor: "#0F172A" } : undefined}
                            >
                              {dot && <span className="dot" style={{ background: dot }} />}
                              {c.label}
                            </span>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "#94A3B8", marginTop: 8 }}>
                        Kategori dan slot tidak menyembunyikan titik — keduanya
                        mengubah warna dan ukurannya, supaya jumlah titik yang
                        dibandingkan selalu sama.
                      </div>

                      <div className="k" style={{ margin: "18px 0 10px" }}>Kawasan tangkapan</div>
                      <div className="row pill" style={{ background: "rgba(255,255,255,.8)", padding: 3 }}>
                        {CATCHMENT_MINUTES.map((m) => {
                          const active = activeCatchment === m;
                          return (
                            <span
                              key={m}
                              onClick={() => setActiveCatchment(m)}
                              className="pill"
                              style={{
                                flex: 1,
                                textAlign: "center",
                                padding: "8px 0",
                                fontSize: 12,
                                fontWeight: active ? 600 : 400,
                                background: active ? "#0F172A" : "transparent",
                                color: active ? "#fff" : "#475569",
                                cursor: "pointer",
                              }}
                            >
                              {m} mnt
                            </span>
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
                      <div className="mono row" style={{ justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginTop: 6 }}>
                        <span>{rupiah(gapDomain.min)}</span>
                        <span>{rupiah(gapDomain.max)}</span>
                      </div>
                      <div className="row" style={{ alignItems: "flex-start", gap: 9, marginTop: 12 }}>
                        <span style={{ width: 13, height: 13, borderRadius: 12, border: "1.5px dashed #94A3B8", flex: "none", marginTop: 1 }} />
                        <span style={{ fontSize: 11, lineHeight: 1.45, color: "#64748B" }}>
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
                  <div style={{ borderRadius: 12, padding: 24, background: "#EEF2F6", fontSize: 12.5, lineHeight: 1.6, color: "#64748B" }}>
                    Belum ada titik yang dipilih. Klik salah satu lingkaran di
                    peta — ukurannya mengikuti besar kesenjangan pada slot dan
                    kategori yang sedang aktif.
                  </div>
                )}

                {selectedMetric && (
                  <>
                    <div style={{ borderRadius: 12, padding: 24, background: "#EEF2F6" }}>
                      <div className="k" style={{ color: "#1D4ED8", marginBottom: 12 }}>
                        Kesenjangan belanja
                        {activeCategory !== ALL_CATEGORIES && ` · ${categoryLabel(activeCategory)}`}
                      </div>
                      {selectedMetric.gap.p50 === null ? (
                        <>
                          <div className="mono" style={{ fontWeight: 700, fontSize: 22, lineHeight: 1.15, color: "#64748B" }}>
                            Tidak diestimasi
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 9 }}>
                            sampelnya belum memenuhi ambang 3 gerai × 2 blok —
                            titik ini tidak dibaca aman maupun bermasalah
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mono" style={{ fontWeight: 700, fontSize: 25, lineHeight: 1.15, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>
                            {rupiah(selectedMetric.gap.p10)} – {ribuan(selectedMetric.gap.p90 ?? 0)}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 9 }}>
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
                            <div className="pill" style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.08)" }} />
                            <div
                              className="pill"
                              style={{
                                position: "absolute",
                                left: 0,
                                width: `${posisiDalamRentang(selectedMetric.gap, selectedMetric.gap.p50) * 100}%`,
                                top: 0,
                                bottom: 0,
                                background: "#60A5FA",
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
                                background: "#fff",
                                boxShadow: "0 2px 8px rgba(15,23,42,.16)",
                                marginLeft: -9,
                              }}
                            />
                          </div>
                          <div className="mono row" style={{ justifyContent: "space-between", fontSize: 10, color: "#94A3B8" }}>
                            <span>P10 {rupiahRingkas(selectedMetric.gap.p10)}</span>
                            <span>median {rupiahRingkas(selectedMetric.gap.p50)}</span>
                            <span>P90 {rupiahRingkas(selectedMetric.gap.p90)}</span>
                          </div>
                        </>
                      )}
                      <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "#64748B", marginTop: 14 }}>
                        Batas atas peluang pendapatan non-tiket, <b style={{ color: "#0F172A" }}>bukan</b> pendapatan yang pasti diperoleh.
                      </div>
                    </div>

                    <div style={{ padding: "28px 0 20px" }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                        <span className="k">Uraian F × E × C × V</span>
                        <Link href="/metodologi" style={{ fontSize: 11.5, fontWeight: 600 }}>Metodologi →</Link>
                      </div>
                      <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                        <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                          <span style={{ fontSize: 12.5, color: "#475569" }}>F — arus pintu</span>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                            {selectedMetric.variables ? ribuan(selectedMetric.variables.F) : "—"}{" "}
                            <span style={{ color: "#94A3B8", fontWeight: 400 }}>org/jam</span>
                          </span>
                        </div>
                        <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                          <span style={{ fontSize: 12.5, color: "#475569" }}>E — entry ratio</span>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                            {persen(selectedMetric.variables?.E)}
                          </span>
                        </div>
                        <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid #E2E8F0" }}>
                          <span style={{ fontSize: 12.5, color: "#475569" }}>C — konversi</span>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                            {persen(selectedMetric.variables?.C, 0)}
                          </span>
                        </div>
                        <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", background: "#EEF2F6" }}>
                          <span style={{ fontSize: 12.5, color: "#475569" }}>
                            V — nilai transaksi{" "}
                            <span style={{ fontSize: 9.5, color: "#94A3B8" }}>
                              {activeCategory === ALL_CATEGORIES ? "AI" : `AI · ${categoryLabel(activeCategory)}`}
                            </span>
                          </span>
                          <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>
                            {rupiah(nilaiV)}
                          </span>
                        </div>
                      </div>
                      <div className="row" style={{ justifyContent: "space-between", marginTop: 14 }}>
                        <span className="mono" style={{ fontSize: 11.5, color: "#64748B" }}>
                          Potensi {rupiahRingkas(selectedMetric.potensi.p50)} − tertangkap{" "}
                          {rupiahRingkas(selectedMetric.tertangkap.p50)}
                        </span>
                        <button
                          onClick={() => setShowTransparansi(true)}
                          style={{ all: "unset", cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: "#1D4ED8" }}
                        >
                          Lihat bukti →
                        </button>
                      </div>
                    </div>

                    <div style={{ height: 1, background: "rgba(15,23,42,.1)" }} />

                    <div style={{ padding: "26px 0" }}>
                      <div className="k" style={{ marginBottom: 16 }}>Kesenjangan per titik</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                        {stationMetrics.map((m) => {
                          const aktif = m.pointId === selectedPointId;
                          const nilai = m.gap.p50;
                          return (
                            <div
                              key={m.pointId}
                              className="row"
                              onClick={() => setPilihanTitik(m.pointId)}
                              style={{ gap: 11, cursor: "pointer" }}
                            >
                              <span
                                style={{
                                  width: 92,
                                  fontSize: 12,
                                  fontWeight: aktif ? 600 : 400,
                                  color: nilai === null ? "#94A3B8" : aktif ? "#0F172A" : "#475569",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {pointLabels.get(m.pointId) ?? `#${m.pointId}`}
                              </span>
                              {nilai === null ? (
                                <span className="pill" style={{ flex: 1, height: 14, background: "#F1F5F9", border: "1px dashed #CBD5E1" }} />
                              ) : (
                                <span className="pill" style={{ flex: 1, height: 14, background: "rgba(15,23,42,.08)" }}>
                                  <span
                                    className="pill"
                                    style={{
                                      display: "block",
                                      width: `${Math.max(3, (nilai / stationMax) * 100)}%`,
                                      height: 14,
                                      background: aktif ? "#1D4ED8" : "#475569",
                                    }}
                                  />
                                </span>
                              )}
                              <span
                                className="mono"
                                style={{ width: 92, textAlign: "right", fontSize: nilai === null ? 10.5 : 11, color: nilai === null ? "#94A3B8" : undefined }}
                              >
                                {nilai === null ? "sampel tipis" : rupiah(nilai)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ height: 1, background: "rgba(15,23,42,.1)" }} />

                    <div style={{ padding: "26px 0 4px" }}>
                      <div className="row" style={{ justifyContent: "space-between", marginBottom: 15 }}>
                        <span className="k">Kategori hilang</span>
                        <span style={{ fontSize: 10.5, color: "#94A3B8" }}>permintaan kawasan vs gerai</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {kategoriHilang.length === 0 && (
                          <div style={{ fontSize: 12, color: "#64748B", padding: "8px 2px" }}>
                            Seluruh kategori sudah memenuhi ambang 3 gerai pada slot ini.
                          </div>
                        )}
                        {kategoriHilang.map((c, i) => (
                          <div
                            key={c.category}
                            className="row"
                            onClick={() => setActiveCategory(c.category)}
                            style={{
                              justifyContent: "space-between",
                              padding: "10px 2px",
                              borderBottom: i < kategoriHilang.length - 1 ? "1px solid #E2E8F0" : undefined,
                              cursor: "pointer",
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400 }}>
                              {categoryLabel(c.category)}
                            </span>
                            <span className="mono" style={{ fontSize: 11.5, color: "#475569" }}>
                              {persen(c.demand_share, 0)} · {c.gerai_count} gerai
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ flex: "none", padding: "16px 22px 20px", display: "flex", gap: 8, boxShadow: "0 -1px 0 rgba(15,23,42,.1)" }}>
                <button className="b bs" style={{ flex: 1 }}>Tabel atribut</button>
                <button className="b bp" style={{ flex: 1 }}>Unduh brief</button>
              </div>
            </div>
          )}

          {tab === "copilot" && (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div className="sc" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 22px 12px" }}>
                <div className="row" style={{ gap: 8, marginBottom: 14 }}>
                  <span className="dot" style={{ background: "#1D4ED8" }} />
                  <span className="k" style={{ color: "#1D4ED8" }}>Tanya data peta</span>
                </div>

                {/* User's question — right-aligned, solid accent bubble. */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: "82%" }}>
                    <div className="k" style={{ textAlign: "right", color: "#94A3B8", marginBottom: 4 }}>Kamu</div>
                    <div
                      style={{ borderRadius: 12, borderBottomRightRadius: 4, background: "#1D4ED8", padding: "11px 15px", fontSize: 13, color: "#fff" }}
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
                      style={{ width: 22, height: 22, borderRadius: 999, background: "rgba(29,78,216,.12)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 17 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
                      </svg>
                    </span>
                    <div style={{ maxWidth: "82%" }}>
                      <div className="k" style={{ color: "#94A3B8", marginBottom: 4 }}>Asisten data</div>
                      <div style={{ borderRadius: 12, borderTopLeftRadius: 4, background: "#EEF2F6", padding: "16px 18px" }}>
                        <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                          2 dari 3 simpul. Permintaan apotek di kawasan <b>Stasiun B</b> terbaca 37% tanpa satu pun gerai di dalam stasiun.
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                          <span className="chip" style={{ background: "rgba(29,78,216,.1)", borderColor: "transparent", color: "#1D4ED8" }}>Lapisan → Kategori hilang</span>
                          <span className="chip" style={{ background: "rgba(29,78,216,.1)", borderColor: "transparent", color: "#1D4ED8" }}>
                            Kategori → {categoryLabel(activeCategory)}
                          </span>
                          <span className="chip" style={{ background: "rgba(29,78,216,.1)", borderColor: "transparent", color: "#1D4ED8" }}>
                            Slot → {slotLabel(activeSlot)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#64748B", marginTop: 14 }}>
                          Setiap jawaban mengubah lapisan peta, dan menyebut slot waktu yang dipakai. Tidak ada angka di luar slot yang dicacah.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="k" style={{ margin: "20px 0 10px" }}>Pertanyaan lain</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {QUESTIONS.map((q) => (
                    <div
                      key={q}
                      onClick={() => setShowCopilotResult(true)}
                      className="lyr"
                      style={{ border: "1px solid rgba(15,23,42,.12)", borderRadius: 12, padding: "10px 15px", fontSize: 12.5 }}
                    >
                      {q}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: "none", padding: "12px 16px 18px", boxShadow: "0 -1px 0 rgba(15,23,42,.1)" }}>
                <div className="pill row" style={{ gap: 10, border: "1px solid rgba(15,23,42,.14)", padding: "5px 5px 5px 16px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
                  </svg>
                  <span style={{ flex: 1, fontSize: 13, color: "#94A3B8" }}>tanya tentang simpul ini…</span>
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
              background: "rgba(15,23,42,.55)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              zIndex: 30,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 700, background: "#fff", borderRadius: 12, boxShadow: "0 40px 100px rgba(15,23,42,.3)", overflow: "hidden" }}
            >
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", padding: "24px 26px 20px" }}>
                <div>
                  <div className="k" style={{ color: "#1D4ED8", marginBottom: 8 }}>
                    Panel transparansi · {pointLabels.get(selectedPoint.point_id) ?? "titik"}
                  </div>
                  <div style={{ font: "800 21px/1.15 var(--font-inter)", letterSpacing: "-.015em" }}>
                    Dari mana angka V = {rupiah(nilaiV)} berasal
                  </div>
                </div>
                <div className="ic" onClick={() => setShowTransparansi(false)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </div>
              </div>
              <div style={{ display: "flex", gap: 22, padding: "0 26px 26px" }}>
                <div style={{ width: 230, flex: "none" }}>
                  <div className="k" style={{ marginBottom: 9 }}>Foto asli · Struk Go</div>
                  <div style={{ height: 206, borderRadius: 12, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1.5, color: "#94A3B8", textAlign: "center", padding: "0 16px" }}>
                    Foto struk<br />identitas diredaksi
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F1F5F9", boxShadow: "0 0 0 2px #1D4ED8" }} />
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F1F5F9" }} />
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F1F5F9" }} />
                    <div style={{ width: 40, height: 40, borderRadius: 12, border: "1.5px dashed rgba(15,23,42,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#94A3B8" }}>
                      +{Math.max(0, selectedPoint.evidence.struk_terbaca - 3)}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="k" style={{ marginBottom: 9 }}>Hasil baca AI</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", borderRadius: "12px 12px 0 0", background: "#EEF2F6", fontSize: 12 }}>
                      <span style={{ color: "#64748B" }}>Kategori (dinormalisasi)</span>
                      <span>
                        {activeCategory === ALL_CATEGORIES
                          ? "seluruh kategori"
                          : categoryLabel(activeCategory)}
                      </span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "11px 14px", background: "#EEF2F6", fontSize: 12 }}>
                      <span style={{ color: "#64748B" }}>Slot yang dicacah</span>
                      <span>
                        {SLOTS.find((s) => s.key === activeSlot)?.jam ?? slotLabel(activeSlot)}
                      </span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", padding: "12px 14px", borderRadius: "0 0 12px 12px", background: "rgba(29,78,216,.1)", fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>Jumlah dibayarkan</span>
                      <span className="mono" style={{ fontWeight: 700, color: "#1D4ED8" }}>{rupiah(nilaiV)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <div style={{ flex: 1, borderRadius: 12, background: "#F1F5F9", padding: 14 }}>
                      <div className="k" style={{ fontSize: 9, marginBottom: 7 }}>Keyakinan</div>
                      <div className="mono" style={{ font: "700 18px/1 var(--font-inter)" }}>
                        {desimal(selectedPoint.confidence)}
                      </div>
                      <div className="pill" style={{ height: 5, background: "rgba(15,23,42,.1)", marginTop: 9 }}>
                        <div
                          className="pill"
                          style={{ width: `${selectedPoint.confidence * 100}%`, height: 5, background: "#1D4ED8" }}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1, borderRadius: 12, background: "#F1F5F9", padding: 14 }}>
                      <div className="k" style={{ fontSize: 9, marginBottom: 7 }}>Cakupan</div>
                      <div className="mono" style={{ font: "700 18px/1 var(--font-inter)" }}>
                        {selectedPoint.evidence.struk_terbaca} / {selectedPoint.evidence.struk_total}
                      </div>
                      <div style={{ fontSize: 10, lineHeight: 1.4, color: "#64748B", marginTop: 6 }}>
                        struk terbaca · {selectedPoint.evidence.struk_ambigu} ambigu dikeluarkan
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 10, alignItems: "flex-start", marginTop: 12, borderRadius: 12, background: "rgba(29,78,216,.08)", padding: "13px 15px", fontSize: 11.5, lineHeight: 1.55 }}>
                    <span className="dot" style={{ background: "#1D4ED8", marginTop: 5 }} />
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
                    <div className="mono" style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 10 }}>
                      slot {slotLabel(activeSlot)} · gap {rupiahRingkas(selectedSlotRow.gap.p50)} ·
                      kepercayaan {desimal(selectedPoint.confidence)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
