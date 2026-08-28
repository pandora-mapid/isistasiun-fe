"use client";

/**
 * Memuat seluruh data halaman Peta satu kali, lalu membagikannya.
 *
 * Sebelumnya `MapCanvas` memuat datanya sendiri. Begitu panel ringkasan juga
 * perlu angka yang sama (ROADMAP 1.2), memuatnya dua kali berarti peta dan
 * panel bisa memegang dua salinan yang berbeda. Karena itu pemuatan naik ke
 * satu tempat, dan komponen di bawahnya hanya menerima hasilnya.
 *
 * Fase 2 tidak menyentuh berkas ini — yang berubah hanya isi `source.ts`.
 */
import { useEffect, useState } from "react";
import type { FeatureCollection, Point, Polygon } from "geojson";

import {
  loadIsochrones,
  loadObservationPoints,
  loadSpendingGap,
  loadStations,
} from "./source";
import type {
  IsochroneProps,
  ObservationPointProps,
  SpendingGapPayload,
  Station,
} from "./types";

export type PetaData = {
  points: FeatureCollection<Point, ObservationPointProps> | null;
  isochrones: FeatureCollection<Polygon, IsochroneProps> | null;
  analytics: SpendingGapPayload | null;
  stations: Station[] | null;
  /** Pesan kegagalan yang layak ditampilkan, bukan hanya dicatat di console. */
  error: string | null;
};

const KOSONG: PetaData = {
  points: null,
  isochrones: null,
  analytics: null,
  stations: null,
  error: null,
};

export function usePetaData(): PetaData {
  const [data, setData] = useState<PetaData>(KOSONG);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      loadObservationPoints(),
      loadIsochrones(),
      loadSpendingGap(),
      loadStations(),
    ])
      .then(([points, isochrones, analytics, stations]) => {
        if (cancelled) return;
        setData({ points, isochrones, analytics, stations, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData({
          ...KOSONG,
          error: err instanceof Error ? err.message : "Data gagal dimuat",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
