"use client";

import { RETAIL_LEGEND } from "@/lib/map/retail-style";
import type { RetailLocation, RetailKind } from "@/lib/data/retail";
import { categoryLabel } from "@/lib/data/dimensions";

export function RetailLocations({ locations, selected, onSelect, onClose }: {
  locations: RetailLocation[];
  selected: RetailLocation | null;
  onSelect: (location: RetailLocation) => void;
  onClose: () => void;
}) {
  return <section className="retail-locations" aria-label="Retail dan potensi Manggarai">
    <details>
      <summary>Retail & potensi Manggarai <span>{locations.length} lokasi</span></summary>
      <div className="retail-location-list">
        {(Object.keys(RETAIL_LEGEND) as RetailKind[]).map((kind) => <div key={kind}>
          <div className="retail-group-title"><span style={{ background: RETAIL_LEGEND[kind].color }} />{RETAIL_LEGEND[kind].label}</div>
          {locations.filter((location) => location.kind === kind).map((location) =>
            <button key={location.id} type="button" aria-pressed={selected?.id === location.id} onClick={() => onSelect(location)}>
              {location.name}<span aria-hidden="true">↗</span>
            </button>,
          )}
        </div>)}
      </div>
    </details>
    {selected && <article className="retail-location-detail" aria-label="Detail lokasi retail" aria-live="polite">
      <button className="retail-detail-close" type="button" aria-label="Tutup detail retail" onClick={onClose}>×</button>
      <span className="retail-detail-kind" style={{ color: RETAIL_LEGEND[selected.kind].color }}>{RETAIL_LEGEND[selected.kind].label}</span>
      <h2>{selected.name}</h2>
      <dl className="retail-detail-meta">
        <div><dt>Status</dt><dd>{selected.status.replace("_", " ")}</dd></div>
        <div><dt>Kategori</dt><dd>{selected.category ? categoryLabel(selected.category) : "Belum ditentukan"}</dd></div>
      </dl>
      <p>{selected.note || RETAIL_LEGEND[selected.kind].description}</p>
      <p className="retail-coordinates">{selected.latitude.toFixed(7)}, {selected.longitude.toFixed(7)}</p>
    </article>}
  </section>;
}
