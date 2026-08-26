import { test } from "@playwright/test";

/** Bukan tes lolos/gagal — menghasilkan tangkapan layar mode sweep. */
test("tangkapan layar sweep", async ({ page }) => {
  await page.goto("/peta?basemap=liberty", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (window as unknown as { __map?: any }).__map;
      return (
        map?.getLayer?.("point-circle") &&
        map.queryRenderedFeatures({ layers: ["point-circle"] }).length > 0
      );
    },
    undefined,
    { timeout: 30_000 },
  );

  // Dekati Manggarai supaya bangunan 3D terlihat.
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    map.jumpTo({ center: [106.8503, -6.2149], zoom: 16 });
  });
  await page.waitForTimeout(2500);

  await page.evaluate(() =>
    (
      window as unknown as {
        __map: { jumpTo: (o: Record<string, number>) => void };
      }
    ).__map.jumpTo({ pitch: 55, bearing: 40 }),
  );
  await page.waitForTimeout(3500);
  await page.screenshot({ path: "test-results/kamera-sweep.png" });

  await page.locator(".maplibregl-ctrl-compass").click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/kamera-kembali.png" });
});
