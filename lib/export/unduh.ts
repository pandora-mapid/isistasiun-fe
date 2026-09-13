/**
 * Satu-satunya tempat yang benar-benar menyentuh DOM untuk mengunduh.
 *
 * Dipisah dari `csv.ts`/`rows.ts` supaya keduanya tetap murni dan bisa diuji
 * tanpa browser. Seluruhnya client-side: tidak ada endpoint unduhan di
 * backend, dan memang tidak perlu — datanya sudah ada di browser.
 *
 * Tidak memakai library apa pun. `Blob` + `URL.createObjectURL` + `<a download>`
 * sudah cukup, dan ini aplikasi Next.js biasa, bukan halaman dalam sandbox
 * yang memblokir unduhan.
 */

export function unduhTeks(
  namaBerkas: string,
  isi: string,
  mime = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([isi], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaBerkas;
  // Harus masuk dokumen dulu: Firefox mengabaikan klik pada anchor yang tidak
  // pernah terpasang, dan gejalanya adalah tombol yang diam saja tanpa error.
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Dibebaskan setelah klik sempat diproses; membebaskannya langsung membatalkan
  // unduhan di sebagian browser.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
