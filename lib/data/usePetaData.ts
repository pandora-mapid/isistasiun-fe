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
  loadEntrances,
  loadConfidenceLayer,
  loadConfidenceGrid,
  loadIsochrones,
  loadObservationPoints,
  loadRentalAssets,
  loadRentFlowIndex,
  loadSpendingGap,
  loadStations,
  loadDemoData,
} from "./source";
import type {
  IsochroneProps,
  ConfidenceLayerEntry,
  ConfidenceGridProps,
  ObservationPointProps,
  SpendingGapPayload,
  Station,
  MockDemoData,
} from "./types";
import { gabungSewa, type RentPlot } from "./rent";

export type PetaData = {
  points: FeatureCollection<Point, ObservationPointProps> | null;
  isochrones: FeatureCollection<Polygon, IsochroneProps> | null;
  analytics: SpendingGapPayload | null;
  confidence: ConfidenceLayerEntry[] | null;
  confidenceGrid: FeatureCollection<Polygon, ConfidenceGridProps> | null;
  stations: Station[] | null;
  /**
   * Nama tiap titik pengamatan — atribut, bukan geometri.
   *
   * Sengaja dipisah dari `points`: begitu geometri pindah ke tile vektor,
   * daftar fitur lengkap tidak lagi ada di browser, sementara nama titik tetap
   * harus tersedia untuk seluruh titik. Lihat ROADMAP §4.1.
   */
  entrances: ObservationPointProps[] | null;
  demo: MockDemoData | null;
  /**
   * Petak sewa: inventaris aset dengan indeks sewa/arus sudah menempel.
   *
   * Digabung di sini, sekali, karena backend menyajikan keduanya terpisah
   * sementara peta perlu satu fitur per petak — dan karena dua koleksi petak
   * yang berdiri sendiri pernah membuat peta menggambar petak yang sama dua
   * kali. `RentPlot` memperluas `RentalAsset`, jadi pemakai yang cuma butuh
   * atribut petak (panel retail, misalnya) tetap bisa menerimanya apa adanya.
   */
  rentals: RentPlot[] | null;
  /** Pesan kegagalan yang layak ditampilkan, bukan hanya dicatat di console. */
  error: string | null;
};

const KOSONG: PetaData = {
  points: null,
  isochrones: null,
  analytics: null,
  confidence: null,
  confidenceGrid: null,
  stations: null,
  entrances: null,
  demo: null,
  rentals: null,
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
      loadConfidenceLayer(),
      loadConfidenceGrid(),
      loadStations(),
      loadEntrances(),
      loadDemoData(),
      loadRentalAssets(),
      loadRentFlowIndex(),
    ])
      .then((hasil) => {
        if (cancelled) return;
        const [
          points,
          isochrones,
          analytics,
          confidence,
          confidenceGrid,
          stations,
          entrances,
          demo,
          rentalAssets,
          rentFlowIndex,
        ] = hasil;
        setData({
          points,
          isochrones,
          analytics,
          confidence,
          confidenceGrid,
          stations,
          entrances,
          demo,
          // Indeks sewa/arus ditempelkan ke inventaris petak DI SINI, bukan di
          // komponen: satu petak fisik harus jadi satu fitur peta.
          rentals: gabungSewa(rentalAssets, rentFlowIndex),
          error: null,
        });
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
