"use client";

import { useEffect, useRef, useState } from "react";

import {
  bandingkanSimpul,
  ringkasanSimpul,
  type BandingSimpul,
} from "@/lib/analytics/summary";
import { categoryLabel } from "@/lib/data/dimensions";
import { loadStationSummary } from "@/lib/data/source";
import type { CategoryKey, StationSummaryRow } from "@/lib/data/types";
import {
  desimal,
  persen,
  rentangRingkas,
  ribuan,
  rupiahRingkas,
} from "@/lib/format";

const BASIS_LABEL: Record<StationSummaryRow["basis"], string> = {
  "monte-carlo-simpul": "simulasi Monte Carlo setingkat simpul",
  "agregat-titik": "agregat titik (sementara, bukan simulasi)",
};

type Isi = { baris: StationSummaryRow[]; banding: BandingSimpul | null };

export function BandingSimpulOverlay({
  onClose,
  onOpenBrief,
}: {
  onClose: () => void;
  onOpenBrief: () => void;
}) {
  const [isi, setIsi] = useState<Isi | null>(null);
  const [gagal, setGagal] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let batal = false;
    loadStationSummary()
      .then((payload) => {
        if (batal) return;
        const baris = ringkasanSimpul(payload);
        setIsi({
          baris,
          banding:
            baris.length >= 2 ? bandingkanSimpul(baris[0], baris[1]) : null,
        });
      })
      .catch(() => !batal && setGagal(true));
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const baris = isi?.baris ?? [];
  const basis = baris[0]?.basis;
  const banding = isi?.banding;

  return (
    <div
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-surface-dark/70 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        className="bg-surface w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl shadow-[var(--shadow-lift)] border border-border-subtle overflow-hidden ring-1 ring-border-glass transform transition-all animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="banding-simpul-title"
      >
        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-border-subtle bg-surface sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="banding-simpul-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-text-primary m-0 p-0"
              >
                Analisis Penempatan Tenant
                {banding
                  ? `: ${banding.a.station_name} vs ${banding.b.station_name}`
                  : ""}
              </h2>
              <span className="sr-only">Ringkasan &amp; Bandingkan Simpul</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5 mb-0">
              Komparasi potensi daya serap ritel komuter &amp; arus pejalan kaki
              jam sibuk
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              ref={closeRef}
              aria-label="Tutup ringkasan simpul"
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
              type="button"
              onClick={onClose}
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable Modal Body Container */}
        <section className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar flex-1 bg-canvas-warm">
          {gagal && (
            <p className="p-8 text-center text-sm text-text-muted bg-surface rounded-xl border border-border-subtle">
              Ringkasan simpul gagal dimuat.
            </p>
          )}
          {!gagal && isi === null && (
            <p className="p-8 text-center text-sm text-text-muted bg-surface rounded-xl border border-border-subtle">
              Memuat intelligence simpul…
            </p>
          )}
          {!gagal && isi !== null && baris.length < 2 && (
            <p className="p-8 text-center text-sm text-text-muted bg-surface rounded-xl border border-border-subtle">
              Perbandingan membutuhkan dua simpul; saat ini baru ada{" "}
              {baris.length}.
            </p>
          )}

          {banding && (
            <>
              {/* Top Comparison Indicator Banner */}
              <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border-subtle shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Hub badges */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                  {/* Manggarai Station Tag */}
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-[var(--data)] shadow-2xs ring-2 ring-[var(--data-wash)] shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-base">
                          {banding.a.station_name}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--data-wash)] text-[var(--data)] border border-[var(--data-soft)]">
                          #1 Peluang Terbesar
                        </span>
                      </div>
                      <p className="text-xs text-text-muted m-0">
                        {banding.a.typology} • {banding.a.pintu_dicacah} titik
                        dicacah
                      </p>
                    </div>
                  </div>

                  {/* Separator VS */}
                  <span className="text-xs font-bold text-text-muted bg-surface-container px-2 py-1 rounded-md border border-border-subtle uppercase tracking-wider">
                    VS
                  </span>

                  {/* Sudirman Station Tag */}
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-[var(--data-mid)] shadow-2xs ring-2 ring-[var(--data-wash)] shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-base">
                          {banding.b.station_name}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--data-wash)] text-[var(--data)] border border-[var(--data-soft)]">
                          #2 Pembanding
                        </span>
                      </div>
                      <p className="text-xs text-text-muted m-0">
                        {banding.b.typology} • {banding.b.pintu_dicacah} titik
                        dicacah
                      </p>
                    </div>
                  </div>
                </div>

                {/* Highlight Metric Badge */}
                <div className="bg-surface-container-low border border-border-subtle rounded-xl px-4 py-2.5 flex items-center space-x-3 self-start md:self-auto">
                  <span className="text-xl sm:text-2xl font-black text-[var(--data)] tracking-tight">
                    {banding.gapRatio !== null
                      ? `${desimal(banding.gapRatio, 1)}×`
                      : "—"}
                  </span>
                  <div className="text-xs text-text-secondary font-medium leading-snug">
                    Kesenjangan belanja harian {banding.a.station_name}
                    <br />
                    <strong className="text-text-primary">
                      lebih tinggi signifikan
                    </strong>{" "}
                    dibanding {banding.b.station_name}
                  </div>
                </div>
              </div>

              {/* Main Comparative Grid: Metric Columns + Category Vertical Bars */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Kolom 1: Vertical Metric Charts (7 cols) */}
                <VerticalMetricCharts banding={banding} />

                {/* Kolom 2: Category Demand Vertical Bar Section (5 cols) */}
                <CategoryVerticalBarSection banding={banding} />
              </div>

              {/* Collapsible Details & Method Note */}
              <div className="pt-2 space-y-3">
                <details className="bg-surface rounded-xl border border-border-subtle px-5 py-3 text-xs text-text-secondary">
                  <summary className="font-semibold text-text-primary cursor-pointer select-none">
                    Lihat detail data pembanding (P10–P90, Potensi, Tertangkap)
                  </summary>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-border-subtle">
                    {[banding.a, banding.b].map((row) => (
                      <article
                        key={row.station_id}
                        className="p-3 bg-surface-container-low rounded-lg border border-border-subtle"
                      >
                        <h4 className="font-bold text-text-primary mb-2">
                          {row.station_name}
                        </h4>
                        <dl className="space-y-1 text-[11px]">
                          <div className="flex justify-between py-1 border-b border-border-subtle">
                            <dt className="text-text-muted">
                              Kesenjangan (P10–P90)
                            </dt>
                            <dd className="font-mono font-semibold text-text-primary">
                              {rentangRingkas(row.gap)}
                            </dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border-subtle">
                            <dt className="text-text-muted">Potensi</dt>
                            <dd className="font-mono font-semibold text-text-primary">
                              {rentangRingkas(row.potensi)}
                            </dd>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border-subtle">
                            <dt className="text-text-muted">Tertangkap</dt>
                            <dd className="font-mono font-semibold text-text-primary">
                              {rentangRingkas(row.tertangkap)}
                            </dd>
                          </div>
                          <div className="flex justify-between py-1">
                            <dt className="text-text-muted">
                              Kesenjangan titik puncak
                            </dt>
                            <dd className="font-mono font-semibold text-text-primary">
                              {row.peak ? rentangRingkas(row.peak.gap) : "—"}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                </details>

                <p className="text-[11px] text-text-muted text-center m-0">
                  Dasar angka: {basis ? BASIS_LABEL[basis] : "—"}. Rentang
                  P10–P90, bukan satu angka tunggal. Nilai rupiah adalah
                  estimasi dan tidak mengikuti filter peta yang sedang aktif.
                </p>
              </div>
            </>
          )}
        </section>

        {/* Modal Footer Actions */}
        <footer className="px-6 py-3.5 bg-surface-container-low border-t border-border-subtle flex flex-col-reverse sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onOpenBrief}
              className="px-4 py-2 font-semibold text-white bg-[var(--data)] border border-[var(--data)] rounded-lg shadow-2xs hover:brightness-95 transition-all cursor-pointer"
              type="button"
            >
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 font-medium text-text-secondary hover:text-text-primary bg-surface border border-outline-variant/60 rounded-lg shadow-2xs hover:bg-surface-container transition-colors cursor-pointer"
              type="button"
            >
              Tutup
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
}

/**
 * Kolom Kiri: 01 • Grafik Perbedaan Metrik (Vertical Column Charts)
 */
function VerticalMetricCharts({ banding }: { banding: BandingSimpul }) {
  const { a, b } = banding;

  // 1. Kesenjangan Belanja Harian (P50 & rentang)
  const gapA = a.gap.p50 ?? 0;
  const gapB = b.gap.p50 ?? 0;
  const maxGap = Math.max(gapA, gapB, 1);
  const gapDiff = gapA - gapB;
  const gapPct = gapB > 0 ? Math.round((gapDiff / gapB) * 100) : 0;

  // 2. Arus Pejalan Puncak (F)
  const arusA = a.peak?.variables?.F ?? 0;
  const arusB = b.peak?.variables?.F ?? 0;
  const maxArus = Math.max(arusA, arusB, 1);
  const arusDiff = arusA - arusB;
  const arusPct = arusB > 0 ? Math.round((arusDiff / arusB) * 100) : 0;

  // 3. Porsi Belanja Tertangkap (Capture Rate)
  const captureA = a.capture_rate ?? 0;
  const captureB = b.capture_rate ?? 0;
  const captureDiff = captureA - captureB;
  const absCaptureDiff = Math.abs(captureDiff);

  // 4. Keyakinan Data (Confidence)
  const confA = a.confidence ? (a.confidence.min + a.confidence.max) / 2 : 0;
  const confB = b.confidence ? (b.confidence.min + b.confidence.max) / 2 : 0;
  const confDiff = confB - confA;
  const higherConfStation = confDiff >= 0 ? b.station_name : a.station_name;
  const absConfDiff = Math.abs(confDiff);

  // Height ratios for vertical columns (compact max height 100px)
  const hGapA = Math.max(Math.round((gapA / maxGap) * 100), 20);
  const hGapB = Math.max(Math.round((gapB / maxGap) * 100), 20);

  const hArusA = Math.max(Math.round((arusA / maxArus) * 100), 20);
  const hArusB = Math.max(Math.round((arusB / maxArus) * 100), 20);

  return (
    <div className="lg:col-span-7 bg-surface rounded-xl p-5 border border-border-subtle shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[var(--data)] uppercase">
              01 • Grafik Perbedaan Metrik
            </span>
            <h3 className="text-base font-bold text-text-primary mt-0.5 mb-0">
              Komparasi Kunci Antarsimpul
            </h3>
            <p className="text-xs text-text-muted m-0">
              Perbedaan nilai tengah belanja, arus lalu lintas pejalan, dan
              reliabilitas data.
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[var(--data)] inline-block" />
              <span className="font-medium text-text-secondary">
                {a.station_name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[var(--data-mid)] inline-block" />
              <span className="font-medium text-text-secondary">
                {b.station_name}
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Column Chart 1: Kesenjangan Belanja Harian */}
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-border-subtle mb-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary m-0">
                Kesenjangan Belanja Harian (P50)
              </h4>
              <p className="text-[11px] text-text-muted m-0">
                Kesenjangan (P10–P90) · ruang permintaan harian yang belum
                terserap
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/30">
              +{rupiahRingkas(gapDiff)} (+{gapPct}%)
            </span>
          </div>

          {/* Vertical Column Bars Container */}
          <div className="flex items-end justify-center space-x-12 h-40 pt-2 pb-1 border-b border-border-subtle">
            {/* Manggarai Column */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-bold text-[var(--data)] mb-0.5 font-mono">
                {rupiahRingkas(gapA)}
              </span>
              <span className="text-[10px] text-text-muted mb-1 font-mono">
                P10–P90: {rentangRingkas(a.gap)}
              </span>
              <div
                style={{ height: `${hGapA}px` }}
                className="w-14 shrink-0 bg-gradient-to-t from-[var(--data)] to-[var(--data-mid)] rounded-t-lg shadow-2xs transition-all duration-300 group-hover:brightness-110 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 text-inverse-on-surface/40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-text-primary mt-1.5">
                {a.station_name}
              </span>
            </div>

            {/* Sudirman Column */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-bold text-[var(--data-mid)] mb-0.5 font-mono">
                {rupiahRingkas(gapB)}
              </span>
              <span className="text-[10px] text-text-muted mb-1 font-mono">
                P10–P90: {rentangRingkas(b.gap)}
              </span>
              <div
                style={{ height: `${hGapB}px` }}
                className="w-14 shrink-0 bg-gradient-to-t from-[var(--data-mid)] to-[var(--data-soft)] rounded-t-lg shadow-2xs transition-all duration-300 group-hover:brightness-110 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 text-inverse-on-surface/40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-text-primary mt-1.5">
                {b.station_name}
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Column Chart 2: Arus Pejalan Puncak */}
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-border-subtle">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary m-0">
                Arus Pejalan Puncak (F)
              </h4>
              <p className="text-[11px] text-text-muted m-0">
                Intensitas volume komuter pada titik tersibuk
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/30">
              +{ribuan(arusDiff)}/jam (+{arusPct}%)
            </span>
          </div>

          {/* Vertical Column Bars Container */}
          <div className="flex items-end justify-center space-x-12 h-40 pt-2 pb-1 border-b border-border-subtle">
            {/* Manggarai Column */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-bold text-[var(--data)] mb-0.5 font-mono">
                {ribuan(arusA)} /jam
              </span>
              <span className="text-[10px] text-text-muted mb-1">
                {a.peak?.point_label ?? "Titik Puncak"}
              </span>
              <div
                style={{ height: `${hArusA}px` }}
                className="w-14 shrink-0 bg-gradient-to-t from-[var(--data)] to-[var(--data-mid)] rounded-t-lg shadow-2xs transition-all duration-300 group-hover:brightness-110 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 text-inverse-on-surface/40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-text-primary mt-1.5">
                {a.station_name}
              </span>
            </div>

            {/* Sudirman Column */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-bold text-[var(--data-mid)] mb-0.5 font-mono">
                {ribuan(arusB)} /jam
              </span>
              <span className="text-[10px] text-text-muted mb-1">
                {b.peak?.point_label ?? "Titik Puncak"}
              </span>
              <div
                style={{ height: `${hArusB}px` }}
                className="w-14 shrink-0 bg-gradient-to-t from-[var(--data-mid)] to-[var(--data-soft)] rounded-t-lg shadow-2xs transition-all duration-300 group-hover:brightness-110 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 text-inverse-on-surface/40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-text-primary mt-1.5">
                {b.station_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Footnote Metrics: Porsi Tertangkap & Keyakinan Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 mt-2 border-t border-border-subtle">
        {/* Card 1: Porsi Tertangkap */}
        <div className="bg-surface-container-low/80 p-3 rounded-xl border border-border-subtle flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-text-muted shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m10 15 5-3-5-3v6z" />
              </svg>
              Porsi Tertangkap
            </span>
            <span className="text-[10px] font-bold text-[var(--data)] bg-[var(--data-wash)] border border-[var(--data-soft)] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              +{desimal(absCaptureDiff * 100, 1)}% pt
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface px-2.5 py-1.5 rounded-lg border border-border-subtle shadow-2xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-text-secondary truncate min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[var(--data)] shrink-0" />
                  <span className="truncate">{a.station_name}</span>
                </span>
                <span className="font-bold font-mono text-text-primary ml-1 shrink-0">
                  {persen(captureA)}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--data)] h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(8, captureA * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-surface px-2.5 py-1.5 rounded-lg border border-border-subtle shadow-2xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-text-secondary truncate min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[var(--data-mid)] shrink-0" />
                  <span className="truncate">{b.station_name}</span>
                </span>
                <span className="font-bold font-mono text-text-primary ml-1 shrink-0">
                  {persen(captureB)}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--data-mid)] h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(8, captureB * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Keyakinan Data */}
        <div className="bg-surface-container-low/80 p-3 rounded-xl border border-border-subtle flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-text-muted shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Keyakinan Data
            </span>
            <span className="text-[10px] font-bold text-[var(--data)] bg-[var(--data-wash)] border border-[var(--data-soft)] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {higherConfStation} +{desimal(absConfDiff * 100, 1)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface px-2.5 py-1.5 rounded-lg border border-border-subtle shadow-2xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-text-secondary truncate min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[var(--data)] shrink-0" />
                  <span className="truncate">{a.station_name}</span>
                </span>
                <span className="font-bold font-mono text-text-primary ml-1 shrink-0">
                  {persen(confA)}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--data)] h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(8, confA * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-surface px-2.5 py-1.5 rounded-lg border border-border-subtle shadow-2xs flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-medium text-text-secondary truncate min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[var(--data-mid)] shrink-0" />
                  <span className="truncate">{b.station_name}</span>
                </span>
                <span className="font-bold font-mono text-text-primary ml-1 shrink-0">
                  {persen(confB)}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--data-mid)] h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(8, confB * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Kolom Kanan: 02 • Komposisi & Peluang Kategori (Category Vertical Bar Columns & Highlights)
 */
function CategoryVerticalBarSection({ banding }: { banding: BandingSimpul }) {
  const { a, b } = banding;
  const stations = [a, b];

  const categoryKeys = Array.from(
    new Set(
      stations.flatMap((row) => row.composition.map((item) => item.category)),
    ),
  ).sort((catA, catB) => {
    const highest = (category: CategoryKey) =>
      Math.max(
        ...stations.map(
          (row) =>
            row.composition.find((item) => item.category === category)
              ?.demand_share ?? 0,
        ),
      );
    return highest(catB) - highest(catA);
  });

  return (
    <div className="lg:col-span-5 bg-surface rounded-xl p-5 border border-border-subtle shadow-2xs flex flex-col justify-between">
      <div>
        <div className="pb-3 mb-4 border-b border-border-subtle">
          <span className="text-[11px] font-bold tracking-wider text-[var(--data)] uppercase">
            02 • Komposisi &amp; Peluang Kategori
          </span>
          <h3 className="text-base font-bold text-text-primary mt-0.5 mb-0">
            Pangsa Permintaan vs Ketersediaan
          </h3>
          <p className="text-xs text-text-muted m-0">
            Perbandingan pangsa permintaan setiap kategori pada kedua simpul.
          </p>
        </div>

        {/* VERTICAL COMPARISON CHART BY CATEGORY */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-border-subtle">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2 font-medium">
            <span>Pangsa Permintaan (%)</span>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--data)]" />{" "}
              {a.station_name}
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[var(--data-mid)] ml-1" />{" "}
              {b.station_name}
            </div>
          </div>

          {/* 5 Category Vertical Bar Columns */}
          <div className="grid grid-cols-5 gap-2 h-44 pt-2 pb-1 border-b border-border-subtle items-end">
            {categoryKeys.map((cat) => {
              const compA = a.composition.find(
                (entry) => entry.category === cat,
              );
              const compB = b.composition.find(
                (entry) => entry.category === cat,
              );
              const shareA = compA?.demand_share ?? 0;
              const shareB = compB?.demand_share ?? 0;

              // Max demand scale: ~55% (compact max bar height 96px)
              const maxScale = 0.55;
              const barHeightA = Math.max(
                Math.round((shareA / maxScale) * 96),
                10,
              );
              const barHeightB = Math.max(
                Math.round((shareB / maxScale) * 96),
                10,
              );

              return (
                <div
                  className="flex flex-col items-center h-full justify-end group"
                  key={cat}
                >
                  <div className="text-[10px] font-bold text-text-secondary mb-0.5 font-mono whitespace-nowrap">
                    {persen(shareA, 0)}/{persen(shareB, 0)}
                  </div>
                  <div className="flex items-end space-x-1 h-28">
                    {/* Manggarai Bar */}
                    <div
                      style={{ height: `${barHeightA}px` }}
                      className="w-4 bg-[var(--data)] rounded-t transition-all group-hover:brightness-110"
                      title={`${a.station_name}: ${persen(shareA, 0)} (${compA?.gerai_count ?? 0} gerai)`}
                    />
                    {/* Sudirman Bar */}
                    <div
                      style={{ height: `${barHeightB}px` }}
                      className="w-4 bg-[var(--data-mid)] rounded-t transition-all group-hover:brightness-110"
                      title={`${b.station_name}: ${persen(shareB, 0)} (${compB?.gerai_count ?? 0} gerai)`}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-text-primary mt-1.5 truncate max-w-[54px] text-center">
                    {categoryLabel(cat)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
