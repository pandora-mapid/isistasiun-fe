"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { NavBar } from "@/components/NavBar";
import type {
  BackendStation,
  DeepAnalysis,
  PremiumRange,
} from "@/lib/auth/types";

const SLOT_LABEL: Record<string, string> = {
  morning: "Pagi",
  midday: "Siang",
  evening: "Sore",
  night: "Malam",
};

function midpoint(range: PremiumRange): number {
  return (range.p10 + range.p90) / 2;
}

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function rangeLabel(range: PremiumRange): string {
  return `${rupiah(range.p10)}–${rupiah(range.p90)}`;
}

function percent(value: number | null): string {
  if (value === null) return "Belum terhitung";
  return new Intl.NumberFormat("id-ID", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function PremiumDashboard() {
  const router = useRouter();
  const { status, user, request, upgrade } = useAuth();
  const [stations, setStations] = useState<BackendStation[]>([]);
  const [stationID, setStationID] = useState("");
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=%2Fpremium");
    }
  }, [status, router]);

  const isEntitled = user?.role === "premium" || user?.role === "operator" || user?.role === "admin";
  // Admin and premium have no fixed station — both see the full picker.
  // Only operator (organization-provisioned, one station per account) is
  // locked to its own row; the backend enforces the same scope, this just
  // keeps the UI from offering a choice that would 403.
  const canPickAnyStation = user?.role === "admin" || user?.role === "premium";
  const visibleStations = useMemo(
    () =>
      canPickAnyStation
        ? stations
        : stations.filter((row) => row.id === user?.station_id),
    [stations, canPickAnyStation, user?.station_id],
  );

  useEffect(() => {
    if (status !== "authenticated" || !isEntitled) return;
    let active = true;
    request<BackendStation[]>("/stations")
      .then((rows) => {
        if (!active) return;
        setStations(rows);
        setError(null);
        setStationID((current) => {
          if (current) return current;
          if (!canPickAnyStation) return user?.station_id || "";
          return rows[0]?.id || "";
        });
        if (!rows.length) setLoading(false);
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoading(false);
          setError(
            cause instanceof Error
              ? cause.message
              : "Daftar stasiun gagal dimuat.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [status, isEntitled, request, canPickAnyStation, user?.station_id]);

  useEffect(() => {
    if (status !== "authenticated" || !stationID) return;
    let active = true;
    request<DeepAnalysis>(`/premium/deep-analysis/${stationID}`)
      .then((data) => {
        if (active) setAnalysis(data);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setAnalysis(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Analisis premium gagal dimuat.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status, stationID, request]);

  const missingCategories = useMemo(
    () => analysis?.category_gaps.filter((row) => row.missing) ?? [],
    [analysis],
  );
  const outlierPlots = useMemo(
    () => analysis?.rent_flow_plots.filter((row) => row.is_outlier) ?? [],
    [analysis],
  );

  if (status !== "authenticated") {
    return (
      <main className="page-canvas paper-canvas premium-page">
        <div className="premium-gate" role="status">
          <span className="eyebrow-chip">Akses premium</span>
          <h1>
            {status === "loading"
              ? "Memeriksa sesi…"
              : "Mengalihkan ke halaman masuk…"}
          </h1>
        </div>
      </main>
    );
  }

  if (user?.role === "user") {
    return (
      <main className="page-canvas paper-canvas premium-page">
        <NavBar
          active="premium"
          cta={
            <Link href="/peta" className="b bs">
              Buka peta
            </Link>
          }
        />
        <div className="premium-gate" role="status">
          <span className="eyebrow-chip">Akses premium</span>
          <h1>Lapisan ini butuh langganan premium.</h1>
          <p>
            Analisis mendalam per simpul — kesenjangan per slot, plot sewa
            yang menyimpang, dan mutu sampel di balik tiap angka.
          </p>
          {upgradeError && (
            <p className="premium-error" role="alert">
              {upgradeError}
            </p>
          )}
          <button
            type="button"
            className="b bp"
            disabled={upgrading}
            onClick={async () => {
              setUpgrading(true);
              setUpgradeError(null);
              try {
                await upgrade();
              } catch (cause) {
                setUpgradeError(
                  cause instanceof Error
                    ? cause.message
                    : "Upgrade gagal. Coba kembali.",
                );
              } finally {
                setUpgrading(false);
              }
            }}
          >
            {upgrading ? "Memproses…" : "Bayar & upgrade ke premium"}
          </button>
          <p className="auth-help">
            Demo: tidak ada gerbang pembayaran sungguhan, akun langsung
            ter-upgrade begitu ditekan.
          </p>
        </div>
      </main>
    );
  }

  if (user?.role === "operator" && !user?.station_id) {
    return (
      <main className="page-canvas paper-canvas premium-page">
        <div className="premium-gate" role="alert">
          <span className="eyebrow-chip">Akses premium</span>
          <h1>Akun operator ini belum ditautkan ke stasiun.</h1>
          <p>Hubungi admin Isi Stasiun untuk menautkan akun ke stasiunnya.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-canvas paper-canvas premium-page">
      <NavBar
        active="premium"
        cta={
          <Link href="/peta" className="b bs">
            Buka peta publik
          </Link>
        }
      />

      <header className="premium-header">
        <div>
          <span className="eyebrow-chip">Analisis premium</span>
          <h1>Analisis mendalam per simpul</h1>
          <p>
            Masuk sebagai{" "}
            <b>
              {user?.role === "admin"
                ? "Admin"
                : user?.role === "operator"
                  ? "Operator"
                  : "Premium"}
            </b>{" "}
            · {user?.email}
            {" — "}
            {canPickAnyStation
              ? "bisa membuka semua stasiun."
              : "hanya bisa membuka stasiun sendiri."}
          </p>
        </div>
        <label className="premium-station-picker">
          <span>{canPickAnyStation ? "Pilih simpul" : "Simpul anda"}</span>
          <select
            value={stationID}
            onChange={(event) => {
              setAnalysis(null);
              setError(null);
              setLoading(true);
              setStationID(event.target.value);
            }}
            disabled={!visibleStations.length || !canPickAnyStation}
          >
            {!visibleStations.length && <option value="">Memuat stasiun…</option>}
            {visibleStations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name} · {station.code}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && (
        <p className="premium-error" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p className="premium-loading" role="status">
          Mengambil analisis terbaru…
        </p>
      )}

      {analysis && !loading && (
        <div className="premium-content">
          <section className="premium-kpis" aria-label="Ringkasan analisis">
            <article>
              <span>Potensi terukur</span>
              <strong>{rupiah(midpoint(analysis.totals.potential))}</strong>
              <small>{rangeLabel(analysis.totals.potential)}</small>
            </article>
            <article>
              <span>Kesenjangan</span>
              <strong>{rupiah(midpoint(analysis.totals.gap))}</strong>
              <small>{rangeLabel(analysis.totals.gap)}</small>
            </article>
            <article>
              <span>Porsi tertangkap</span>
              <strong>{percent(analysis.totals.capture_rate_p50)}</strong>
              <small>
                {analysis.totals.slots_with_data}/
                {analysis.totals.slots_expected} slot tersedia
              </small>
            </article>
            <article>
              <span>Bukti struk layak</span>
              <strong>{analysis.coverage.struk_usable}</strong>
              <small>
                {analysis.coverage.struk_ambiguous} ambigu dari{" "}
                {analysis.coverage.struk_total}
              </small>
            </article>
          </section>

          <section className="premium-panel">
            <div className="premium-panel-head">
              <div>
                <span className="k">01 · Slot terukur</span>
                <h2>Rentang, bukan angka tunggal</h2>
              </div>
              <span
                className={
                  analysis.coverage.has_complete_slots ? "tag" : "tag tag-field"
                }
              >
                {analysis.coverage.has_complete_slots
                  ? "Cakupan lengkap"
                  : "Ada slot kosong"}
              </span>
            </div>
            <div className="premium-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Potensi P10–P90</th>
                    <th>Tertangkap</th>
                    <th>Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.spending_gap.map((slot) => (
                    <tr key={slot.time_slot}>
                      <th>{SLOT_LABEL[slot.time_slot] ?? slot.time_slot}</th>
                      <td>{rangeLabel(slot.potential)}</td>
                      <td>{rangeLabel(slot.captured)}</td>
                      <td className="premium-data">{rangeLabel(slot.gap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="premium-grid">
            <section className="premium-panel">
              <div className="premium-panel-head">
                <div>
                  <span className="k">02 · Kategori</span>
                  <h2>Peluang yang belum terisi</h2>
                </div>
                <strong>{missingCategories.length}</strong>
              </div>
              <ul className="premium-list">
                {missingCategories.map((row) => (
                  <li key={row.category}>
                    <span>{row.category}</span>
                    <span className="tag tag-field">Belum tersedia</span>
                  </li>
                ))}
                {!missingCategories.length && (
                  <li>Tidak ada kategori hilang pada data terbaru.</li>
                )}
              </ul>
            </section>

            <section className="premium-panel">
              <div className="premium-panel-head">
                <div>
                  <span className="k">03 · Sewa terhadap arus</span>
                  <h2>Plot yang perlu ditinjau</h2>
                </div>
                <strong>{outlierPlots.length}</strong>
              </div>
              <ul className="premium-list">
                {outlierPlots.map((plot) => (
                  <li key={plot.plot_id}>
                    <span>{plot.plot_id.slice(0, 8)}</span>
                    <span className="premium-data">
                      {rupiah(plot.offered_rent)} · indeks{" "}
                      {plot.index.toLocaleString("id-ID")}
                    </span>
                  </li>
                ))}
                {!outlierPlots.length && (
                  <li>Tidak ada outlier sewa pada data terbaru.</li>
                )}
              </ul>
            </section>
          </div>

          <div className="premium-grid">
            <section className="premium-panel">
              <div className="premium-panel-head">
                <div>
                  <span className="k">04 · Event</span>
                  <h2>Zona dan slot aktivasi</h2>
                </div>
              </div>
              <ul className="premium-list">
                {analysis.event_potential.map((event) => (
                  <li key={event.zone_id}>
                    <span>{event.zone_id.slice(0, 8)}</span>
                    <span>
                      skor {event.activation_score.toLocaleString("id-ID")} ·{" "}
                      {SLOT_LABEL[event.recommended_slot] ??
                        event.recommended_slot}
                    </span>
                  </li>
                ))}
                {!analysis.event_potential.length && (
                  <li>Belum ada skor event untuk simpul ini.</li>
                )}
              </ul>
            </section>

            <section className="premium-panel">
              <div className="premium-panel-head">
                <div>
                  <span className="k">05 · Mutu bukti</span>
                  <h2>Zona sampel tipis</h2>
                </div>
                <strong>
                  {analysis.coverage.thin_sample_zones}/
                  {analysis.coverage.total_zones}
                </strong>
              </div>
              <ul className="premium-list">
                {analysis.confidence.map((zone) => (
                  <li key={zone.zone_id}>
                    <span>{zone.zone_id.slice(0, 8)}</span>
                    <span>
                      {percent(zone.confidence_score)} · {zone.sample_count}{" "}
                      sampel
                    </span>
                  </li>
                ))}
                {!analysis.confidence.length && (
                  <li>Belum ada rincian mutu data untuk simpul ini.</li>
                )}
              </ul>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
