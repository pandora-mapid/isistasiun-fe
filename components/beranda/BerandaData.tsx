"use client";

/**
 * Satu-satunya tempat halaman Beranda mengambil angka.
 *
 * Sebelumnya seluruh angka di layar ini ditulis mati di dalam JSX — dan
 * angkanya **bertentangan dengan data yang dipakai halaman Peta**: nama stasiun
 * ("Stasiun A/B/C" vs Manggarai/Sudirman), tipologinya, bahkan jumlah pintunya
 * (5 vs 3). Halaman depan membantah halaman produknya sendiri, dan itu melanggar
 * janji utama proposal — setiap angka bisa dilacak asalnya (ROADMAP §9 nomor 4).
 *
 * Karena itu Beranda kini membaca sumber yang sama persis dengan Peta:
 * `usePetaData()` untuk memuat, `lib/analytics/select.ts` untuk memilih. Tidak
 * ada satu pun angka yang dihitung di sini maupun di dalam JSX — semuanya
 * dipetik dari payload.
 *
 * Dimuat **sekali** lewat satu provider, bukan sekali per komponen: peta hero
 * dan kartu simpul harus mustahil memegang dua salinan angka yang berbeda.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { FeatureCollection, Point, Polygon } from "geojson";

import {
  biggestGapPoint,
  confidenceDomainOf,
  domainOf,
  findPoint,
  pointsOfStation,
  slotOf,
  totalMetrics,
  type Domain,
  type PointMetric,
} from "@/lib/analytics/select";
import { DEFAULT_SLOT, SLOTS, slotLabel } from "@/lib/data/dimensions";
import { usePetaData } from "@/lib/data/usePetaData";
import type {
  IsochroneProps,
  ObservationPointProps,
  PointAnalytics,
  PointFeatureState,
  SlotKey,
  Station,
  Variables,
} from "@/lib/data/types";

/** Nilai satu batang sparkline: satu slot, satu angka yang memang ada. */
export type SlotNilai = { key: SlotKey; label: string; jam: string; nilai: number | null };

/** Ringkasan satu stasiun untuk kartu simpul. */
export type SimpulRingkas = {
  station: Station;
  /**
   * Titik dengan kesenjangan terbesar di stasiun itu.
   *
   * Kartu menyebut satu titik, BUKAN jumlah seluruh titik stasiun. Payload
   * tidak menyediakan angka setingkat stasiun, jadi menjumlahkannya berarti
   * mengarang. Memilih titik terbesar tetap bisa dilacak ke satu baris data.
   */
  titik: PointAnalytics | null;
  metric: PointMetric | null;
  namaTitik: string;
  slot: SlotNilai[];
};

export type IsiBeranda = {
  siap: boolean;
  error: string | null;
  /** Persis prop yang dibutuhkan `MapCanvas`. `null` selama belum termuat. */
  peta: {
    points: FeatureCollection<Point, ObservationPointProps>;
    isochrones: FeatureCollection<Polygon, IsochroneProps>;
    featureStates: Map<number, PointFeatureState>;
    gapDomain: Domain;
    confidenceDomain: Domain;
  } | null;
  /** Simpul berkesenjangan terbesar — angka yang dipajang di hero. */
  sorotan: {
    namaStasiun: string;
    namaTitik: string;
    metric: PointMetric;
    slot: SlotNilai[];
  } | null;
  simpul: SimpulRingkas[];
  /**
   * Satu contoh nyata uraian F × E × C × V, dipakai section persamaan.
   *
   * Selalu dari satu titik pada satu slot — tidak pernah dirata-ratakan antar
   * slot. Keempat variabel itu hanya dicacah per slot, jadi angka "rata-rata
   * sehari" tidak pernah benar-benar diukur oleh siapa pun.
   */
  contohVariabel: {
    namaStasiun: string;
    namaTitik: string;
    slot: string;
    jam: string;
    variables: Variables;
  } | null;
  /** Jejak asal data, dipakai footer. */
  jejak: { pipeline: string; dibuat: string; jenisHari: string } | null;
};

const KOSONG: IsiBeranda = {
  siap: false,
  error: null,
  peta: null,
  sorotan: null,
  simpul: [],
  contohVariabel: null,
  jejak: null,
};

const Konteks = createContext<IsiBeranda>(KOSONG);

/** Angka Beranda. Aman dipanggil sebelum data termuat — nilainya `siap: false`. */
export function useBeranda(): IsiBeranda {
  return useContext(Konteks);
}

/** Empat slot beserta angkanya untuk satu titik. Semuanya dipetik, bukan dihitung. */
function slotNilai(point: PointAnalytics | null): SlotNilai[] {
  return SLOTS.map((s) => ({
    key: s.key,
    label: s.label,
    jam: s.jam,
    nilai: point ? (slotOf(point, s.key)?.gap.p50 ?? null) : null,
  }));
}

export function BerandaData({ children }: { children: ReactNode }) {
  const { points, isochrones, analytics, stations, entrances, error } =
    usePetaData();

  const nilai = useMemo<IsiBeranda>(() => {
    if (!analytics) return { ...KOSONG, error };

    // Skala hero mengikuti kesenjangan setingkat HARI, sepadan dengan angka
    // yang tertulis di sebelahnya. Memakai skala satu slot akan membuat
    // lingkaran di peta dan angka di kartu bercerita dua hal berbeda.
    const metrics = totalMetrics(analytics);
    const namaTitik = new Map<number, string>();
    for (const e of entrances ?? []) namaTitik.set(e.id, e.point_label);

    const featureStates = new Map<number, PointFeatureState>();
    for (const [id, m] of metrics) {
      featureStates.set(id, {
        gap: m.gap.p50 ?? 0,
        sampel_tipis: m.sampelTipis,
        confidence: m.confidence,
      });
    }

    const idSorotan = biggestGapPoint(analytics);
    const titikSorotan = findPoint(analytics, idSorotan);
    const metricSorotan = idSorotan === null ? null : (metrics.get(idSorotan) ?? null);
    const stasiunSorotan = stations?.find(
      (s) => s.id === titikSorotan?.station_id,
    );

    const simpul: SimpulRingkas[] = (stations ?? []).map((station) => {
      const teratas = pointsOfStation(metrics, station.id)[0] ?? null;
      const titik = teratas ? findPoint(analytics, teratas.pointId) : null;
      return {
        station,
        titik,
        metric: teratas,
        namaTitik: teratas
          ? (namaTitik.get(teratas.pointId) ?? `#${teratas.pointId}`)
          : "—",
        slot: slotNilai(titik),
      };
    });

    return {
      siap: true,
      error,
      peta:
        points && isochrones
          ? {
              points,
              isochrones,
              featureStates,
              gapDomain: domainOf(metrics.values()),
              confidenceDomain: confidenceDomainOf(metrics.values()),
            }
          : null,
      sorotan:
        metricSorotan && titikSorotan
          ? {
              namaStasiun: stasiunSorotan?.name ?? "Simpul",
              namaTitik:
                namaTitik.get(titikSorotan.point_id) ??
                `#${titikSorotan.point_id}`,
              metric: metricSorotan,
              slot: slotNilai(titikSorotan),
            }
          : null,
      simpul,
      contohVariabel: (() => {
        const slotRow = titikSorotan ? slotOf(titikSorotan, DEFAULT_SLOT) : null;
        if (!titikSorotan || !slotRow?.variables) return null;
        return {
          namaStasiun: stasiunSorotan?.name ?? "Simpul",
          namaTitik:
            namaTitik.get(titikSorotan.point_id) ?? `#${titikSorotan.point_id}`,
          slot: slotLabel(DEFAULT_SLOT),
          jam: SLOTS.find((s) => s.key === DEFAULT_SLOT)?.jam ?? "",
          variables: slotRow.variables,
        };
      })(),
      jejak: {
        pipeline: analytics.pipeline_version,
        dibuat: analytics.generated_at.slice(0, 10),
        jenisHari: analytics.day_type === "weekday" ? "hari kerja" : "akhir pekan",
      },
    };
  }, [points, isochrones, analytics, stations, entrances, error]);

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}
