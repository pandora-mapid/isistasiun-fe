/**
 * Dimensi yang dipakai untuk memotong data: slot waktu dan kategori usaha.
 *
 * Dikumpulkan di sini karena dua pihak membutuhkannya dan keduanya harus
 * sepakat: pemilih di panel (tampilan) dan penyaring angka (logika). Kalau
 * daftarnya digandakan, cukup satu label meleset untuk membuat filter memilih
 * slot yang salah tanpa pesan error apa pun.
 *
 * `key` adalah kunci yang dipakai data (DATA_CONTRACT §B3 nomor 4 dan 5) —
 * `label` hanya tulisan di layar dan bebas diubah.
 */
import type { CategoryKey, SlotKey } from "./types";

export type SlotDef = {
  key: SlotKey;
  /** Tulisan pendek di tombol. */
  label: string;
  /** Rentang jam sesungguhnya yang dicacah (proposal §5.2). */
  jam: string;
};

/**
 * Empat slot yang benar-benar dicacah. Jam di antaranya tidak diinterpolasi —
 * itu sebabnya slot bersifat pilihan, bukan penggeser waktu.
 *
 * Perhatikan `label` dan `jam` berbeda: tombolnya tertulis "16–19" mengikuti
 * desain, sedangkan yang dicacah adalah 16.00–18.59 (ROADMAP §7).
 */
export const SLOTS: readonly SlotDef[] = [
  { key: "pagi", label: "06–09", jam: "06.00–08.59" },
  { key: "siang", label: "11–14", jam: "11.00–13.59" },
  { key: "sore", label: "16–19", jam: "16.00–18.59" },
  { key: "malam", label: "19–21", jam: "19.00–20.59" },
] as const;

export const DEFAULT_SLOT: SlotKey = "pagi";

export type CategoryDef = { key: CategoryKey; label: string };

export const CATEGORIES: readonly CategoryDef[] = [
  { key: "fnb", label: "F&B" },
  { key: "ritel", label: "Ritel" },
  { key: "apotek", label: "Apotek" },
  { key: "jasa", label: "Jasa" },
  { key: "lainnya", label: "Lainnya" },
] as const;

/** Nilai filter kategori saat tidak ada kategori tertentu yang dipilih. */
export const ALL_CATEGORIES = "semua" as const;

/** Pilihan filter kategori: satu kategori, atau seluruhnya. */
export type CategoryFilter = CategoryKey | typeof ALL_CATEGORIES;

export function slotLabel(key: SlotKey): string {
  return SLOTS.find((s) => s.key === key)?.label ?? key;
}

export function categoryLabel(key: CategoryFilter): string {
  if (key === ALL_CATEGORIES) return "Semua";
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
