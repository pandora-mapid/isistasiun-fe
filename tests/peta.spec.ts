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
  // Response 4xx/5xx BUKAN "request failed" — pertukaran HTTP-nya berhasil,
  // hanya isinya galat. Tanpa pendengar ini, hal seperti glyph font yang 404
  // hanya muncul sebagai error console anonim tanpa menyebut URL-nya, dan
  // labelnya hilang diam-diam.
  page.on("response", (res) => {
    if (res.status() >= 400) {
      failedRequests.push(`${res.status()} ${res.url()}`);
    }
  });

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

  // Yang paling penting: fitur benar-benar TERGAMBAR, bukan sekadar ada di
  // dalam source. `isSourceLoaded` sengaja tidak diperiksa — nilainya wajar
  // berubah-ubah saat tile GeoJSON diregenerasi, jadi bukan invarian.
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

test("klik compass meratakan ke 2D tanpa berpindah tempat", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  /** Keadaan kamera saat ini. */
  const kamera = () =>
    page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (window as unknown as { __map?: any }).__map;
      const c = map.getCenter();
      return {
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        zoom: map.getZoom(),
        lng: c.lng,
        lat: c.lat,
      };
    });

  // Tampilan awal tegak lurus menghadap utara.
  const awal = await kamera();
  expect(Math.abs(awal.pitch)).toBeLessThan(1);
  expect(Math.abs(awal.bearing)).toBeLessThan(1);

  // Miringkan dan putar kamera, lalu geser ke tempat lain — meniru pengguna
  // yang sedang memeriksa satu simpul dari sudut miring.
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    map.jumpTo({
      center: [106.8503, -6.2149],
      zoom: 16,
      pitch: 55,
      bearing: 40,
    });
  });
  const miring = await kamera();
  expect(miring.pitch).toBeGreaterThan(50);

  // Ratakan lewat compass. Karena `visualizePitch: true`, MapLibre memanggil
  // `resetNorthPitch()` — bearing DAN pitch ke nol, pusat peta tidak bergeser.
  // Tidak ada tombol ratakan buatan sendiri; compass sudah melakukannya.
  await page.locator(".maplibregl-ctrl-compass").click();
  await expect
    .poll(async () => (await kamera()).pitch, { timeout: 10_000 })
    .toBeLessThan(1);
  await expect
    .poll(async () => Math.abs((await kamera()).bearing), { timeout: 10_000 })
    .toBeLessThan(1);

  // Yang penting: TETAP di tempat yang sedang dilihat, tidak melompat kembali
  // ke ikhtisar tiga stasiun.
  const sesudah = await kamera();
  expect(sesudah.zoom, "zoom ikut berubah padahal seharusnya tetap").toBeCloseTo(
    miring.zoom,
    1,
  );
  expect(
    Math.abs(sesudah.lng - miring.lng),
    "peta berpindah tempat padahal seharusnya diam",
  ).toBeLessThan(0.01);
  expect(Math.abs(sesudah.lat - miring.lat)).toBeLessThan(0.01);

  // Titik pengamatan tetap tergambar.
  const tergambar = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    return map.queryRenderedFeatures({ layers: ["point-circle"] }).length;
  });
  expect(tergambar).toBeGreaterThan(0);
});

test("kemiringan dibatasi supaya pandangan tidak menatap cakrawala", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  const pitch = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    map.jumpTo({ pitch: 85 }); // coba melebihi batas
    return { sekarang: map.getPitch(), maks: map.getMaxPitch() };
  });

  expect(pitch.maks, "batas kemiringan tidak disetel").toBeLessThanOrEqual(60);
  expect(pitch.sekarang, "kemiringan melampaui batas").toBeLessThanOrEqual(60);
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
