"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoryFilter } from "@/lib/data/dimensions";
import { categoryLabel, slotLabel } from "@/lib/data/dimensions";
import type { MockCategoryStatus, SlotKey, SpendingGapPayload, Station } from "@/lib/data/types";
import { comparisonBySlot, comparisonSummary } from "@/lib/analytics/demo-select";
import { desimal, persen, ribuan, rupiahRingkas } from "@/lib/format";

type Props = {
  stations: Station[];
  analytics: SpendingGapPayload;
  statuses: MockCategoryStatus[];
  activeSlot: SlotKey;
  activeCategory: CategoryFilter;
  onClose: () => void;
  onOpenStation: (station: Station) => void;
};

export function ComparisonDialog({ stations, analytics, statuses, activeSlot, activeCategory, onClose, onOpenStation }: Props) {
  const [firstId, setFirstId] = useState(stations[0]?.id ?? 1);
  const [secondId, setSecondId] = useState(stations[1]?.id ?? 2);
  const closeRef = useRef<HTMLButtonElement>(null);
  const selectedStations = [
    stations.find((station) => station.id === firstId),
    stations.find((station) => station.id === secondId),
  ].filter((station): station is Station => Boolean(station));
  const summaries = useMemo(
    () => selectedStations.map((station) => comparisonSummary(station, analytics, statuses, activeSlot, activeCategory)),
    [selectedStations, analytics, statuses, activeSlot, activeCategory],
  );
  const slotRows = useMemo(
    () => comparisonBySlot(selectedStations, analytics, activeCategory, statuses),
    [selectedStations, analytics, activeCategory, statuses],
  );
  const maxSlotGap = Math.max(1, ...slotRows.flatMap((row) => selectedStations.map((station) => row.by_station[station.id] ?? 0)));

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function selectFirst(id: number) {
    if (id === secondId) setSecondId(firstId);
    setFirstId(id);
  }

  function selectSecond(id: number) {
    if (id === firstId) setFirstId(secondId);
    setSecondId(id);
  }

  return <div className="dialog-backdrop" onMouseDown={onClose}>
    <section className="comparison-dialog" role="dialog" aria-modal="true" aria-labelledby="comparison-title" onMouseDown={(event) => event.stopPropagation()}>
      <header className="comparison-header">
        <div>
          <span className="k">Perbandingan dua simpul · data mock</span>
          <h2 id="comparison-title">Manggarai dan Sudirman</h2>
          <p>Filter aktif: {slotLabel(activeSlot)} · {categoryLabel(activeCategory)}</p>
        </div>
        <button ref={closeRef} type="button" aria-label="Tutup perbandingan" onClick={onClose}>×</button>
      </header>

      <div className="comparison-pickers">
        <label>Simpul pertama<select value={firstId} onChange={(event) => selectFirst(Number(event.target.value))}>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></label>
        <span aria-hidden="true">dibandingkan dengan</span>
        <label>Simpul kedua<select value={secondId} onChange={(event) => selectSecond(Number(event.target.value))}>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}</select></label>
      </div>

      <div className="comparison-cards">
        {summaries.map((summary, index) => {
          const station = selectedStations[index];
          return <article key={summary.station_id}>
            <div className="comparison-station-title"><span style={{ background: index ? "#334155" : "#1d4ed8" }} />Stasiun {summary.station_name}</div>
            <dl>
              <div><dt>Potensi</dt><dd>{rupiahRingkas(summary.potential_p50)}</dd></div>
              <div><dt>Tertangkap</dt><dd>{rupiahRingkas(summary.captured_p50)}</dd></div>
              <div className="comparison-highlight"><dt>Spending gap</dt><dd>{rupiahRingkas(summary.gap_p50)}</dd></div>
              <div><dt>Capture rate</dt><dd>{persen(summary.capture_rate)}</dd></div>
              <div><dt>Arus pintu</dt><dd>{ribuan(summary.pedestrian_flow)} org/jam</dd></div>
              <div><dt>Confidence</dt><dd>{desimal(summary.confidence_average)}</dd></div>
              <div><dt>Tidak diestimasi</dt><dd>{summary.thin_sample_points} titik</dd></div>
            </dl>
            <div className="comparison-missing"><span>Kategori belum terpenuhi</span><strong>{summary.missing_categories.length ? summary.missing_categories.map(categoryLabel).join(", ") : "Tidak ada"}</strong></div>
            <button type="button" className="b bp" onClick={() => onOpenStation(station)}>Buka di peta</button>
          </article>;
        })}
      </div>

      <div className="comparison-chart" aria-label="Perbandingan gap per slot waktu">
        <h3>Gap per slot waktu</h3>
        {slotRows.map((row) => <div className="comparison-chart-row" key={row.slot}>
          <span>{slotLabel(row.slot)}</span>
          <div>{selectedStations.map((station, index) => <div key={station.id} title={`${station.name}: ${rupiahRingkas(row.by_station[station.id])}`} style={{ width: `${Math.max(2, ((row.by_station[station.id] ?? 0) / maxSlotGap) * 100)}%`, background: index ? "#64748b" : "#2563eb" }} />)}</div>
        </div>)}
      </div>
    </section>
  </div>;
}
