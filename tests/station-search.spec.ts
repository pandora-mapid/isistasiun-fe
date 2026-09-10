import { test, expect, type Page } from "@playwright/test";
import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Pencarian stasiun + panel retail — di Chromium sungguhan.
 *
 * Basemap distub supaya tesnya tidak bergantung pada jaringan penyedia peta.
 * Yang diperiksa bukan "panel muncul", melainkan bahwa interaksinya benar-benar
 * mengubah apa yang tergambar: kamera pindah, titik terpilih, marker retail
 * bertambah/berkurang, layer disembunyikan.
 */

async function stubBasemap(page: Page) {
  await page.route("**/styles/basic/style.json?**", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
  await page.route("https://tiles.openfreemap.org/styles/liberty", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
}

/** Peta siap + lapisan retail terpasang. */
async function waitForRetail(page: Page) {
  await page.waitForFunction(() => {
    const map = (window as unknown as { __map?: MapLibreMap }).__map;
    if (!map?.getLayer?.("retail-circle")) return false;
    return map.querySourceFeatures("retail-locations").length > 0;
  }, undefined, { timeout: 30_000 });
}

/** Jumlah id retail unik yang benar-benar tergambar. */
function markerCount(page: Page) {
  return page.evaluate(() => {
    const map = (window as unknown as { __map: MapLibreMap }).__map;
    return new Set(
      map
        .queryRenderedFeatures({ layers: ["retail-circle"] })
        .map((f) => f.properties?.id),
    ).size;
  });
}

test.beforeEach(async ({ page }) => {
  await stubBasemap(page);
  await page.goto("/peta");
  await waitForRetail(page);
});

test("cari stasiun lewat keyboard memindahkan kamera dan memilih titik", async ({ page }) => {
  const search = page.getByRole("combobox", { name: "Cari stasiun" });
  await search.fill("sUDir");
  await expect(page.getByRole("option")).toHaveCount(1);
  await search.press("Enter");

  await expect
    .poll(() =>
      page.evaluate(() => {
        const map = (window as unknown as { __map?: MapLibreMap }).__map;
        if (!map || map.isMoving()) return null;
        return {
          lng: Number(map.getCenter().lng.toFixed(4)),
          selected: map.getFeatureState({ source: "observation-points", id: 21 }).terpilih,
        };
      }),
    )
    .toEqual({ lng: 106.8224, selected: true });

  // Hasil kosong menyebut arahan yang benar, tidak sekadar "tidak ada".
  await search.fill("stasiun antah berantah");
  await expect(page.getByRole("status")).toContainText("Stasiun tidak ditemukan");

  // Panah + Escape.
  await search.fill("");
  await expect(page.getByRole("option")).toHaveCount(2);
  await search.press("ArrowDown");
  await expect(page.getByRole("option", { selected: true })).toContainText("Sudirman");
  await search.press("Escape");
  await expect(search).toHaveAttribute("aria-expanded", "false");
});

test("sepuluh lokasi retail dipilih dari daftar dan dari marker, lalu disembunyikan", async ({ page }) => {
  const panel = page.getByRole("region", { name: "Retail dan potensi Manggarai" });
  await panel.locator("summary").click();
  await expect(panel.locator(".retail-location-list button")).toHaveCount(10);

  // Pilih dari daftar → kartu detail + kamera mendekat.
  await panel.getByRole("button", { name: "Famima Manggarai" }).click();
  const detail = page.getByRole("article", { name: "Detail lokasi retail" });
  await expect(detail.getByRole("heading")).toHaveText("Famima Manggarai");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const map = (window as unknown as { __map?: MapLibreMap }).__map;
        return Boolean(map && !map.isMoving() && map.getZoom() > 16);
      }),
    )
    .toBe(true);

  // Semua sepuluh marker tergambar saat dekat.
  await page.evaluate(() => {
    const map = (window as unknown as { __map: MapLibreMap }).__map;
    map.jumpTo({ center: [106.8506, -6.2101], zoom: 18 });
  });
  await expect.poll(() => markerCount(page)).toBe(10);

  // Pilih dari marker di peta.
  const at = await page.evaluate(() => {
    const map = (window as unknown as { __map: MapLibreMap }).__map;
    const p = map.project([106.8502013, -6.2100029]); // Indomaret Manggarai
    const box = map.getCanvas().getBoundingClientRect();
    return { x: box.left + p.x, y: box.top + p.y };
  });
  await page.mouse.click(at.x, at.y);
  await expect(detail.getByRole("heading")).toHaveText("Indomaret Manggarai");

  // Memilih menutup daftar (panel harus tetap pendek); buka lagi untuk memilih
  // lokasi berikutnya.
  await expect(panel.locator(".retail-location-list button").first()).toBeHidden();
  await panel.locator("summary").click();

  // Lokasi tanpa kategori dan tanpa estimasi menyebut alasannya.
  await panel.getByRole("button", { name: "Potensi toko 5" }).click();
  await expect(detail).toContainText("Estimasi potensi pendapatan belum tersedia");
  await expect(detail).toContainText("Belum ditentukan");

  // Sakelar lapisan retail menyembunyikan marker.
  await page.getByRole("button", { name: /Lapisan & filter/ }).click();
  await page.getByRole("button", { name: "Retail & potensi toko", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { __map: MapLibreMap }).__map.getLayoutProperty(
          "retail-circle",
          "visibility",
        ),
      ),
    )
    .toBe("none");
});

test("filter kategori tidak mengubah jumlah marker retail", async ({ page }) => {
  // Retail menandai pasokan, bukan permintaan — jumlahnya tetap apa pun
  // kategori yang dipilih, sama seperti titik pengamatan.
  await expect.poll(() => markerCount(page)).toBe(10);

  await page.getByRole("button", { name: /Lapisan & filter/ }).click();
  await page.getByRole("button", { name: "Apotek", exact: true }).click();

  await expect.poll(() => markerCount(page)).toBe(10);
});
