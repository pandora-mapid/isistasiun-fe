import { defineConfig, devices } from "@playwright/test";

/**
 * Konfigurasi pengujian.
 *
 * Dua jenis tes hidup berdampingan di `tests/`:
 * - `map-style.spec.ts` — validasi spesifikasi layer, tidak butuh browser
 * - `peta.spec.ts`      — smoke test di Chromium sungguhan, butuh WebGL
 *
 * Dev server dinyalakan otomatis kalau belum jalan.
 */
export default defineConfig({
  testDir: "./tests",
  // Pembanding basemap itu alat bantu visual, bukan tes lolos/gagal — jalankan
  // manual: npx playwright test tests/basemap-compare.spec.ts
  testIgnore: ["**/basemap-compare.spec.ts"],
  fullyParallel: false,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    screenshot: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1600, height: 900 },
        launchOptions: {
          // MapLibre butuh WebGL. SwiftShader menyediakannya di headless.
          args: [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
          ],
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
