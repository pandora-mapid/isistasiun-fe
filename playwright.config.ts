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
  // Berkas `*.visual.spec.ts` adalah alat bantu penghasil tangkapan layar,
  // bukan tes lolos/gagal — dikeluarkan dari `npm test` karena selalu lolos
  // dan lambat. Argumen CLI tidak bisa menimpa `testIgnore`, jadi disaring
  // lewat env var: `npm run test:visual`.
  testIgnore: process.env.VISUAL ? [] : ["**/*.visual.spec.ts"],
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
