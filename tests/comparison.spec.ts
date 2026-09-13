import { test, expect, type Page } from "@playwright/test";
import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Dialog "Bandingkan" di Chromium sungguhan.
 *
 * Tombol "Bandingkan" dulu sengaja mati (janji proposal tanpa backend). Kini
 * ia terisi data mock; tes ini mengunci bahwa dialognya memakai filter yang
 * sedang aktif dan bisa melempar kembali ke peta.
 */

async function stubBasemap(page: Page) {
  await page.route("**/styles/basic/style.json?**", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
  await page.route("https://tiles.openfreemap.org/styles/liberty", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
}

test("dialog Bandingkan memakai filter aktif dan bisa membuka stasiun di peta", async ({ page }) => {
  await stubBasemap(page);
  await page.goto("/peta");
  await page.waitForFunction(
    () => Boolean((window as unknown as { __map?: MapLibreMap }).__map),
    undefined,
    { timeout: 30_000 },
  );

  // `exact: true` wajib: sejak overlay "Ringkasan & Bandingkan Simpul" ada,
  // pencocokan substring mengenai DUA tombol dan Playwright menolaknya. Dua
  // fitur berbeda dengan angka berbeda — lihat lib/analytics/summary.ts.
  await page.getByRole("button", { name: "Bandingkan", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Manggarai dan Sudirman" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Spending gap")).toHaveCount(2);
  await expect(dialog.getByText("Gap per slot waktu")).toBeVisible();
  await expect(dialog).toContainText("Filter aktif: 06–09 · Semua");

  // "Buka di peta" pada kartu kedua (Sudirman) menutup dialog & memindah kamera.
  await dialog.getByRole("button", { name: "Buka di peta" }).nth(1).click();
  await expect(dialog).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const map = (window as unknown as { __map?: MapLibreMap }).__map;
        return map && !map.isMoving() ? Number(map.getCenter().lng.toFixed(4)) : null;
      }),
    )
    .toBe(106.8224);

  // Esc menutup.
  await page.getByRole("button", { name: "Bandingkan", exact: true }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
