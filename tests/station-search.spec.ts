import { test, expect } from "@playwright/test";
import type { Map as MapLibreMap } from "maplibre-gl";

test.beforeEach(async ({ page }) => {
  // Pencarian tidak bergantung pada jaringan penyedia basemap.
  await page.route("**/styles/basic/style.json?**", (route) => route.fulfill({
    json: { version: 8, sources: {}, layers: [] },
  }));
  await page.route("https://tiles.openfreemap.org/styles/liberty", (route) => route.fulfill({
    json: { version: 8, sources: {}, layers: [] },
  }));
  await page.goto("/peta");
});

test("cari stasiun lewat keyboard dan klik memindahkan kamera serta pilihan titik", async ({ page }) => {
  const search = page.getByRole("combobox", { name: "Cari stasiun" });
  await search.fill("sUDir");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("Enter");
  await expect.poll(() => page.evaluate(() => {
    const map = (window as unknown as { __map?: MapLibreMap }).__map;
    if (!map || map.isMoving()) return null;
    return { lng: Number(map.getCenter().lng.toFixed(5)), lat: Number(map.getCenter().lat.toFixed(5)),
      selected: map.getFeatureState({ source: "observation-points", id: 21 }).terpilih };
  })).toEqual({ lng: 106.8224, lat: -6.202, selected: true });

  await page.getByRole("button", { name: "Hapus pencarian stasiun" }).click();
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.getByRole("option", { name: /Stasiun Manggarai/ }).click();
  await expect.poll(() => page.evaluate(() => {
    const map = (window as unknown as { __map: MapLibreMap }).__map;
    return !map.isMoving() && Math.abs(map.getCenter().lng - 106.85005) < 0.00001;
  })).toBe(true);

  // Stasiun yang sama tetap bisa dipilih kembali setelah peta digeser.
  await page.evaluate(() => (window as unknown as { __map: MapLibreMap }).__map.jumpTo({ center: [107, -6] }));
  await search.focus();
  await search.press("Enter");
  await expect.poll(() => page.evaluate(() => {
    const map = (window as unknown as { __map: MapLibreMap }).__map;
    return !map.isMoving() && Math.abs(map.getCenter().lng - 106.85005) < 0.00001;
  })).toBe(true);
});

test("hasil kosong, navigasi panah, dan Escape", async ({ page }) => {
  const search = page.getByRole("combobox", { name: "Cari stasiun" });
  await search.fill("stasiun tidak ada");
  await expect(page.getByRole("status")).toContainText("Stasiun tidak ditemukan");
  await search.press("Enter");
  await expect(search).toHaveValue("stasiun tidak ada");
  await search.fill("");
  await expect(page.getByRole("option")).toHaveCount(2);
  await search.press("ArrowDown");
  await expect(page.getByRole("option", { selected: true })).toContainText("Sudirman");
  await search.press("Escape");
  await expect(search).toHaveAttribute("aria-expanded", "false");
});

test("retail mengikuti stasiun aktif dan tidak menjadi daftar global", async ({
  page,
}) => {
  const search = page.getByRole("combobox", { name: "Cari stasiun" });
  await search.fill("Sudirman");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("Enter");

  await page.getByRole("button", { name: "Retail", exact: true }).click();
  const panel = page.locator(".retail-picker-empty");
  await expect(panel).toContainText("Tidak ada asset untuk stasiun ini.");
  await expect(page.getByText("Famima Manggarai", { exact: true })).toHaveCount(
    0,
  );
});

test("stasiun aktif tersimpan di URL dan pulih setelah refresh", async ({
  page,
}) => {
  const search = page.getByRole("combobox", { name: "Cari stasiun" });
  await search.fill("Sudirman");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("Enter");

  await expect
    .poll(() => new URL(page.url()).searchParams.get("station"))
    .toBe("2");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("combobox", { name: "Cari stasiun" })).toHaveValue(
    "Sudirman",
  );
  await page.getByRole("button", { name: "Retail", exact: true }).click();
  await expect(page.locator(".retail-picker-empty")).toContainText(
    "Tidak ada asset untuk stasiun ini.",
  );
});

test("sepuluh lokasi retail dapat dipilih dari daftar dan marker, serta disembunyikan", async ({ page }) => {
  await page.getByRole("button", { name: "Retail", exact: true }).click();
  const panel = page.locator(".retail-location-list");
  await expect(panel.getByRole("button")).toHaveCount(10);
  await panel.getByRole("button", { name: "Famima Manggarai", exact: true }).click();
  const detail = page.getByRole("article", { name: "Detail lokasi retail" });
  await expect(detail).toContainText("-6.2102422, 106.8502918");
  await expect.poll(() => page.evaluate(() => {
    const map = (window as unknown as { __map?: MapLibreMap }).__map;
    return map && !map.isMoving() && Math.abs(map.getCenter().lat + 6.2102422) < 0.000001 && map.getZoom() === 19;
  })).toBe(true);

  // Vue d'ensemble untuk menghitung semua titik yang tergambar di sekitar Manggarai.
  await page.evaluate(() => {
    const map = (window as unknown as { __map: MapLibreMap }).__map;
    map.jumpTo({ center: [106.8506, -6.2101], zoom: 18 });
  });
  await expect.poll(() => page.evaluate(() => {
    const map = (window as unknown as { __map: MapLibreMap }).__map;
    return new Set(map.queryRenderedFeatures({ layers: ["retail-circle"] }).map((feature) => feature.properties.id)).size;
  })).toBe(10);
  const point = await page.evaluate(() => {
    const map = (window as unknown as { __map: MapLibreMap }).__map;
    const p = map.project([106.8502013, -6.2100029]);
    const box = map.getCanvas().getBoundingClientRect();
    return { x: box.left + p.x, y: box.top + p.y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(detail.getByRole("heading")).toHaveText("Indomaret Manggarai");
  await page.getByRole("button", { name: "Indomaret Manggarai", exact: true }).click();
  await page.locator(".retail-location-list").getByRole("button", { name: "Potensi toko 5", exact: true }).click();
  await expect(detail).toContainText("Estimasi potensi pendapatan belum tersedia");
  await expect(detail).toContainText("-6.2105015, 106.8508356");
  await page.getByRole("button", { name: "Ringkasan", exact: true }).click();
  await page.getByRole("button", { name: /Lapisan & filter/ }).click();
  await page.getByRole("button", { name: "Retail & potensi toko", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __map: MapLibreMap }).__map.getLayoutProperty("retail-circle", "visibility"))).toBe("none");
});
