import { test, expect } from "./map-fixtures";

async function waitForRentalLayer(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (window as unknown as { __map?: any }).__map;
      return Boolean(map?.getLayer?.("rental-circle"));
    },
    undefined,
    { timeout: 30_000 },
  );
}

test("aset sewa memuat delapan aset Manggarai dan detail status", async ({
  page,
}) => {
  await page.goto("/peta?basemap=positron", { waitUntil: "domcontentloaded" });
  await waitForRentalLayer(page);
  await page.getByRole("button", { name: "Retail", exact: true }).click();
  const panel = page.getByRole("region", { name: "Aset sewa stasiun" });
  await expect(panel).toContainText("8 lokasi");

  await expect(panel.locator(".rental-asset-list button")).toHaveCount(8);
  await expect(page.getByText(/MANGGARAI NO 5/)).toBeVisible();
  await expect(page.getByText(/Kios lokal Sudirman/)).not.toBeVisible();
});

test("sakelar aset sewa mengubah visibilitas marker", async ({ page }) => {
  await page.goto("/peta?basemap=positron", { waitUntil: "domcontentloaded" });
  await waitForRentalLayer(page);
  const layersToggle = page.locator(".layers-toggle");
  if ((await layersToggle.getAttribute("aria-expanded")) !== "true") {
    await layersToggle.click();
  }

  const rental = page.locator(".lyr").filter({ hasText: "Aset sewa stasiun" });
  await expect(rental).toHaveAttribute("aria-pressed", "true");
  await rental.click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (window as unknown as { __map?: any }).__map;
        return map.getLayoutProperty("rental-circle", "visibility");
      }),
    )
    .toBe("none");
});
