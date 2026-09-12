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
    { timeout: 25_000 },
  );
  // Di bawah suite paralel penuh + mesin yang sedang sibuk, dev server yang
  // mengompilasi `/peta` sesuai permintaan + render SwiftShader bisa selambat
  // ini untuk menggambar fitur pertama. Tetap di bawah `timeout` tes (90 dtk).
  await page.waitForFunction(
    () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (window as unknown as { __map?: any }).__map;
      if (!map?.getLayer?.("point-circle")) return false;
      return map.queryRenderedFeatures({ layers: ["point-circle"] }).length > 0;
    },
    undefined,
    { timeout: 55_000 },
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

/* -------------------------------------------------------------------------
 * Fase 1 — interaksi
 *
 * Yang diperiksa di sini bukan "tombolnya bisa diklik", melainkan bahwa klik
 * itu benar-benar mengubah apa yang tergambar atau apa yang tertulis. Tiga
 * bug peta sebelumnya semuanya lolos karena halaman tetap terbuka dengan
 * rapi sementara petanya sudah berhenti bekerja.
 * ---------------------------------------------------------------------- */

/** Nilai feature-state satu titik, seperti yang benar-benar dibaca MapLibre. */
async function featureState(page: Page, id: number) {
  return page.evaluate((pointId) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    return map.getFeatureState({ source: "observation-points", id: pointId });
  }, id);
}

/** Jumlah titik yang tergambar saat ini. */
function hitungTitik(page: Page) {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    return map.queryRenderedFeatures({ layers: ["point-circle"] }).length;
  });
}

/**
 * Jumlah titik setelah gambarnya berhenti bertambah.
 *
 * `waitForMapReady` hanya menunggu titik PERTAMA tergambar, jadi menghitung
 * tepat sesudahnya bisa menangkap keadaan setengah jadi — pernah terbaca 6
 * dari 10, lalu tesnya gagal membandingkan angka yang diambil di dua momen
 * berbeda. Menunggu dua pembacaan berturut-turut sama menghilangkan balapan
 * itu tanpa perlu menuliskan jumlah titik yang diharapkan, yang akan basi
 * setiap kali data contohnya berubah.
 */
async function jumlahTitikStabil(page: Page): Promise<number> {
  let sebelumnya = -1;
  for (let i = 0; i < 24; i++) {
    const n = await hitungTitik(page);
    if (n > 0 && n === sebelumnya) return n;
    sebelumnya = n;
    await page.waitForTimeout(250);
  }
  throw new Error(`jumlah titik tidak pernah tenang (terakhir ${sebelumnya})`);
}

/** Seluruh nilai gap yang sedang tertempel di titik, terurut. */
async function gapStates(page: Page) {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    return map
      .queryRenderedFeatures({ layers: ["point-circle"] })
      .map((f: { id: number }) =>
        map.getFeatureState({ source: "observation-points", id: f.id }).gap,
      )
      .sort((a: number, b: number) => a - b);
  });
}

test("filter slot waktu mengubah angka yang ditempel ke peta", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  // Angka baru menempel setelah feature-state diterapkan.
  await expect
    .poll(async () => (await gapStates(page)).some((v: number) => v > 0), {
      timeout: 15_000,
    })
    .toBe(true);

  const pagi = await gapStates(page);
  await page.getByRole("button", { name: "16–19" }).click();
  await expect.poll(() => gapStates(page), { timeout: 15_000 }).not.toEqual(pagi);

  // Panel ringkasan menyebut slot yang sedang aktif, bukan slot mati.
  await expect(page.getByText("Brief simpul · 16–19")).toBeVisible();
});

test("klik titik mengisi panel ringkasan dengan titik itu", async ({ page }) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  /**
   * Titik dan posisi layarnya, langsung dari peta.
   *
   * `map.project()` menghasilkan koordinat relatif terhadap kanvas, sedangkan
   * `page.mouse` memakai koordinat viewport. Kanvas peta kini penuh satu
   * viewport (pil nav mengambang di atasnya), jadi offset kanvas ~0 — tapi
   * titik di bawah pil nav tetap harus dilewati, karena pil itu yang akan
   * menerima kliknya. Begitu pula sisi kanan (panel ringkasan) dan sisi bawah
   * (panel slot & legenda).
   */
  const target = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    const rect = map.getCanvas().getBoundingClientRect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feats = map.queryRenderedFeatures({ layers: ["point-circle"] }) as any[];

    for (const f of feats) {
      // Titik yang BUKAN pilihan awal, supaya perubahannya benar-benar terlihat.
      const state = map.getFeatureState({ source: "observation-points", id: f.id });
      if (state.terpilih) continue;

      const p = map.project(f.geometry.coordinates);
      const x = rect.left + p.x;
      const y = rect.top + p.y;
      // Sisi kanan ditempati panel ringkasan, sisi bawah panel slot & legenda,
      // sisi atas pil nav yang mengambang.
      if (x > window.innerWidth - 480) continue;
      if (y > window.innerHeight - 230 || y < rect.top + 110) continue;
      // Rel kiri: kotak pencarian stasiun (rata `--page-x`) lalu kontrol zoom
      // (panel retail sudah pindah ke tab sidebar).
      if (x < 440 && y < rect.top + 300) continue;

      return { id: f.id as number, label: f.properties.point_label as string, x, y };
    }
    return null;
  });

  expect(target, "tidak ada titik yang bebas dari panel untuk diklik").not.toBeNull();
  await page.mouse.click(target!.x, target!.y);

  // Peta menandai titiknya terpilih…
  await expect
    .poll(async () => (await featureState(page, target!.id)).terpilih, {
      timeout: 10_000,
    })
    .toBe(true);

  // …dan panelnya menyebut titik itu.
  await expect(
    page.getByText(target!.label, { exact: false }).first(),
  ).toBeVisible();
});

test("panel lapisan menghidupkan dan mematikan layer peta", async ({ page }) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  /** Visibility satu layer seperti yang tercatat di style peta. */
  const visibility = (id: string) =>
    page.evaluate((layerId) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (window as unknown as { __map?: any }).__map;
      return map.getLayoutProperty(layerId, "visibility");
    }, id);

  await page.locator(".layers-toggle").click();

  // "Arus pintu" mati secara bawaan — menyalakannya harus terlihat.
  await expect.poll(() => visibility("point-arus")).toBe("none");
  await page.locator(".lyr").filter({ hasText: "Arus pintu stasiun" }).click();
  await expect.poll(() => visibility("point-arus")).toBe("visible");

  // Mematikan lapisan kesenjangan menyembunyikan lingkarannya.
  await page.locator(".lyr").filter({ hasText: "Kesenjangan belanja" }).click();
  await expect.poll(() => visibility("point-circle")).toBe("none");
});

test("filter kategori mengubah tampilan titik tanpa menyembunyikannya", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  const jumlahAwal = await jumlahTitikStabil(page);
  await expect
    .poll(async () => (await gapStates(page)).some((v: number) => v > 0), {
      timeout: 15_000,
    })
    .toBe(true);
  const semua = await gapStates(page);

  await page.locator(".layers-toggle").click();
  await page.getByText("Apotek", { exact: true }).click();

  // Angkanya berubah…
  await expect.poll(() => gapStates(page), { timeout: 15_000 }).not.toEqual(semua);

  // …tapi jumlah titik yang tergambar TETAP. Ini konsekuensi batasan
  // feature-state di MapLibre, dan memang disengaja (ROADMAP §3).
  const jumlahSesudah = await jumlahTitikStabil(page);
  expect(jumlahSesudah).toBe(jumlahAwal);
});

test("legenda mengikuti skala data yang sedang aktif", async ({ page }) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  await page.locator(".layers-toggle").click();
  const legenda = page.locator("text=/^Kesenjangan · /");
  await expect(legenda).toBeVisible();

  /** Batas atas legenda, sebagaimana tertulis di layar. */
  const batasAtas = () =>
    page.evaluate(() => {
      const semua = [...document.querySelectorAll(".fig span")]
        .map((el) => el.textContent ?? "")
        .filter((t) => t.startsWith("Rp "));
      return semua[semua.length - 1] ?? "";
    });

  const sebelum = await batasAtas();
  expect(sebelum).not.toBe("");

  // Menyaring ke satu kategori mengecilkan angkanya — legenda harus ikut,
  // bukan tetap memajang batas mati "> Rp 4.000.000".
  await page.getByText("Apotek", { exact: true }).click();
  await expect.poll(batasAtas, { timeout: 15_000 }).not.toBe(sebelum);
});

test("panel transparansi terbuka dari titik yang sedang dipilih", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  await page.getByText("Lihat bukti →").click();
  const dialog = page.getByText("Panel transparansi ·");
  await expect(dialog).toBeVisible();

  // Judulnya menyebut nilai V yang sedang berlaku — bukan angka contoh mati.
  await expect(page.getByText(/Dari mana angka V = Rp [\d.]+ berasal/)).toBeVisible();
});

test("lapisan arus pintu menggambar angkanya", async ({ page }) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  /** Jumlah simbol yang benar-benar DITEMPATKAN, bukan sekadar terpasang. */
  const tergambar = () =>
    page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (window as unknown as { __map?: any }).__map;
      const n = (id: string) =>
        map.getLayer(id)
          ? map.queryRenderedFeatures({ layers: [id] }).length
          : -1;
      return { nama: n("point-label"), arus: n("point-arus") };
    });

  // Dekatkan supaya label melewati minzoom-nya dan titiknya tidak berdesakan.
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = (window as unknown as { __map?: any }).__map;
    map.jumpTo({ center: [106.8503, -6.2149], zoom: 16.8 });
  });
  await expect.poll(async () => (await tergambar()).nama, { timeout: 15_000 })
    .toBeGreaterThan(0);

  const sebelum = await tergambar();
  expect(sebelum.arus, "arus seharusnya mati secara bawaan").toBe(0);

  await page.locator(".layers-toggle").click();
  await page.locator(".lyr").filter({ hasText: "Arus pintu stasiun" }).click();

  // Benar-benar menggambar sesuatu — bukan sekadar sakelarnya menyala.
  await expect.poll(async () => (await tergambar()).arus, { timeout: 15_000 })
    .toBeGreaterThan(0);

  // Dan yang paling penting: menyalakannya TIDAK BOLEH menghapus nama titik.
  //
  // MapLibre menempatkan simbol dalam urutan terbalik, jadi layer yang
  // ditambahkan belakangan merebut prioritas saat kotak teksnya bertabrakan.
  // Waktu layer arus sempat diletakkan sesudah nama titik, seluruh nama lenyap
  // dari peta tanpa satu pun pesan error — persis kelas kegagalan yang membuat
  // berkas tes ini ada.
  const sesudah = await tergambar();
  expect(
    sesudah.nama,
    "menyalakan lapisan arus menghapus nama titik",
  ).toBe(sebelum.nama);
});

/* -------------------------------------------------------------------------
 * Aksesibilitas keyboard
 *
 * Seluruh kendali panel dulu ditulis sebagai `<div onClick>`: terlihat normal,
 * bisa diklik, dan sama sekali tidak bisa dijangkau Tab maupun ditekan Enter.
 * Kelas kegagalan itu tidak terlihat di tangkapan layar dan tidak tertangkap
 * lint, jadi dikunci di sini.
 * ---------------------------------------------------------------------- */

test("panel lapisan bisa dioperasikan tanpa tetikus", async ({ page }) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  const toggle = page.locator(".layers-toggle");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await expect(toggle).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  // Menyalakan satu lapisan lewat Enter harus benar-benar menggerakkan peta,
  // bukan sekadar mengubah rupa barisnya.
  const arus = page.locator(".lyr").filter({ hasText: "Arus pintu stasiun" });
  await expect(arus).toHaveAttribute("aria-pressed", "false");
  await arus.focus();
  await page.keyboard.press("Enter");
  await expect(arus).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (window as unknown as { __map?: any }).__map;
        return map.getLayoutProperty("point-arus", "visibility");
      }),
    )
    .toBe("visible");
});

test("baris lapisan tanpa data tetap terbaca, tapi tidak mengubah apa pun", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  await page.locator(".layers-toggle").click();
  // "Event & aktivasi" adalah satu-satunya baris yang masih benar-benar tanpa
  // data. Baris "Indeks sewa" dulu dipakai di sini dan sudah pindah ke sisi
  // yang berfungsi — lihat tes di bawahnya.
  const event = page.locator(".lyr").filter({ hasText: "Event & aktivasi" });
  // `aria-disabled`, bukan `disabled`: barisnya tetap bisa dijangkau supaya
  // keterangan "belum ada data" ikut terbaca pembaca layar. Playwright sendiri
  // menolak mengkliknya — bukti bahwa atributnya memang terbaca sebagai "tidak
  // tersedia" — jadi dicoba lewat jalur yang benar-benar tersisa: fokus + Enter.
  await expect(event).toHaveAttribute("aria-disabled", "true");
  await event.focus();
  await expect(event).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(event).toHaveAttribute("aria-pressed", "false");
});

test("lapisan indeks sewa menyala dan menggambar petak", async ({ page }) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  await page.locator(".layers-toggle").click();
  const sewa = page.locator(".lyr").filter({ hasText: "Indeks sewa" });
  // Barisnya sudah punya layer, jadi sakelarnya harus benar-benar bekerja —
  // bukan lagi ditandai "belum ada data".
  await expect(sewa).toHaveAttribute("aria-disabled", "false");
  await expect(sewa).toHaveAttribute("aria-pressed", "false");

  await sewa.click();
  await expect(sewa).toHaveAttribute("aria-pressed", "true");

  await expect
    .poll(() =>
      page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (window as unknown as { __map?: any }).__map;
        return map.getLayoutProperty("sewa-petak", "visibility");
      }),
    )
    .toBe("visible");

  // Bukan cuma layernya menyala: petaknya harus benar-benar tergambar.
  await expect
    .poll(() =>
      page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (window as unknown as { __map?: any }).__map;
        return map.queryRenderedFeatures({ layers: ["sewa-petak"] }).length;
      }),
    )
    .toBeGreaterThan(0);
});

test("panel transparansi menerima fokus dan ditutup dengan Esc", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  await page.getByText("Lihat bukti →").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Fokus harus pindah KE DALAM modal; kalau tertinggal di belakang, Tab
  // menyusuri panel yang sedang tertutup lapisan gelap.
  const tutup = page.getByRole("button", { name: "Tutup panel transparansi" });
  await expect(tutup).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("overlay ringkasan simpul berdiri sendiri di samping tombol Bandingkan", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  // Dua tombol, dua fitur. Kalau suatu saat keduanya disatukan, tes ini yang
  // pertama jatuh — dan memang harus, karena angkanya datang dari dua
  // hitungan yang berbeda (lihat lib/analytics/summary.ts).
  const lama = page.getByRole("button", { name: "Bandingkan", exact: true });
  const baru = page.getByRole("button", { name: "Ringkasan & Bandingkan Simpul" });
  await expect(lama).toBeVisible();
  await expect(baru).toBeVisible();

  await baru.click();
  const dialog = page.getByRole("dialog", { name: "Ringkasan & Bandingkan Simpul" });
  await expect(dialog).toBeVisible();

  // Dua kolom simpul, dan angka yang memang datang dari rollup simpul:
  // rentang P10-P90 plus stempel basisnya.
  await expect(dialog.getByText("Manggarai", { exact: false }).first()).toBeVisible();
  await expect(dialog.getByText("Sudirman", { exact: false }).first()).toBeVisible();
  await expect(dialog.getByText("Kesenjangan (P10–P90)").first()).toBeVisible();
  await expect(dialog.getByText("simulasi Monte Carlo setingkat simpul")).toBeVisible();

  // Dialog lama TIDAK ikut terbuka.
  await expect(
    page.getByRole("dialog", { name: "Perbandingan dua simpul", exact: false }),
  ).toHaveCount(0);

  // Fokus masuk ke dalam modal, Esc menutupnya — sama seperti panel lain.
  await expect(page.getByRole("button", { name: "Tutup ringkasan simpul" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("tabel atribut terbuka, bisa diurutkan, dan mengunduh CSV", async ({ page }) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  await page.getByRole("button", { name: "Tabel atribut" }).click();
  const dialog = page.getByRole("dialog", { name: /titik pengamatan/ });
  await expect(dialog).toBeVisible();

  // Kolom F/E/C/V memang ada — itu yang membedakan tabel ini dari panel.
  for (const judul of ["Gap P50", "F (org/jam)", "E", "C", "V (Rp)"]) {
    await expect(dialog.getByRole("columnheader", { name: new RegExp(judul.replace(/[()/]/g, ".")) }).first()).toBeVisible();
  }

  // Sortir harus sampai ke pembaca layar, bukan cuma panah visual.
  const gapP50 = dialog.getByRole("columnheader", { name: /Gap P50/ });
  await expect(gapP50).toHaveAttribute("aria-sort", "descending");
  await gapP50.getByRole("button").click();
  await expect(gapP50).toHaveAttribute("aria-sort", "ascending");

  // Unduhan benar-benar terjadi, dan namanya membawa potongan filternya.
  const unduhan = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Unduh CSV" }).click();
  const file = await unduhan;
  expect(file.suggestedFilename()).toContain("tabel-atribut");
  expect(file.suggestedFilename().endsWith(".csv")).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("tombol Unduh brief mengunduh CSV potongan aktif tanpa membuka tabel", async ({
  page,
}) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  const unduhan = page.waitForEvent("download");
  await page.getByRole("button", { name: "Unduh brief" }).click();
  const file = await unduhan;
  expect(file.suggestedFilename()).toContain("tabel-atribut");

  // Isinya benar-benar CSV dengan header yang sama, bukan berkas kosong.
  const stream = await file.createReadStream();
  const isi = await new Promise<string>((resolve, reject) => {
    let buf = "";
    stream.on("data", (c) => (buf += c));
    stream.on("end", () => resolve(buf));
    stream.on("error", reject);
  });
  expect(isi).toContain("Gap P50");
  expect(isi).toContain("Sampel tipis");
});

test("brief simpul tampil dan menyediakan cetak ke PDF", async ({ page }) => {
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  await page.getByRole("button", { name: "Brief PDF" }).click();
  const dialog = page.getByRole("dialog", { name: "Brief PDF" });
  await expect(dialog).toBeVisible();

  // Bentuk brief menurut isi-stasiun-ai-integration.md §2.2.
  await expect(dialog.getByText("Rentang tertangkap").first()).toBeVisible();
  await expect(dialog.getByText("Asumsi yang dipakai").first()).toBeVisible();
  await expect(dialog.getByText("Kategori hilang teratas").first()).toBeVisible();
  await expect(dialog.getByText("Catatan kepercayaan").first()).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cetak / simpan PDF" })).toBeEnabled();

  // Kontrolnya tidak boleh ikut tercetak: tombol "Cetak" di dalam PDF-nya
  // sendiri adalah tombol yang tak bisa ditekan siapa pun.
  await page.emulateMedia({ media: "print" });
  await expect(dialog.getByRole("button", { name: "Cetak / simpan PDF" })).toBeHidden();
  await expect(dialog.getByText("Asumsi yang dipakai").first()).toBeVisible();
  await page.emulateMedia({ media: "screen" });

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("peta tetap terbaca di lebar sempit", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto("/peta", { waitUntil: "domcontentloaded" });
  await waitForMapReady(page);

  // Panel ringkasan turun jadi lembar bawah, tidak lagi kolom 414px yang
  // menutupi hampir seluruh peta.
  const panel = page.locator(".peta-panel");
  const kotak = await panel.boundingBox();
  expect(kotak).not.toBeNull();
  expect(kotak!.width).toBeGreaterThan(700);
  expect(kotak!.height).toBeLessThan(800 * 0.62);

  // Dan halaman tidak boleh bisa digeser mendatar.
  const meluber = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(meluber).toBe(false);
});
