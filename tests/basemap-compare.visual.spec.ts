import { test } from "@playwright/test";

/**
 * Membandingkan pilihan basemap secara visual, pada pemandangan yang sama
 * dan dengan lapisan data terpasang.
 *
 * Bukan tes lolos/gagal — keluarannya tangkapan layar di `test-results/`
 * untuk dilihat manusia. Basemap masih keputusan terbuka (lihat
 * DATA_CONTRACT.md Bagian D), jadi ini alat bantu memilih.
 *
 * Jalankan: npx playwright test tests/basemap-compare.spec.ts
 */
const PILIHAN = ["positron", "voyager", "liberty", "bright"] as const;

for (const nama of PILIHAN) {
  test(`basemap ${nama}`, async ({ page }) => {
    await page.goto(`/peta?basemap=${nama}`, { waitUntil: "domcontentloaded" });

    await page.waitForFunction(
      () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (window as unknown as { __map?: any }).__map;
        if (!map?.getLayer?.("point-circle")) return false;
        return map.queryRenderedFeatures({ layers: ["point-circle"] }).length > 0;
      },
      undefined,
      { timeout: 30_000 },
    );

    // Dekatkan ke satu stasiun supaya tingkat detail terlihat jujur —
    // pemandangan seluruh kota membuat semua basemap tampak sama sepinya.
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (window as unknown as { __map?: any }).__map;
      map.jumpTo({ center: [106.8503, -6.2149], zoom: 16 });
    });
    await page.waitForTimeout(4000);

    await page.screenshot({ path: `test-results/basemap-${nama}.png` });
  });
}
