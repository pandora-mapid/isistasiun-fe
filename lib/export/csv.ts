/**
 * Ekspor CSV — merangkai teks, tidak menyentuh DOM.
 *
 * Sengaja murni supaya bisa diuji tanpa browser, sama alasannya dengan
 * `lib/analytics/select.ts`: kesalahan di sini muncul sebagai **angka yang
 * salah di dalam berkas yang sudah diunduh orang**, bukan sebagai halaman
 * rusak — tangkapan layar maupun validator layer tidak akan melihatnya.
 *
 * Dua aturan yang dijaga di sini, keduanya soal kejujuran angka:
 *
 * 1. **Yang tidak diestimasi ditulis kosong, bukan `0`.** Sel kosong di
 *    spreadsheet tidak ikut dirata-rata dan tidak ikut dijumlahkan; `0` ikut,
 *    dan diam-diam menyeret turun setiap ringkasan yang dibuat penerimanya.
 *    Ini `DATA_CONTRACT §C1` yang dibawa sampai ke luar aplikasi.
 * 2. **Desimal memakai titik, pemisah kolom memakai koma.** Bukan format
 *    Indonesia — tapi CSV dibaca mesin. Menulis `1.234,5` ala `id-ID` membuat
 *    setiap angka pecah jadi dua kolom di Excel, dan bilangan bulat berubah
 *    arti. Tulisan untuk manusia tetap `id-ID` di layar.
 */

/** Satu baris CSV sudah dalam bentuk nilai siap tulis. */
export type CsvValue = string | number | null | undefined | boolean;

/**
 * Membungkus satu sel sesuai RFC 4180: tanda kutip digandakan, dan sel yang
 * mengandung koma, kutip, atau baris baru dibungkus kutip.
 *
 * Nama gerai dan catatan lapangan memang bisa mengandung koma ("SPACE
 * EMPLASEMEN STASIUN MANGGARAI 50,09M (OUTLET CFC)"), jadi ini bukan kasus
 * teoretis — tanpa pembungkusan, satu baris itu pecah jadi dua kolom.
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "ya" : "tidak";
  const text = typeof value === "number" ? String(value) : value;
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/**
 * Merangkai header + baris menjadi satu teks CSV.
 *
 * Diawali BOM UTF-8. Tanpa itu Excel di Windows membaca berkasnya sebagai
 * ANSI dan setiap "×", "–", dan huruf beraksen di nama titik berubah jadi
 * karakter sampah — persis kelas kesalahan yang tidak pernah terlihat sampai
 * berkasnya sudah dikirim ke orang lain.
 */
export function toCsv(header: string[], rows: CsvValue[][]): string {
  const lines = [header.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * Nama berkas yang menerangkan isinya sendiri.
 *
 * Penerima berkas ini tidak punya layar yang menunjukkan filter mana yang
 * sedang aktif, jadi namanya yang harus membawanya: tanpa itu, dua ekspor
 * dari slot berbeda tersimpan sebagai dua berkas yang tak bisa dibedakan.
 */
export function namaBerkas(bagian: (string | null | undefined)[], ekstensi = "csv"): string {
  const bersih = bagian
    .filter((b): b is string => Boolean(b && b.trim()))
    .map((b) =>
      b
        .toLocaleLowerCase("id")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean);
  return `${["isi-stasiun", ...bersih].join("_")}.${ekstensi}`;
}
