import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";

/**
 * Halaman Beranda.
 *
 * Dua kelas kegagalan yang dijaga di sini, dan keduanya sudah pernah terjadi:
 *
 * 1. **Peta hero kosong tanpa pesan.** Sama persis dengan tiga bug yang membuat
 *    `tests/peta.spec.ts` ada — jadi yang diperiksa bukan "halaman terbuka",
 *    melainkan fitur benar-benar TERGAMBAR.
 * 2. **Isi halaman tidak terlihat.** Versi pertama reveal-nya memudarkan dari
 *    `opacity: 0` lewat `animation-timeline: view()`. Halaman tampak normal
 *    saat digulung, tapi tangkapan layar satu halaman penuh menghasilkan hero
 *    dan penutup saja — seluruh bagian tengah kosong. Untuk halaman yang akan
 *    dinilai juri, itu kegagalan diam-diam yang paling mahal.
 */

/** Menunggu peta hero siap dan benar-benar menggambar titik. */
async function tungguPeta(page: Page) {
  await page.waitForFunction(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (window as unknown as { __map?: any }).__map;
      if (!map?.getLayer?.("point-circle")) return false;
      return map.queryRenderedFeatures({ layers: ["point-circle"] }).length > 0;
    },
    undefined,
    // 40 dtk: di bawah suite paralel penuh, dev server + render SwiftShader bisa
    // selambat itu untuk menggambar fitur pertama. Masih < `timeout` tes.
    { timeout: 40_000 },
  );
}

test("peta hero menggambar titik pengamatan tanpa error", async ({ page }) => {
  const consoleErrors: string[] = [];
  const gagal: string[] = [];
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
  // 4xx/5xx BUKAN "request failed" — pertukaran HTTP-nya berhasil, isinya yang
  // galat. Tanpa pendengar ini, glyph font yang 404 hanya muncul sebagai error
  // console anonim dan seluruh label hilang diam-diam.
  page.on("response", (r) => {
    if (r.status() >= 400) gagal.push(`${r.status()} ${r.url()}`);
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await tungguPeta(page);

  const jumlah = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    return map.queryRenderedFeatures({ layers: ["point-circle"] }).length;
  });
  expect(jumlah, "tidak ada titik yang tergambar di peta hero").toBeGreaterThan(0);

  expect(consoleErrors, "ada error di console browser").toEqual([]);
  expect(gagal, "ada request yang gagal").toEqual([]);
});

test("peta hero tidak interaktif dan tidak menelan gulungan halaman", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await tungguPeta(page);

  const keadaan = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    return {
      geser: map.dragPan.isEnabled(),
      gulung: map.scrollZoom.isEnabled(),
      kendali: document.querySelectorAll(".maplibregl-ctrl-compass").length,
    };
  });

  expect(keadaan.geser, "peta hero masih bisa digeser").toBe(false);
  expect(keadaan.gulung, "peta hero masih menelan gulungan halaman").toBe(false);
  expect(keadaan.kendali, "kendali navigasi tidak seharusnya dipasang").toBe(0);
});

test("angka di Beranda datang dari data yang sama dengan halaman Peta", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await tungguPeta(page);

  // Versi lama menulis "Stasiun A/B/C" beserta tipologi dan jumlah pintu yang
  // dibantah `stations.json` — halaman depan membantah halaman produknya
  // sendiri. Ini penjaga supaya itu tidak kembali.
  await expect(page.getByText("Manggarai").first()).toBeVisible();
  await expect(page.getByText("Sudirman").first()).toBeVisible();
  await expect(page.getByText("Stasiun A")).toHaveCount(0);

  // Jejak asal data ikut disebut, sama seperti di halaman Peta.
  await expect(page.getByText(/pipeline mock-/)).toBeVisible();
});

test("tidak ada isi halaman yang tersembunyi sebelum digulung", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await tungguPeta(page);

  // Penjaga langsung untuk bug halaman kosong: berapa pun jauhnya sebuah
  // section dari viewport, ia TIDAK BOLEH transparan. Reveal hanya boleh
  // menggeser posisi, tidak pernah memudarkan.
  const transparan = await page.evaluate(() =>
    [...document.querySelectorAll(".reveal")]
      .map((el, i) => ({ i, opacity: getComputedStyle(el).opacity }))
      .filter((r) => Number(r.opacity) < 1),
  );
  expect(transparan, "ada section yang tak terlihat sebelum digulung").toEqual([]);

  // Dan isinya memang terbaca, bukan sekadar hadir di DOM.
  await expect(
    page.getByText("Empat variabel, satu instrumen."),
  ).toBeVisible();
  await expect(page.getByText("Tiga simpul, tiga tipe kawasan.")).toBeVisible();
});

test("gerak dimatikan saat pengguna memintanya", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await tungguPeta(page);

  const bergerak = await page.evaluate(() =>
    [...document.querySelectorAll(".reveal, .draw, .draw-dot")].filter(
      (el) => getComputedStyle(el).animationName !== "none",
    ).length,
  );
  expect(bergerak, "masih ada animasi yang berjalan").toBe(0);
});
