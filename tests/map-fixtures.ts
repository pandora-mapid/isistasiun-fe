import { test as base, expect } from "@playwright/test";

/**
 * Basemap kosong untuk smoke test MapLibre. Data aplikasi tetap berjalan;
 * hanya jaringan MAPID/OpenFreeMap yang dipotong supaya test tidak menunggu
 * tile, glyph, dan sprite pihak ketiga.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    const emptyStyle = {
      version: 8,
      sources: {},
      layers: [],
    };
    await page.route("**/styles/basic/style.json?**", (route) =>
      route.fulfill({ json: emptyStyle }),
    );
    await page.route("https://tiles.openfreemap.org/styles/liberty", (route) =>
      route.fulfill({ json: emptyStyle }),
    );
    await provide(page);
  },
});

export { expect };
