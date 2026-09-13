"use client";

/**
 * Export PDF formal: satu simpul per halaman A4.
 *
 * Markup laporan sengaja berdiri sendiri dari dashboard peta. Mode print hanya
 * mempertahankan `.brief-cetak`, sehingga kontrol peta tidak masuk ke PDF.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import { kategoriHilang, ringkasanSimpul } from "@/lib/analytics/summary";
import { categoryLabel, SLOTS, slotLabel } from "@/lib/data/dimensions";
import { loadStationSummary } from "@/lib/data/source";
import type {
  StationSummaryPayload,
  StationSummaryRow,
} from "@/lib/data/types";
import {
  desimal,
  persen,
  rentangRingkas,
  ribuan,
  rupiahRingkas,
} from "@/lib/format";

function jamPuncak(row: StationSummaryRow): string {
  const slot = row.peak?.slot;
  if (!slot) return "belum ditetapkan";
  const definition = SLOTS.find((item) => item.key === slot);
  if (!definition) return slotLabel(slot);
  const [start, end] = definition.label.split("–").map((part) => part.trim());
  return start && end ? `${start}:00 - ${end}:00` : slotLabel(slot);
}

function dasarAngka(row: StationSummaryRow): string {
  return row.basis === "monte-carlo-simpul"
    ? "Simulasi Monte Carlo setingkat simpul."
    : "Agregat titik sementara, menunggu simulasi setingkat simpul."
}

function jenisHari(payload: StationSummaryPayload): string {
  return payload.day_type === "weekday" ? "Hari Kerja" : "Akhir Pekan";
}

function metodePencacahan(row: StationSummaryRow): string {
  if (row.pintu_ditahan === 0) {
    return `Melibatkan ${row.pintu_dicacah} pintu stasiun.`;
  }
  return `${row.pintu_dicacah} pintu dicacah (${row.pintu_ditahan} pintu estimasinya ditahan karena sampel tipis sehingga angka merupakan batas bawah).`;
}

function jumlahGerai(value: number): string {
  if (value === 0) return "Belum ada gerai";
  return `Baru ${ribuan(value)} gerai`;
}

function LabeledItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <li>
      <strong>{label}:</strong> {children}
    </li>
  );
}

function StationReportPage({
  row,
  payload,
  index,
  total,
}: {
  row: StationSummaryRow;
  payload: StationSummaryPayload;
  index: number;
  total: number;
}) {
  const missing = kategoriHilang(row).slice(0, 3);
  const confidence = row.confidence
    ? `${desimal(row.confidence.min)} - ${desimal(row.confidence.max)}`
    : "belum tersedia";
  const flow = row.peak?.variables?.F;
  const entryRatio = row.peak?.variables?.E;

  return (
    <article
      className={`formal-report-page${index === 0 ? " formal-report-page--first" : ""}`}
    >
      {index === 0 && (
        <header className="formal-report-cover">
          <h1>Laporan Analisis Potensi Ritel</h1>
          <p>Ringkasan Simpul {jenisHari(payload)} Stasiun Kereta</p>
        </header>
      )}

      <div className="formal-report-body">
        <section className="formal-station-heading">
          <h2>{index + 1}. Stasiun {row.station_name}</h2>
        </section>

        <section className="formal-summary-callout">
          <p>
            <strong>Kesenjangan Belanja:</strong> Diperkirakan mencapai{" "}
            {rentangRingkas(row.gap)} per hari, dengan nilai tengah{" "}
            {rupiahRingkas(row.gap.p50)}. Potensi total sebesar{" "}
            {rentangRingkas(row.potensi)}, namun baru tertangkap sekitar{" "}
            {persen(row.capture_rate, 1)} oleh gerai yang berada di dalam simpul
            stasiun.
          </p>
        </section>

        <section className="formal-report-section">
          <h3>A. Rentang tertangkap</h3>
          <p>
            Nilai yang tertangkap berada pada rentang{" "}
            {rentangRingkas(row.tertangkap)} dari potensi total{" "}
            {rentangRingkas(row.potensi)}. Data ini dilaporkan sebagai rentang
            P10-P90; nilai tengahnya masing-masing{" "}
            {rupiahRingkas(row.tertangkap.p50)} dan{" "}
            {rupiahRingkas(row.potensi.p50)}.
          </p>
        </section>

        <section className="formal-report-section">
          <h3>B. Asumsi yang dipakai &amp; Ringkasan data simpul</h3>
          <ul className="formal-method-list">
            <LabeledItem label="Dasar Angka">{dasarAngka(row)}</LabeledItem>
            <LabeledItem label="Titik Puncak">
              {row.peak?.point_label ?? "Belum ditentukan"} pada slot waktu{" "}
              {jamPuncak(row)}.
            </LabeledItem>
            <LabeledItem label="Arus Pejalan Puncak (F)">
              {flow !== undefined
                ? `${ribuan(flow)} orang/jam dengan rasio masuk sebesar ${persen(entryRatio)}.`
                : "Belum tersedia."}
            </LabeledItem>
            <LabeledItem label="Metode Pencacahan">
              {metodePencacahan(row)}
            </LabeledItem>
            <LabeledItem label="Porsi Tertangkap">
              {persen(row.capture_rate)} dari potensi belanja simpul.
            </LabeledItem>
          </ul>
        </section>

        <section className="formal-report-section formal-category-section">
          <h3>C. Kategori hilang teratas</h3>
          {missing.length > 0 ? (
            <table className="formal-category-table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Permintaan</th>
                  <th>Ketersediaan Saat Ini</th>
                </tr>
              </thead>
              <tbody>
                {missing.map((category) => (
                  <tr key={category.category}>
                    <td>{categoryLabel(category.category)}</td>
                    <td>{persen(category.demand_share, 0)}</td>
                    <td>{jumlahGerai(category.gerai_count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Tidak ada kategori yang berada di bawah ambang ketersediaan.</p>
          )}
        </section>

        <section className="formal-report-section formal-confidence-section">
          <h3>D. Catatan kepercayaan</h3>
          <p>
            Skor kepercayaan titik-titik yang diestimasi berkisar antara{" "}
            {confidence}. Dasar nilai transaksi diperoleh dari{" "}
            {ribuan(row.struk_terbaca)} struk terbaca yang tercatat pada
            ringkasan simpul. Seluruh angka rupiah merupakan nilai estimasi.
          </p>
          {row.pintu_ditahan > 0 && (
            <p className="formal-report-note">
              *Estimasi {row.pintu_ditahan} pintu ditahan karena sampel tipis;
              ringkasan simpul diperlakukan sebagai batas bawah.
            </p>
          )}
        </section>

        <footer className="formal-report-footer">
          <strong>{index + 1} / {total}</strong>
        </footer>
      </div>
    </article>
  );
}

function FormalReport({
  payload,
  rows,
}: {
  payload: StationSummaryPayload;
  rows: StationSummaryRow[];
}) {
  return (
    <div className="formal-report">
      {rows.map((row, index) => (
        <StationReportPage
          key={row.station_id}
          row={row}
          payload={payload}
          index={index}
          total={rows.length}
        />
      ))}
    </div>
  );
}

function EmptyBrief({ children }: { children: ReactNode }) {
  return <p className="brief-state">{children}</p>;
}

export function BriefSimpul({ onClose }: { onClose: () => void }) {
  const [payload, setPayload] = useState<StationSummaryPayload | null>(null);
  const [gagal, setGagal] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let canceled = false;
    loadStationSummary()
      .then((value) => !canceled && setPayload(value))
      .catch(() => !canceled && setGagal(true));
    return () => {
      canceled = true;
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

  const rows = payload ? ringkasanSimpul(payload) : [];

  return (
    <div
      className="dialog-backdrop node-dashboard-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="brief-simpul-title"
        className="brief-cetak"
      >
        <header className="brief-modal-toolbar cetak-sembunyi">
          <div>
            <span className="brief-modal-eyebrow">Formal report · A4</span>
            <h2 id="brief-simpul-title">Export PDF</h2>
            <p>Pratinjau laporan dua halaman · hasil export hanya berisi dokumen.</p>
          </div>
          <div className="brief-modal-actions">
            <button
              type="button"
              className="b bp"
              onClick={() => window.print()}
              disabled={rows.length === 0}
            >
              Cetak / simpan PDF
            </button>
            <button
              ref={closeRef}
              type="button"
              className="btn-reset brief-modal-close"
              aria-label="Tutup brief simpul"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </header>

        {gagal && <EmptyBrief>Brief gagal dimuat.</EmptyBrief>}
        {!gagal && payload === null && <EmptyBrief>Memuat brief…</EmptyBrief>}
        {payload && rows.length > 0 && (
          <FormalReport payload={payload} rows={rows} />
        )}
      </section>
    </div>
  );
}
