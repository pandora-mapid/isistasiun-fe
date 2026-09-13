import { test, expect } from "@playwright/test";

/**
 * Halaman Metodologi.
 *
 * Layar ini dipindah dari sistem desain slate lama ke `.paper-canvas` (sama
 * dengan Beranda & Insight) — restyle saja, layout & isinya tidak berubah, dan
 * masih mockup statis tanpa data hidup. Spec ini menjaga dua hal yang sama
 * seperti di `insight.spec.ts`:
 *
 * 1. **Isi halaman tidak terlihat.** `.reveal` digerakkan scroll lewat
 *    `animation-timeline: view()`; kalau suatu saat memudarkan dari `opacity: 0`
 *    lagi, satu tangkapan layar penuh jadi kosong di tengah. `.reveal` HANYA
 *    boleh menggeser posisi, dan `prefers-reduced-motion` mematikannya total.
 * 2. **Migrasi tidak diam-diam mundur.** Wrapper `.page-canvas.paper-canvas`,
 *    nav aktif, judul, dan persamaan F × E × C × V harus tetap terbaca.
 */

test("halaman memakai sistem desain paper", async ({ page }) => {
  await page.goto("/metodologi", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".page-canvas.paper-canvas")).toBeVisible();
});

test("Metodologi tidak ditampilkan sebagai tab navigasi utama", async ({ page }) => {
  await page.goto("/metodologi", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Metodologi" }),
  ).toHaveCount(0);
});

test("judul & persamaan terbaca, bukan sekadar hadir di DOM", async ({
  page,
}) => {
  await page.goto("/metodologi", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /di mana batasnya/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Lima langkah/i }),
  ).toBeVisible();
  // Persamaan potensi F × E × C × V → Kesenjangan.
  await expect(page.getByText("Persamaan potensi")).toBeVisible();
  await expect(page.getByText("Kesenjangan", { exact: true })).toBeVisible();
});

test("tidak ada isi halaman yang tersembunyi sebelum digulung", async ({
  page,
}) => {
  await page.goto("/metodologi", { waitUntil: "domcontentloaded" });
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
  await page.goto("/metodologi", { waitUntil: "domcontentloaded" });
  await expect(page.locator("footer")).toBeVisible();

  const bergerak = await page.evaluate(() =>
    [...document.querySelectorAll(".reveal")].filter(
      (el) => getComputedStyle(el).animationName !== "none",
    ).length,
  );
  expect(bergerak, "masih ada animasi yang berjalan").toBe(0);
});
