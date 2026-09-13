import { expect, test } from "@playwright/test";

/**
 * Copilot "Tanya Data" (tab `copilot` di `PetaScreen`), yang mengirim
 * `POST **\/copilot/query` lalu menerapkan `spatial_filter`/`suggested_layers`
 * ke filter peta. Endpoint ini tidak ada di data `/mock`, jadi setiap tes di
 * sini menstub jaringan sendiri — sesuai pola `useOfflineBasemap` di
 * `stage-one-demo.spec.ts`.
 */
async function stubBasemap(page: import("@playwright/test").Page) {
  await page.route("**/styles/basic/style.json?**", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
  await page.route("https://tiles.openfreemap.org/styles/liberty", (route) =>
    route.fulfill({ json: { version: 8, sources: {}, layers: [] } }),
  );
}

async function openCopilotTab(page: import("@playwright/test").Page) {
  await stubBasemap(page);
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Tanya Data" }).click();
}

test("mengirim query dengan station_id: null, kategori/slot AI dipetakan ke filter lokal", async ({
  page,
}) => {
  let body: unknown;
  await page.route("**/copilot/query", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({
      json: {
        success: true,
        data: {
          answer: "Pintu 4 Manggarai punya gap makanan-minuman terbesar sore hari.",
          suggested_layers: ["arus"],
          spatial_filter: { category: "makanan_minuman", time_slot: "evening" },
        },
        error: null,
      },
    });
  });

  await openCopilotTab(page);
  await page
    .getByRole("button", { name: "pintu mana yang gapnya paling besar sore hari?" })
    .click();

  await expect(
    page.getByText("Pintu 4 Manggarai punya gap makanan-minuman terbesar sore hari."),
  ).toBeVisible();
  await expect(page.getByText("Lapisan → Arus pintu stasiun")).toBeVisible();
  await expect(page.getByText("Kategori → F&B")).toBeVisible();
  await expect(page.getByText("Slot → 16–19")).toBeVisible();

  expect(body).toEqual({
    query: "pintu mana yang gapnya paling besar sore hari?",
    station_id: null,
  });
});

test("menampilkan status memuat sebelum jawaban tiba", async ({ page }) => {
  await page.route("**/copilot/query", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({
      json: {
        success: true,
        data: { answer: "Jawaban setelah menunggu.", suggested_layers: null, spatial_filter: null },
        error: null,
      },
    });
  });

  await openCopilotTab(page);
  await page.getByLabel("Tanya data peta").fill("kawasan mana yang sampelnya masih tipis?");
  await page.getByLabel("Tanya data peta").press("Enter");

  await expect(page.getByText("Menyusun jawaban")).toBeVisible();
  await expect(page.getByText("Jawaban setelah menunggu.")).toBeVisible();
  await expect(page.getByText("Menyusun jawaban")).toHaveCount(0);
});

test("kegagalan jaringan menampilkan pesan error, bukan layar kosong", async ({
  page,
}) => {
  await page.route("**/copilot/query", (route) => route.fulfill({ status: 500, body: "" }));

  await openCopilotTab(page);
  await page
    .getByRole("button", { name: "kawasan mana yang sampelnya masih tipis?" })
    .click();

  await expect(
    page.getByText("Gagal menghubungi layanan data. Coba lagi sebentar."),
  ).toBeVisible();
});

test("jawaban tanpa suggested_layers atau spatial_filter tidak menampilkan chip", async ({
  page,
}) => {
  await page.route("**/copilot/query", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { answer: "Jawaban polos tanpa filter.", suggested_layers: null, spatial_filter: null },
        error: null,
      },
    }),
  );

  await openCopilotTab(page);
  await page
    .getByRole("button", { name: "bandingkan Manggarai dengan Sudirman" })
    .click();

  await expect(page.getByText("Jawaban polos tanpa filter.")).toBeVisible();
  await expect(page.getByText(/^Lapisan →/)).toHaveCount(0);
  await expect(page.getByText(/^Kategori →/)).toHaveCount(0);
  await expect(page.getByText(/^Slot →/)).toHaveCount(0);
});

test("percakapan menumpuk: pertanyaan baru menambah bubble, tidak menimpa", async ({
  page,
}) => {
  // Echo the query back so each turn's answer is distinguishable.
  await page.route("**/copilot/query", async (route) => {
    const q = route.request().postDataJSON()?.query ?? "";
    await route.fulfill({
      json: {
        success: true,
        data: { answer: `Jawaban untuk: ${q}`, suggested_layers: null, spatial_filter: null },
        error: null,
      },
    });
  });

  await openCopilotTab(page);
  const input = page.getByLabel("Tanya data peta");

  await input.fill("pertanyaan pertama");
  await input.press("Enter");
  await expect(page.getByText("Jawaban untuk: pertanyaan pertama")).toBeVisible();

  await input.fill("pertanyaan kedua");
  await input.press("Enter");
  await expect(page.getByText("Jawaban untuk: pertanyaan kedua")).toBeVisible();

  // Riwayat menumpuk: giliran pertama TETAP ada, tidak ditimpa.
  await expect(page.getByText("pertanyaan pertama", { exact: true })).toBeVisible();
  await expect(page.getByText("pertanyaan kedua", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Jawaban untuk:/)).toHaveCount(2);

  // "Bersihkan" mengosongkan seluruh percakapan.
  await page.getByRole("button", { name: "Bersihkan" }).click();
  await expect(page.getByText(/^Jawaban untuk:/)).toHaveCount(0);
});
