"use client";

/**
 * Satu-satunya tempat halaman Insight mengambil angka.
 *
 * Alasannya sama dengan `components/beranda/BerandaData.tsx`: sebelumnya
 * seluruh angka Insight ditulis mati di JSX, dan sebagian bertentangan dengan
 * data yang dipakai halaman Peta ("Stasiun A/B/C", ambang "n < 30" yang
 * dikarang, verdict tipologi yang tidak ada di payload). Sekarang Insight
 * membaca sumber yang sama — `usePetaData()` untuk memuat, `select.ts` untuk
 * memilih — dan tidak ada satu pun angka yang dihitung di sini maupun di JSX,
 * kecuali posisi piksel di dalam batang/kolom (persis seperti Beranda).
 *
 * Cakupan dikunci ke dua simpul: Manggarai + Sudirman (station id 1 & 2).
 * Simpul ketiga di data contoh masih placeholder ("belum ditentukan").
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  biggestGapPoint,
  findPoint,
  missingCategories,
  pointsOfStation,
  slotOf,
  totalMetrics,
} from "@/lib/analytics/select";
import { CATEGORIES, DEFAULT_SLOT, SLOTS, slotLabel } from "@/lib/data/dimensions";
import { usePetaData } from "@/lib/data/usePetaData";
import type { CategoryKey, Range, SpendingGapPayload } from "@/lib/data/types";

/** Station id yang masuk cakupan Insight. */
const CAKUPAN = new Set([1, 2]);

export type IsiSel = "Terisi" | "Kurang" | "Kosong" | "—";

export type IsiInsight = {
  siap: boolean;
  error: string | null;
  /** Titik berkesenjangan terbesar dari kedua simpul. */
  sorotan: {
    namaStasiun: string;
    namaTitik: string;
    gap: Range;
    potensi: Range;
    tertangkap: Range;
    /** Bagian potensi yang tertangkap, 0–100 — dipakai mengisi batang. */
    isiPersen: number;
  } | null;
  ringkas: {
    simpulDiamati: number;
    strukTerbaca: number;
    pintuDitahan: number;
  } | null;
  /** Kesenjangan p50 tiap slot di titik sorotan, satu skala bersama. */
  profilSlot: {
    label: string;
    jam: string;
    nilai: number | null;
    /** Tinggi kolom relatif, 0–100. */
    tinggi: number;
  }[];
  /** Titik yang estimasinya ditahan (sampel tipis). */
  sampelTipis: {
    namaTitik: string;
    namaStasiun: string;
    geraiCount: number;
    blokCount: number;
  } | null;
  temuan: {
    slotPuncak: { label: string; nilai: number | null };
    gapHarian: number | null;
    kategoriKosong: { label: string; demandShare: number | null } | null;
    arusTitik: number | null;
    pembanding: {
      namaTitik: string;
      namaStasiun: string;
      arus: number | null;
      gap: number | null;
    } | null;
  } | null;
  matriks: {
    kolomA: { namaStasiun: string; namaTitik: string };
    kolomB: { namaStasiun: string; namaTitik: string };
    baris: {
      kategori: string;
      a: IsiSel;
      b: IsiSel;
      permintaan: number | null;
    }[];
  } | null;
  jejak: { pipeline: string; dibuat: string; jenisHari: string } | null;
};

const KOSONG: IsiInsight = {
  siap: false,
  error: null,
  sorotan: null,
  ringkas: null,
  profilSlot: [],
  sampelTipis: null,
  temuan: null,
  matriks: null,
  jejak: null,
};

const Konteks = createContext<IsiInsight>(KOSONG);

/** Angka Insight. Aman dipanggil sebelum data termuat — nilainya `siap: false`. */
export function useInsight(): IsiInsight {
  return useContext(Konteks);
}

/** Batas atas skala yang enak dibaca — bulatkan ke atas ke setengah magnitudo. */
function niceCeil(v: number): number {
  if (v <= 0) return 1_000_000;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

/** Ember status sel dari jumlah gerai yang tercacah terhadap ambang 3. */
function ember(gerai: number | undefined): IsiSel {
  if (gerai === undefined) return "—";
  if (gerai === 0) return "Kosong";
  if (gerai < 3) return "Kurang";
  return "Terisi";
}

export function InsightData({ children }: { children: ReactNode }) {
  const { analytics, stations, entrances, error } = usePetaData();

  const nilai = useMemo<IsiInsight>(() => {
    if (!analytics) return { ...KOSONG, error };

    // Payload dipangkas ke cakupan dua simpul SEBELUM pemilih dijalankan,
    // supaya `biggestGapPoint`/`pointsOfStation` tidak pernah menyentuh simpul
    // ketiga yang masih placeholder.
    const scoped: SpendingGapPayload = {
      ...analytics,
      points: analytics.points.filter((p) => CAKUPAN.has(p.station_id)),
    };
    if (scoped.points.length === 0) return { ...KOSONG, error };

    const metrics = totalMetrics(scoped);
    const namaTitik = new Map<number, string>();
    for (const e of entrances ?? []) namaTitik.set(e.id, e.point_label);
    const namaStasiun = (id: number) =>
      stations?.find((s) => s.id === id)?.name ?? "Simpul";
    const labelTitik = (id: number) => namaTitik.get(id) ?? `#${id}`;

    // --- Sorotan --------------------------------------------------------
    const sorotanId = biggestGapPoint(scoped);
    const sorotanPoint = findPoint(scoped, sorotanId);
    const sorotanMetric = sorotanId === null ? null : (metrics.get(sorotanId) ?? null);

    const isiPersen =
      sorotanMetric?.potensi.p50 && sorotanMetric.tertangkap.p50 !== null
        ? Math.min(
            100,
            Math.max(
              0,
              (sorotanMetric.tertangkap.p50 / sorotanMetric.potensi.p50) * 100,
            ),
          )
        : 0;

    const sorotan =
      sorotanMetric && sorotanPoint
        ? {
            namaStasiun: namaStasiun(sorotanPoint.station_id),
            namaTitik: labelTitik(sorotanPoint.point_id),
            gap: sorotanMetric.gap,
            potensi: sorotanMetric.potensi,
            tertangkap: sorotanMetric.tertangkap,
            isiPersen,
          }
        : null;

    // --- Ringkasan hero -----------------------------------------------
    const strukTerbaca = scoped.points.reduce(
      (t, p) => t + p.evidence.struk_terbaca,
      0,
    );
    const ringkas = {
      simpulDiamati: new Set(scoped.points.map((p) => p.station_id)).size,
      strukTerbaca,
      pintuDitahan: scoped.points.filter((p) => p.sampel_tipis).length,
    };

    // --- Profil slot titik sorotan -----------------------------------
    const gapSlot = SLOTS.map((s) => ({
      label: s.label,
      jam: s.jam,
      nilai: sorotanPoint ? (slotOf(sorotanPoint, s.key)?.gap.p50 ?? null) : null,
    }));
    const puncakSkala = niceCeil(
      Math.max(0, ...gapSlot.map((g) => g.nilai ?? 0)),
    );
    const profilSlot = gapSlot.map((g) => ({
      ...g,
      tinggi: g.nilai === null ? 0 : (g.nilai / puncakSkala) * 100,
    }));

    // --- Sampel tipis ------------------------------------------------
    const titikTipis = scoped.points.find((p) => p.sampel_tipis) ?? null;
    const sampelTipis = titikTipis
      ? {
          namaTitik: labelTitik(titikTipis.point_id),
          namaStasiun: namaStasiun(titikTipis.station_id),
          geraiCount: titikTipis.sample_meta.gerai_count,
          blokCount: titikTipis.sample_meta.blok_count,
        }
      : null;

    // --- Temuan ----------------------------------------------------
    const slotPuncakIdx = gapSlot.reduce(
      (best, g, i) =>
        (g.nilai ?? -1) > (gapSlot[best]?.nilai ?? -1) ? i : best,
      0,
    );
    const kosongCat = sorotanPoint
      ? missingCategories(sorotanPoint, DEFAULT_SLOT).find(
          (c) => c.gerai_count === 0,
        )
      : undefined;
    const catLabel = (key: CategoryKey) =>
      CATEGORIES.find((c) => c.key === key)?.label ?? key;

    const otherId = sorotanPoint?.station_id === 1 ? 2 : 1;
    const pembandingMetric = pointsOfStation(metrics, otherId)[0] ?? null;
    const pembandingPoint = pembandingMetric
      ? findPoint(scoped, pembandingMetric.pointId)
      : null;
    const pembanding = pembandingPoint
      ? {
          namaTitik: labelTitik(pembandingPoint.point_id),
          namaStasiun: namaStasiun(pembandingPoint.station_id),
          arus: slotOf(pembandingPoint, DEFAULT_SLOT)?.variables?.F ?? null,
          gap: pembandingMetric?.gap.p50 ?? null,
        }
      : null;

    const temuan =
      sorotanPoint && sorotanMetric
        ? {
            slotPuncak: {
              label: gapSlot[slotPuncakIdx]?.label ?? slotLabel(DEFAULT_SLOT),
              nilai: gapSlot[slotPuncakIdx]?.nilai ?? null,
            },
            gapHarian: sorotanMetric.gap.p50,
            kategoriKosong: kosongCat
              ? {
                  label: catLabel(kosongCat.category),
                  demandShare: kosongCat.demand_share,
                }
              : null,
            arusTitik: slotOf(sorotanPoint, DEFAULT_SLOT)?.variables?.F ?? null,
            pembanding,
          }
        : null;

    // --- Matriks kategori ------------------------------------------
    const titikA = pointsOfStation(metrics, 1)[0] ?? null;
    const titikB = pointsOfStation(metrics, 2)[0] ?? null;
    const pointA = titikA ? findPoint(scoped, titikA.pointId) : null;
    const pointB = titikB ? findPoint(scoped, titikB.pointId) : null;
    const catOf = (
      point: typeof pointA,
      key: CategoryKey,
    ) =>
      point
        ? (slotOf(point, DEFAULT_SLOT)?.by_category.find(
            (c) => c.category === key,
          ) ?? null)
        : null;

    const matriks =
      pointA && pointB
        ? {
            kolomA: {
              namaStasiun: namaStasiun(pointA.station_id),
              namaTitik: labelTitik(pointA.point_id),
            },
            kolomB: {
              namaStasiun: namaStasiun(pointB.station_id),
              namaTitik: labelTitik(pointB.point_id),
            },
            baris: CATEGORIES.map((cat) => {
              const a = catOf(pointA, cat.key);
              const b = catOf(pointB, cat.key);
              return {
                kategori: cat.label,
                a: ember(a?.gerai_count),
                b: ember(b?.gerai_count),
                permintaan: a?.demand_share ?? b?.demand_share ?? null,
              };
            }),
          }
        : null;

    return {
      siap: true,
      error,
      sorotan,
      ringkas,
      profilSlot,
      sampelTipis,
      temuan,
      matriks,
      jejak: {
        pipeline: analytics.pipeline_version,
        dibuat: analytics.generated_at.slice(0, 10),
        jenisHari:
          analytics.day_type === "weekday" ? "hari kerja" : "akhir pekan",
      },
    };
  }, [analytics, stations, entrances, error]);

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}
