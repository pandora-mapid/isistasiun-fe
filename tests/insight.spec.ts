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

test("angka lama yang dikarang tidak ada, cakupan dua simpul terbaca", async ({
  page,
}) => {
  await page.goto("/insight", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("Manggarai").first()).toBeVisible();
  await expect(page.getByText("Sudirman").first()).toBeVisible();

  await expect(page.getByText("Stasiun A")).toHaveCount(0);
  await expect(page.getByText("Stasiun C")).toHaveCount(0);
  await expect(page.getByText(/tiga simpul/i)).toHaveCount(0);
  await expect(page.getByText(/n\s*<\s*30/)).toHaveCount(0);
  // Aturan sampel tipis yang benar ditampilkan.
  await expect(page.getByText(/3 gerai . 2 blok/).first()).toBeVisible();
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
