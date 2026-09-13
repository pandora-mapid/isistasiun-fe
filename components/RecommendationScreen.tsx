"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NavBar } from "./NavBar";
import { categoryMatrix, confidenceLabel, recommendationHref, recommendationOverview, recommendationsFor } from "@/lib/analytics/demo-select";
import { categoryLabel, slotLabel } from "@/lib/data/dimensions";
import { loadDemoData, loadEntrances, loadStations } from "@/lib/data/source";
import type { MockDemoData, ObservationPointProps, Station } from "@/lib/data/types";
import { persen, rupiah, rupiahRingkas } from "@/lib/format";

type Filter = "all" | number;

export function RecommendationScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [demo, setDemo] = useState<MockDemoData | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [entrances, setEntrances] = useState<ObservationPointProps[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([loadDemoData(), loadStations(), loadEntrances()])
      .then(([demoData, stationRows, entranceRows]) => {
        if (!active) return;
        setDemo(demoData); setStations(stationRows); setEntrances(entranceRows);
      })
      .catch((reason: unknown) => active && setError(reason instanceof Error ? reason.message : "Data rekomendasi gagal dimuat"));
    return () => { active = false; };
  }, []);

  const recommendations = useMemo(
    () => recommendationsFor(demo?.recommendations ?? [], filter),
    [demo, filter],
  );
  const overview = useMemo(() => recommendationOverview(recommendations), [recommendations]);
  const matrix = useMemo(
    () => categoryMatrix(demo?.category_statuses ?? [], stations.map((station) => station.id)),
    [demo, stations],
  );
  const stationName = (id: number) => stations.find((station) => station.id === id)?.name ?? `Simpul ${id}`;
  const pointName = (id: number) => entrances.find((point) => point.id === id)?.point_label ?? `Titik ${id}`;

  return <div className="page-canvas recommendation-page">
    <NavBar active="rekomendasi" cta={<Link href="/peta" className="b bp">Buka peta</Link>} />
    <header className="recommendation-hero">
      <div><span className="cap">Prioritas berbasis data mock</span><h1>Slot mana yang diisi lebih dahulu, dan mengapa.</h1><p>Rekomendasi hanya diberikan pada lokasi dengan bukti memadai. Lokasi bersampel tipis ditahan sampai pencacahan berikutnya.</p></div>
      <dl>
        <div><dt>Total gap terpetakan</dt><dd>{rupiah(overview.total_gap)}</dd></div>
        <div><dt>Layak direkomendasikan</dt><dd>{overview.recommended} lokasi</dd></div>
        <div><dt>Ditunda</dt><dd>{overview.deferred} lokasi</dd></div>
      </dl>
    </header>

    {error && <div className="recommendation-error" role="alert">{error}</div>}

    <main className="recommendation-main">
      <section>
        <div className="recommendation-section-head"><div><span className="k">Daftar tindakan</span><h2>Urutan prioritas</h2></div><div className="recommendation-filters" aria-label="Filter stasiun">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Semua simpul</button>
          {stations.map((station) => <button key={station.id} type="button" aria-pressed={filter === station.id} onClick={() => setFilter(station.id)}>{station.name}</button>)}
        </div></div>
        <div className="recommendation-table" role="table" aria-label="Urutan rekomendasi">
          <div className="recommendation-table-head" role="row"><span>#</span><span>Lokasi</span><span>Kategori</span><span>Slot</span><span>Gap</span><span>Confidence</span></div>
          {recommendations.map((row, index) => <Link key={row.id} href={recommendationHref(row)} className={row.sampel_tipis ? "recommendation-row recommendation-row-thin" : "recommendation-row"} role="row">
            <span>{row.sampel_tipis ? "—" : String(index + 1).padStart(2, "0")}</span>
            <span><strong>{stationName(row.station_id)} · {pointName(row.point_id)}</strong><small>{row.reason}</small></span>
            <span>{row.sampel_tipis ? "Belum direkomendasikan" : categoryLabel(row.category)}</span>
            <span>{slotLabel(row.slot)}</span><span>{rupiah(row.gap_p50)}</span><span>{confidenceLabel(row.confidence)} · {persen(row.confidence, 0)}</span>
          </Link>)}
          {!recommendations.length && <div className="recommendation-empty">Belum ada rekomendasi untuk filter ini.</div>}
        </div>
      </section>

      <section>
        <div className="recommendation-section-head"><div><span className="k">Keputusan teratas</span><h2>Tiga rekomendasi utama</h2></div><p>Setiap kartu membuka titik dan filter yang sama di halaman peta.</p></div>
        <div className="recommendation-cards">
          {recommendations.filter((row) => !row.sampel_tipis).slice(0, 3).map((row, index) => <article key={row.id}>
            <span className="k">Prioritas {String(index + 1).padStart(2, "0")} · {stationName(row.station_id)}</span>
            <h3>{row.title}</h3><p>{row.reason}</p>
            <dl><div><dt>Spending gap</dt><dd>{rupiahRingkas(row.gap_p50)}</dd></div><div><dt>Confidence</dt><dd>{persen(row.confidence, 0)}</dd></div><div><dt>Validasi</dt><dd>{row.next_measurement}</dd></div></dl>
            <Link href={recommendationHref(row)}>Buka lokasi di peta →</Link>
          </article>)}
        </div>
      </section>

      <section>
        <div className="recommendation-section-head"><div><span className="k">Supply dan permintaan</span><h2>Status kategori per simpul</h2></div><p>Angka pada tabel ini merupakan data mock Tahap 1.</p></div>
        <div className="category-matrix">
          <div className="category-matrix-head"><span>Kategori</span>{stations.map((station) => <span key={station.id}>{station.name}</span>)}<span>Permintaan</span></div>
          {matrix.map((row) => {
            return <div className="category-matrix-row" key={row.category}><span>{categoryLabel(row.category)}</span>{stations.map((station) => {
              const item = row.by_station[station.id];
              return <span key={station.id}><Link href={`/peta?station=${station.id}&category=${row.category}`} className={`category-status category-status-${item?.status ?? "kurang"}`}>{item?.status ?? "belum ada"}</Link><small>{item?.gerai_count ?? 0} gerai</small></span>;
            })}<span>{persen(row.demand_average, 0)}</span></div>;
          })}
        </div>
      </section>
    </main>
    <footer className="recommendation-footer"><span>Isi Stasiun · seluruh angka pada halaman ini bersifat ilustratif</span><Link href="/peta">Kembali ke peta →</Link></footer>
  </div>;
}
