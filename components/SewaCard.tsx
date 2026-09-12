"use client";

/**
 * Kartu petak sewa terpilih — melayang di atas peta, kiri bawah.
 *
 * Sengaja kartu kecil, bukan tab panel tersendiri seperti Retail: yang
 * dijawabnya cuma satu pertanyaan ("petak ini berapa, dan seberapa mahal tiap
 * orang yang lewat"), dan jawabannya muat dalam beberapa baris. Daftar lengkap
 * seluruh petak sudah jadi bagian tabel atribut.
 *
 * Aturan angka di sini sama dengan seluruh peta: yang tidak terukur ditulis
 * "belum terukur", bukan Rp 0 — nol berarti gratis.
 */
import { SEWA_LEGEND } from "@/lib/map/rent-style";
import type { RentPlot } from "@/lib/data/rent";

const STATUS_LABEL: Record<string, string> = {
  occupied: "Terisi",
  available: "Kosong — ditawarkan",
  needs_verification: "Perlu verifikasi",
};

const SUMBER_LABEL: Record<RentPlot["data_source"], string> = {
  space_kai: "Space KAI",
  field_survey: "Survei lapangan",
};

function rupiah(value: number | null): string {
  if (value == null) return "belum terukur";
  if (value >= 1_000_000_000)
    return `Rp ${(value / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
  if (value >= 1_000_000)
    return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function SewaCard({
  plot,
  onClose,
}: {
  plot: RentPlot;
  onClose: () => void;
}) {
  const legend = SEWA_LEGEND[plot.availability_status];

  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        bottom: 210,
        zIndex: 18,
        width: 300,
        maxWidth: "calc(100% - 48px)",
        background: "var(--surface)",
        border: "1px solid var(--rule)",
        borderRadius: 12,
        padding: "13px 15px 14px",
        boxShadow: "0 8px 24px rgba(22,19,15,.10)",
      }}
    >
      <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            marginTop: 4,
            flex: "none",
            background: legend?.fill,
            border: `1.6px solid ${legend?.stroke}`,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>
            {plot.plot_name}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>
            {plot.station_name} · {STATUS_LABEL[plot.availability_status] ?? plot.availability_status}
          </div>
        </div>
        <button
          type="button"
          className="btn-reset"
          onClick={onClose}
          aria-label="Tutup kartu petak sewa"
          style={{ fontSize: 15, lineHeight: 1, color: "var(--ink-muted)", flex: "none" }}
        >
          ×
        </button>
      </div>

      <div style={{ height: 1, background: "var(--rule)", margin: "11px 0 10px" }} />

      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 12px", margin: 0 }}>
        <dt style={{ fontSize: 11, color: "var(--ink-muted)" }}>Sewa ditawarkan</dt>
        <dd className="fig" style={{ fontSize: 11.5, margin: 0, textAlign: "right" }}>
          {plot.offered_rent == null ? "belum terukur" : `${rupiah(plot.offered_rent)}/thn`}
        </dd>

        <dt style={{ fontSize: 11, color: "var(--ink-muted)" }}>Luas</dt>
        <dd className="fig" style={{ fontSize: 11.5, margin: 0, textAlign: "right" }}>
          {plot.land_area == null ? "belum terukur" : `${plot.land_area} m²`}
        </dd>

        <dt style={{ fontSize: 11, color: "var(--ink-muted)" }}>Arus terukur</dt>
        <dd className="fig" style={{ fontSize: 11.5, margin: 0, textAlign: "right" }}>
          {plot.measured_flow == null
            ? "belum terukur"
            : `${plot.measured_flow} org / blok`}
        </dd>

        <dt style={{ fontSize: 11, color: "var(--ink-muted)" }}>Indeks sewa/arus</dt>
        <dd className="fig" style={{ fontSize: 11.5, margin: 0, textAlign: "right" }}>
          {plot.index == null ? "belum terukur" : `${rupiah(plot.index)} / org`}
          {plot.is_outlier && (
            <span style={{ color: "var(--field)", marginLeft: 6 }}>pencilan</span>
          )}
        </dd>
      </dl>

      <div style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 11, lineHeight: 1.45 }}>
        Sumber: {SUMBER_LABEL[plot.data_source]}. Angka indeks adalah estimasi —
        arus terukur berasal dari blok pengamatan lapangan, bukan hitungan
        harian.
        {plot.note ? ` ${plot.note}` : ""}
      </div>
    </div>
  );
}
