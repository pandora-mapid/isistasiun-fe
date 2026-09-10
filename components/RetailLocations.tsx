"use client";

import { useState } from "react";
import { RETAIL_KINDS, RETAIL_LEGEND } from "@/lib/map/retail-style";
import type { RetailLocation } from "@/lib/data/retail";
import { categoryLabel } from "@/lib/data/dimensions";

const STATUS_LABEL: Record<RetailLocation["status"], string> = {
  tersedia: "Tersedia",
  kandidat: "Kandidat",
  perlu_verifikasi: "Perlu verifikasi",
};

function Swatch({ kind }: { kind: RetailLocation["kind"] }) {
  return (
    <span
      className="retail-swatch"
      style={{
        background: RETAIL_LEGEND[kind].fill,
        borderColor: RETAIL_LEGEND[kind].stroke,
      }}
    />
  );
}

/**
 * Panel mengambang di kiri peta: daftar retail & potensi toko, dikelompokkan
 * per jenis. Klik satu baris → kartu detail muncul di bawah daftar dan kamera
 * mendekati titiknya. Klik bulatan di peta melakukan hal yang sama.
 *
 * Tidak menampilkan koordinat mentah — itu detail mesin, bukan bahan keputusan.
 * Judul dan kelompok kosong mengikuti data: kalau tidak ada lokasi, panel tidak
 * dirender sama sekali.
 */
export function RetailLocations({
  locations,
  stationName,
  selected,
  onSelect,
  onClose,
}: {
  locations: RetailLocation[];
  stationName: string;
  selected: RetailLocation | null;
  onSelect: (location: RetailLocation) => void;
  onClose: () => void;
}) {
  // Daftar dan kartu detail tidak pernah terbuka bersamaan — panelnya
  // mengambang di atas peta, jadi tingginya harus terjaga. Memilih sebuah
  // lokasi (dari daftar ATAU dari marker) menutup daftar. Penyesuaian saat
  // render, bukan lewat efek: pola resmi React untuk "sesuaikan state saat
  // sebuah nilai berubah".
  const [listOpen, setListOpen] = useState(false);
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  if ((selected?.id ?? null) !== prevSelectedId) {
    setPrevSelectedId(selected?.id ?? null);
    if (selected) setListOpen(false);
  }

  if (locations.length === 0 && !selected) return null;

  const groups = RETAIL_KINDS.map((kind) => ({
    kind,
    items: locations.filter((location) => location.kind === kind),
  })).filter((group) => group.items.length > 0);

  return (
    <section className="retail-locations" aria-label={`Retail dan potensi ${stationName}`}>
      <details open={listOpen} onToggle={(event) => setListOpen(event.currentTarget.open)}>
        <summary>
          <span className="k">Retail &amp; potensi</span>
          <span className="retail-count fig">{locations.length} lokasi</span>
          <svg className="retail-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="retail-location-list sc">
          {groups.map(({ kind, items }) => (
            <div className="retail-group" key={kind}>
              <div className="retail-group-title">
                <Swatch kind={kind} />
                <span>{RETAIL_LEGEND[kind].label}</span>
                <span className="fig">{items.length}</span>
              </div>
              {items.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  aria-pressed={selected?.id === location.id}
                  onClick={() => onSelect(location)}
                >
                  <span>{location.name}</span>
                  <span aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </details>

      {selected && (
        <article className="retail-location-detail" aria-label="Detail lokasi retail" aria-live="polite">
          <button
            className="retail-detail-close btn-reset"
            type="button"
            aria-label="Tutup detail retail"
            onClick={onClose}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
          <div className="retail-detail-kind">
            <Swatch kind={selected.kind} />
            {RETAIL_LEGEND[selected.kind].label}
          </div>
          <h3>{selected.name}</h3>
          <dl className="retail-detail-meta">
            <div>
              <dt>Status</dt>
              <dd>{STATUS_LABEL[selected.status]}</dd>
            </div>
            <div>
              <dt>Kategori</dt>
              <dd>{selected.category ? categoryLabel(selected.category) : "Belum ditentukan"}</dd>
            </div>
          </dl>
          <p>{selected.note || RETAIL_LEGEND[selected.kind].description}</p>
        </article>
      )}
    </section>
  );
}
