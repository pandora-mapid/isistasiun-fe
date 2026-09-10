import { test, expect } from "@playwright/test";

/**
 * Halaman Insight.
 *
 * Dua kelas kegagalan yang dijaga di sini — keduanya sudah pernah terjadi di
 * Beranda dan dijaga sama persis:
 *
 * 1. **Isi halaman tidak terlihat.** Reveal digerakkan scroll lewat
 *    `animation-timeline: view()`. Versi pertama di Beranda memudarkan dari
 *    `opacity: 0`, dan tangkapan layar satu halaman penuh menghasilkan hero +
 *    penutup saja, seluruh bagian tengah kosong. Reveal HANYA boleh menggeser
 *    posisi.
 * 2. **Angka karangan kembali.** Insight dulu menulis "Stasiun A/B/C", ambang
 *    "n < 30" yang dikarang, dan "tiga simpul" — semuanya bertentangan dengan
 *    data mock / dokumen. Penjaga supaya tidak balik.
 */

test("halaman memakai sistem desain paper", async ({ page }) => {
  await page.goto("/insight", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".page-canvas.paper-canvas")).toBeVisible();
});

test("nav menandai Insight sebagai halaman aktif", async ({ page }) => {
  await page.goto("/insight", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Insight" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("judul terbaca, bukan sekadar hadir di DOM", async ({ page }) => {
  await page.goto("/insight", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /dari dua simpul/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Pagi menahan kesenjangan terbesar/i }),
  ).toBeVisible();
});

/**
 * Angka Insight dipetik dari `usePetaData()` — beberapa asersi menunggu
 * seluruh rantai fetch data mock selesai. Di bawah suite paralel penuh, dev
 * server (kompilasi on-demand) bisa lambat menyajikannya, jadi asersi yang
 * bergantung data diberi tenggang lebih panjang dari bawaan 5 dtk.
 */
const TUNGGU_DATA = { timeout: 15_000 };

test("angka lama yang dikarang tidak ada, cakupan dua simpul terbaca", async ({
  page,
}) => {
  await page.goto("/insight", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Manggarai").first()).toBeVisible(TUNGGU_DATA);
  await expect(page.getByText("Sudirman").first()).toBeVisible(TUNGGU_DATA);

  await expect(page.getByText("Stasiun A")).toHaveCount(0);
  await expect(page.getByText("Stasiun C")).toHaveCount(0);
  await expect(page.getByText(/tiga simpul/i)).toHaveCount(0);
  await expect(page.getByText(/n\s*<\s*30/)).toHaveCount(0);
  // Aturan sampel tipis yang benar ditampilkan.
  await expect(page.getByText(/3 gerai . 2 blok/).first()).toBeVisible();
});

test("angka dipetik dari data yang sama dengan halaman Peta", async ({
  page,
}) => {
  await page.goto("/insight", { waitUntil: "domcontentloaded" });

  // Kesenjangan harian terbesar di dua simpul = titik 12 Manggarai, Rp 2,9 jt.
  await expect(page.getByText("Rp 2,9 jt").first()).toBeVisible(TUNGGU_DATA);
  await expect(page.getByText("Koridor Transit Utara").first()).toBeVisible(TUNGGU_DATA);

  // Jejak asal data ikut disebut, sama seperti di Beranda dan Peta.
  await expect(page.getByText(/pipeline mock-/)).toBeVisible(TUNGGU_DATA);
});

test("tidak ada isi halaman yang tersembunyi sebelum digulung", async ({
  page,
}) => {
  await page.goto("/insight", { waitUntil: "domcontentloaded" });
  // Beri layout + font kesempatan settle sebelum membaca opacity.
  await expect(page.locator("footer")).toBeVisible();

  const transparan = await page.evaluate(() =>
    [...document.querySelectorAll(".reveal")]
      .map((el, i) => ({ i, opacity: getComputedStyle(el).opacity }))
      .filter((r) => Number(r.opacity) < 1),
  );
  expect(transparan, "ada section yang tak terlihat sebelum digulung").toEqual([]);
});

test("gerak dimatikan saat pengguna memintanya", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/insight", { waitUntil: "domcontentloaded" });
  await expect(page.locator("footer")).toBeVisible();

  const bergerak = await page.evaluate(() =>
    [...document.querySelectorAll(".reveal")].filter(
      (el) => getComputedStyle(el).animationName !== "none",
    ).length,
  );
  expect(bergerak, "masih ada animasi yang berjalan").toBe(0);
});
