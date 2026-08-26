import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";

/**
 * Smoke test halaman Peta di browser sungguhan.
 *
 * Tes ini ada karena tiga kegagalan yang semuanya lolos dari typecheck dan
 * lint, dan semuanya membuat peta kosong tanpa satu pun pesan error:
 *
 * 1. `feature-state` dipakai di dalam `filter` — layer ditolak MapLibre
 * 2. `["zoom"]` bersarang di dalam `case` — paint ditolak MapLibre
 * 3. worker MapLibre menunjuk ke alamat yang salah — tidak ada tile diminta
 *
 * Karena itu yang diperiksa bukan sekadar "halaman terbuka", melainkan bahwa
 * fitur benar-benar TERGAMBAR di peta.
 */

/** Menunggu peta siap: instance terpapar, layer terpasang, fitur tergambar. */
async function waitForMapReady(page: Page) {
  await page.waitForFunction(
    () => Boolean((window as unknown as { __map?: unknown }).__map),
    undefined,
    { timeout: 30_000 },
  );
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
}

test("peta menggambar titik pengamatan dan isochrone tanpa error", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) =>
    failedRequests.push(`${req.url()} — ${req.failure()?.errorText ?? "gagal"}`),
  );

  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  const state = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    const style = map.getStyle();
    const canvas = map.getCanvas();
    return {
      layerIds: (style?.layers ?? []).map((l: { id: string }) => l.id),
      sourceIds: Object.keys(style?.sources ?? {}),
      canvas: { w: canvas.width, h: canvas.height },
      renderedPoints: map.queryRenderedFeatures({ layers: ["point-circle"] })
        .length,
      renderedIsochrones: map.queryRenderedFeatures({
        layers: ["isochrone-fill"],
      }).length,
      pointSourceLoaded: map.isSourceLoaded("observation-points"),
    };
  });

  // kanvas punya ukuran nyata
  expect(state.canvas.w).toBeGreaterThan(200);
  expect(state.canvas.h).toBeGreaterThan(200);

  // source dan layer terpasang
  expect(state.sourceIds).toContain("observation-points");
  expect(state.sourceIds).toContain("isochrones");
  for (const id of ["isochrone-fill", "isochrone-line", "point-circle"]) {
    expect(state.layerIds, `layer ${id} tidak terpasang`).toContain(id);
  }

  // yang paling penting: fitur benar-benar tergambar, bukan sekadar ada
  expect(state.pointSourceLoaded, "source titik belum selesai dimuat").toBe(true);
  expect(
    state.renderedPoints,
    "tidak ada titik pengamatan yang tergambar di peta",
  ).toBeGreaterThan(0);
  expect(
    state.renderedIsochrones,
    "tidak ada isochrone yang tergambar di peta",
  ).toBeGreaterThan(0);

  expect(consoleErrors, "ada error di console browser").toEqual([]);
  expect(failedRequests, "ada request yang gagal").toEqual([]);
});

test("filter kawasan tangkapan hanya menampilkan durasi yang dipilih", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  /** Durasi isochrone yang benar-benar tergambar saat ini. */
  const renderedDurations = () =>
    page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (window as unknown as { __map?: any }).__map;
      const feats = map.queryRenderedFeatures({ layers: ["isochrone-fill"] });
      const durations = feats.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (f: any) => f.properties?.duration_min as number,
      );
      return [...new Set<number>(durations)].sort((a, b) => a - b);
    });

  // Nilai awal di PetaScreen adalah 5 menit.
  expect(await renderedDurations(), "durasi awal seharusnya hanya 5").toEqual([
    5,
  ]);

  // Buka panel lapisan. Toggle-nya `div` ber-onClick, bukan <button>.
  await page.locator(".layers-toggle").click();
  await page.getByText("10 mnt", { exact: true }).click();
  await expect
    .poll(renderedDurations, { timeout: 15_000 })
    .toEqual([10]);

  // Lalu ke 3 menit.
  await page.getByText("3 mnt", { exact: true }).click();
  await expect.poll(renderedDurations, { timeout: 15_000 }).toEqual([3]);
});
