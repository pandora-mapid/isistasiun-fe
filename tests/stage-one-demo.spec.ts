import { expect, test } from "@playwright/test";
import type { Map as MapLibreMap } from "maplibre-gl";
import { categoryMatrix, recommendationHref, recommendationOverview, recommendationsFor } from "../lib/analytics/demo-select";
import { MOCK_DEMO_DATA } from "../lib/data/demo";

test("selector rekomendasi dan matriks kategori menghasilkan data konsisten", () => {
  const sudirman = recommendationsFor(MOCK_DEMO_DATA.recommendations, 2);
  expect(sudirman).toHaveLength(2);
  expect(sudirman.at(-1)?.sampel_tipis).toBe(true);
  expect(recommendationOverview(sudirman)).toEqual({
    total_gap: 940000,
    recommended: 1,
    deferred: 1,
  });
  expect(recommendationHref(sudirman[0])).toContain("station=2");

  const matrix = categoryMatrix(MOCK_DEMO_DATA.category_statuses, [1, 2]);
  const pharmacy = matrix.find((row) => row.category === "apotek");
  expect(pharmacy?.by_station[1]?.status).toBe("kosong");
  expect(pharmacy?.by_station[2]?.gerai_count).toBe(0);
});

async function useOfflineBasemap(page: import("@playwright/test").Page) {
  await page.route("**/styles/basic/style.json?**", (route) => route.fulfill({
    json: { version: 8, sources: {}, layers: [] },
  }));
  await page.route("https://tiles.openfreemap.org/styles/liberty", (route) => route.fulfill({
    json: { version: 8, sources: {}, layers: [] },
  }));
}

test("pembanding memakai filter aktif dan dapat membuka stasiun di peta", async ({ page }) => {
  await useOfflineBasemap(page);
  await page.goto("/peta");
  await page.getByRole("button", { name: "Bandingkan" }).click();
  const dialog = page.getByRole("dialog", { name: "Manggarai dan Sudirman" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Spending gap")).toHaveCount(2);
  await expect(dialog.getByText("Gap per slot waktu")).toBeVisible();

  await dialog.getByRole("button", { name: "Buka di peta" }).nth(1).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => page.evaluate(() => {
    const map = (window as unknown as { __map?: MapLibreMap }).__map;
    return map && !map.isMoving() ? Number(map.getCenter().lng.toFixed(4)) : null;
  })).toBe(106.8224);

  await page.getByRole("button", { name: "Bandingkan" }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("rekomendasi difilter, menandai sampel tipis, dan membuka deep-link peta", async ({ page }) => {
  await useOfflineBasemap(page);
  await page.goto("/rekomendasi");
  await expect(page.getByRole("heading", { name: "Urutan prioritas" })).toBeVisible();
  await expect(page.getByText("Ditunda").locator(".." )).toContainText("1 lokasi");
  await expect(page.getByText("Belum direkomendasikan")).toBeVisible();

  await page.getByRole("button", { name: "Sudirman" }).click();
  const table = page.getByRole("table", { name: "Urutan rekomendasi" });
  await expect(table.getByRole("row")).toHaveCount(3);
  await table.getByRole("row").nth(1).click();
  await expect(page).toHaveURL(/\/peta\?station=2&point=24&category=ritel&slot=sore/);
  await expect(page.getByText("Pintu 4").first()).toBeVisible();
});

test("filter kategori menyaring panel retail dan status kategori dapat membukanya", async ({ page }) => {
  await useOfflineBasemap(page);
  await page.goto("/rekomendasi");
  await page.locator(".category-matrix-row").filter({ hasText: "Apotek" }).getByRole("link", { name: "kosong" }).first().click();
  await expect(page).toHaveURL(/station=1&category=apotek/);
  const panel = page.getByRole("region", { name: "Retail dan potensi Manggarai" });
  await expect(panel.locator("summary")).toContainText("1 lokasi");
  await panel.locator("summary").click();
  await expect(panel.getByRole("button", { name: "Potensi toko 1", exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Famima Manggarai", exact: true })).toHaveCount(0);
});

test("wilayah di luar Manggarai dan Sudirman diberi status tanpa mengunci peta", async ({ page }) => {
  await useOfflineBasemap(page);
  await page.goto("/peta");
  await expect.poll(() => page.evaluate(() => Boolean(
    (window as unknown as { __map?: MapLibreMap }).__map?.getLayer("point-circle"),
  ))).toBe(true);
  await page.evaluate(() => (window as unknown as { __map: MapLibreMap }).__map.jumpTo({ center: [107.1, -6.05] }));
  await expect(page.getByRole("status")).toContainText("Analisis belum tersedia");
  await expect(page.getByRole("status")).toContainText("Peta dapat dijelajahi");
});
