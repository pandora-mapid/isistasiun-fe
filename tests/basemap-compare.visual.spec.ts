import { test } from "@playwright/test";

import { BASEMAP_NAMES } from "../lib/map/config";

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
/**
 * `mapid` hanya menghasilkan tangkapan layar kalau `NEXT_PUBLIC_BASEMAP_URL`
 * terisi di `.env.local` — URL-nya membawa API key, jadi tidak bisa ditulis di
 * repo. Tanpa itu, `resolveBasemapUrl()` jatuh ke basemap bawaan dan gambarnya
 * jadi duplikat Liberty; bukan kegagalan, hanya tidak berguna dibandingkan.
 */
for (const nama of BASEMAP_NAMES) {
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
