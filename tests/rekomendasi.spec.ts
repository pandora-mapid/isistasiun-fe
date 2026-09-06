import { test, expect } from "@playwright/test";

/**
 * Halaman Rekomendasi.
 *
 * Layar ini dipindah dari sistem desain slate lama ke `.paper-canvas` (sama
 * dengan Beranda, Insight & Metodologi) — restyle saja, layout & isinya tidak
 * berubah, label lama "Stasiun A/B/C" sengaja dipertahankan, dan masih mockup
 * statis tanpa data hidup. Spec ini menjaga dua hal yang sama seperti di
 * `metodologi.spec.ts`:
 *
 * 1. **Isi halaman tidak terlihat.** `.reveal` digerakkan scroll lewat
 *    `animation-timeline: view()`; kalau suatu saat memudarkan dari `opacity: 0`
 *    lagi, satu tangkapan layar penuh jadi kosong di tengah. `.reveal` HANYA
 *    boleh menggeser posisi, dan `prefers-reduced-motion` mematikannya total.
 * 2. **Migrasi tidak diam-diam mundur.** Wrapper `.page-canvas.paper-canvas`,
 *    nav aktif, judul, dan satu judul section harus tetap terbaca.
 *
 * Sengaja TIDAK menguji string data dan TIDAK menjaga terhadap "Stasiun A" —
 * di sini itu isi ilustratif yang sah.
 */

test("halaman memakai sistem desain paper", async ({ page }) => {
  await page.goto("/rekomendasi", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".page-canvas.paper-canvas")).toBeVisible();
});

test("nav menandai Rekomendasi sebagai halaman aktif", async ({ page }) => {
  await page.goto("/rekomendasi", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Rekomendasi" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("judul & satu judul section terbaca, bukan sekadar hadir di DOM", async ({
  page,
}) => {
  await page.goto("/rekomendasi", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /diisi lebih dahulu/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /tiga rekomendasi utama/i }),
  ).toBeVisible();
});

test("tidak ada isi halaman yang tersembunyi sebelum digulung", async ({
  page,
}) => {
  await page.goto("/rekomendasi", { waitUntil: "domcontentloaded" });
  await expect(page.locator("footer")).toBeVisible();

  const transparan = await page.evaluate(() =>
    [...document.querySelectorAll(".reveal")]
      .map((el, i) => ({ i, opacity: getComputedStyle(el).opacity }))
      .filter((r) => Number(r.opacity) < 1),
  );
  expect(transparan, "ada section yang tak terlihat sebelum digulung").toEqual(
    [],
  );
});

test("gerak dimatikan saat pengguna memintanya", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/rekomendasi", { waitUntil: "domcontentloaded" });
  await expect(page.locator("footer")).toBeVisible();

  const bergerak = await page.evaluate(() =>
    [...document.querySelectorAll(".reveal")].filter(
      (el) => getComputedStyle(el).animationName !== "none",
    ).length,
  );
  expect(bergerak, "masih ada animasi yang berjalan").toBe(0);
});
