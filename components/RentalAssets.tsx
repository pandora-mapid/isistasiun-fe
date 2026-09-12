"use client";

import type { RentalAsset, RentalAssetStatus } from "@/lib/data/types";
import { RENTAL_STATUS_LEGEND, rentalStatusLabel } from "@/lib/data/rental";

function areaLabel(asset: RentalAsset): string {
  if (asset.land_area !== null) return `${asset.land_area} m2 tanah`;
  return "Luas belum dicatat";
}

function sourceLabel(asset: RentalAsset): string {
  return asset.data_source === "space_kai" ? "Space KAI" : "Survei lapangan";
}

export function RentalAssets({
  assets,
  selected,
  onSelect,
  onClose,
}: {
  assets: RentalAsset[];
  selected: RentalAsset | null;
  onSelect: (asset: RentalAsset) => void;
  onClose: () => void;
}) {
  return (
    <section className="rental-assets" aria-label="Aset sewa stasiun">
      <details>
        <summary>
          Aset sewa <span>{assets.length} lokasi</span>
        </summary>
        <div className="rental-asset-list">
          {(Object.keys(RENTAL_STATUS_LEGEND) as RentalAssetStatus[]).map(
            (status) => (
              <div key={status}>
                <div className="rental-group-title">
                  <span style={{ background: RENTAL_STATUS_LEGEND[status].color }} />
                  {RENTAL_STATUS_LEGEND[status].label}
                </div>
                {assets
                  .filter((asset) => asset.availability_status === status)
                  .map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      aria-pressed={selected?.id === asset.id}
                      onClick={() => onSelect(asset)}
                    >
                      {asset.plot_name}
                      <span aria-hidden="true">&gt;</span>
                    </button>
                  ))}
              </div>
            ),
          )}
        </div>
      </details>
      {selected && (
        <article
          className="rental-asset-detail"
          aria-label="Detail aset sewa"
          aria-live="polite"
        >
          <button
            className="rental-detail-close"
            type="button"
            aria-label="Tutup detail aset sewa"
            onClick={onClose}
          >
            x
          </button>
          <span
            className="rental-detail-status"
            style={{
              color: RENTAL_STATUS_LEGEND[selected.availability_status].color,
            }}
          >
            {rentalStatusLabel(selected.availability_status)}
          </span>
          <h2>{selected.plot_name}</h2>
          <dl className="retail-detail-meta">
            <div>
              <dt>Sumber</dt>
              <dd>{sourceLabel(selected)}</dd>
            </div>
            <div>
              <dt>Luas</dt>
              <dd>{areaLabel(selected)}</dd>
            </div>
          </dl>
          <p>{selected.note ?? RENTAL_STATUS_LEGEND[selected.availability_status].description}</p>
          <p className="retail-coordinates">
            {selected.latitude.toFixed(7)}, {selected.longitude.toFixed(7)}
          </p>
        </article>
      )}
    </section>
  );
}
