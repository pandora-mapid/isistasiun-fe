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
 * Isi tab "Retail" di panel sidebar kanan.
 *
 * Pemilih lokasi berbentuk dropdown yang gayanya sama dengan "Lapisan & filter"
 * di tab Ringkasan: tombol toggle + chevron berputar, isi terbuka berupa kotak
 * cari nama + daftar berkelompok per jenis. Detail lokasi terpilih mengalir di
 * bawah dropdown. Memilih sebuah lokasi (dari daftar atau dari penanda peta)
 * menutup dropdown; menutup detail membukanya lagi.
 */
export function RetailPanel({
  locations,
  selected,
  onSelect,
  onClose,
}: {
  locations: RetailLocation[];
  selected: RetailLocation | null;
  onSelect: (location: RetailLocation) => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");

  // Sesuaikan `open` saat pilihan berubah — pola resmi React untuk
  // "sesuaikan state saat sebuah nilai berubah", bukan lewat efek.
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  const selectedId = selected?.id ?? null;
  if (selectedId !== prevSelectedId) {
    setPrevSelectedId(selectedId);
    setOpen(selectedId === null);
  }

  const q = query.trim().toLocaleLowerCase("id");
  const matched = q
    ? locations.filter((l) => l.name.toLocaleLowerCase("id").includes(q))
    : locations;
  const groups = RETAIL_KINDS.map((kind) => ({
    kind,
    items: matched.filter((l) => l.kind === kind),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <div
        style={{
          borderRadius: "var(--r-md)",
          background: "var(--paper-2)",
          overflow: "hidden",
          marginBottom: 22,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="row layers-toggle btn-reset"
          aria-expanded={open}
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
            style={{
              flex: "none",
              color: "var(--ink)",
              transition: "transform .18s cubic-bezier(.4,0,.2,1)",
              transform: `rotate(${open ? 180 : 0}deg)`,
            }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          {!open && selected ? (
            <span className="row" style={{ flex: 1, gap: 8, minWidth: 0 }}>
              <Swatch kind={selected.kind} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                {selected.name}
              </span>
            </span>
          ) : (
            <>
              <span className="k" style={{ flex: 1 }}>Pilih lokasi</span>
              <span className="fig" style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>
                {locations.length} lokasi
              </span>
            </>
          )}
        </button>

        {open && (
          <div style={{ padding: "2px 12px 12px" }}>
            <div className="retail-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                type="text"
                aria-label="Cari retail atau potensi toko"
                placeholder="Cari nama lokasi…"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Hapus pencarian retail"
                  onClick={() => setQuery("")}
                >
                  ×
                </button>
              )}
            </div>

            {groups.length === 0 ? (
              <div className="retail-picker-empty">
                {locations.length === 0
                  ? "Tidak ada asset untuk stasiun ini."
                  : `Tidak ada lokasi bernama “${query.trim()}”.`}
              </div>
            ) : (
              <div className="retail-location-list">
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
            )}
          </div>
        )}
      </div>

      {selected ? (
        <article className="retail-detail" aria-label="Detail lokasi retail" aria-live="polite">
          <button
            className="retail-detail-close btn-reset"
            type="button"
            aria-label="Tutup detail retail"
            onClick={onClose}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
      ) : (
        <div className="retail-detail-empty">
          Pilih lokasi di atas atau klik penanda di peta untuk melihat detailnya.
        </div>
      )}
    </>
  );
}
