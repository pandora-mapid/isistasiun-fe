import { test, expect, type Page } from "@playwright/test";

/**
 * Penjaga responsivitas halaman naratif.
 *
 * Gejala yang dijaga: halaman bisa digeser MENDATAR di layar sempit, dan isi
 * di tepi kanan terpotong. Penyebabnya nyaris selalu satu dari empat hal, dan
 * keempatnya lolos typecheck maupun lint:
 *
 * 1. grid bertrek `1fr` telanjang — `min-width: auto` milik grid item menahan
 *    trek di lebar min-content, jadi grid melebihi wadahnya
 * 2. anak grid yang ditempatkan di garis eksplisit (`grid-column: 10 / span 3`)
 *    — meruntuhkan `grid-template-columns` saja tidak cukup, garis ke-10 tetap
 *    diminta dan grid menumbuhkan kolom implisit di luar layar
 * 3. `white-space: nowrap` pada teks yang lebih panjang dari layar
 * 4. hiasan `position: absolute` yang sengaja menjorok keluar bingkai — di
 *    layar lebar ia jatuh ke selokan `--page-x`, di layar sempit ke luar layar
 *
 * Semua tata letak halaman ini ditulis sebagai `style` sebaris, jadi tidak ada
 * stylesheet yang bisa dibaca untuk memastikan perbaikannya masih terpasang.
 * Yang bisa dipercaya cuma hasil ukur di browser — karena itu tes ini mengukur
 * `scrollWidth` sungguhan, bukan memeriksa ada-tidaknya nama kelas.
 *
 * `/peta` tidak ikut di sini: ia butuh WebGL dan sudah dijaga
 * `peta.spec.ts` → "peta tetap terbaca di lebar sempit".
 */

const RUTE = ["/", "/insight", "/metodologi", "/rekomendasi"] as const;

/** 320 = layar terkecil yang masih ditemui; 1024 = tablet mendatar. */
const LEBAR = [1024, 760, 390, 320] as const;

/** Selisih `scrollWidth` − `clientWidth` pada elemen akar. */
async function lebarGeser(page: Page): Promise<number> {
  return page.evaluate(() => {
    const akar = document.documentElement;
    return akar.scrollWidth - akar.clientWidth;
  });
}

/**
 * Ukur setelah tata letaknya berhenti bergerak.
 *
 * Angka di halaman ini dipetik `usePetaData()`, dan sebelum rantai fetch-nya
 * selesai metriknya terbaca "tidak diestimasi" — teks yang lebih panjang dari
 * "Rp 4,2 jt" yang menggantikannya. Jadi ada satu momen sah di awal render di
 * mana halaman memang lebih lebar. Yang dijaga tes ini keadaan TENANG-nya:
 * diukur ulang sampai dua bacaan berturut-turut sama.
 *
 * (Sengaja bukan `networkidle` saja — di bawah suite paralel penuh dev server
 * mengompilasi rute sesuai permintaan, dan render pertama bisa datang jauh
 * setelah jaringan sepi. `insight.spec.ts` menaikkan tenggangnya karena alasan
 * yang sama.)
 */
async function lebarGeserTenang(page: Page): Promise<number> {
  let sebelumnya = Number.NaN;
  for (let i = 0; i < 40; i++) {
    const kini = await lebarGeser(page);
    if (kini === sebelumnya) return kini;
    sebelumnya = kini;
    await page.waitForTimeout(250);
  }
  return sebelumnya;
}

/**
 * Elemen terdangkal yang tepi kanannya melewati viewport — dipakai untuk pesan
 * gagal yang bisa langsung ditindaklanjuti, bukan sekadar "ada overflow".
 *
 * Elemen di dalam wadah yang memang digeser sendiri (`overflow-x: auto`, mis.
 * deretan pil navigasi dan tabel data) dilewati: di sana tepi kanan yang lewat
 * viewport justru perilaku yang diminta.
 */
async function tersangka(page: Page): Promise<string> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    let jawab = "(tidak ada elemen tunggal yang menonjol)";
    let terdalam = Infinity;
    let terlebar = 0;
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const kotak = el.getBoundingClientRect();
      if (kotak.width === 0 && kotak.height === 0) continue;

      let digeser = false;
      let induk = el.parentElement;
      while (induk) {
        const ox = getComputedStyle(induk).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden") {
          digeser = true;
          break;
        }
        induk = induk.parentElement;
      }
      if (digeser) continue;

      const lewat = Math.round(kotak.right - vw);
      if (lewat <= 1) continue;

      let dalam = 0;
      let n: Element | null = el;
      while ((n = n.parentElement)) dalam++;

      if (lewat > terlebar || (lewat === terlebar && dalam < terdalam)) {
        terlebar = lewat;
        terdalam = dalam;
        const kelas =
          typeof el.className === "string" && el.className
            ? "." + el.className.trim().split(/\s+/).join(".")
            : "";
        const teks = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
        jawab = `<${el.tagName.toLowerCase()}${kelas}> lewat ${lewat}px — ${JSON.stringify(teks)}`;
      }
    }
    return jawab;
  });
}

for (const rute of RUTE) {
  test(`${rute} tidak bisa digeser mendatar di layar sempit`, async ({ page }) => {
    for (const lebar of LEBAR) {
      await page.setViewportSize({ width: lebar, height: 900 });
      await page.goto(rute, { waitUntil: "networkidle" });

      const geser = await lebarGeserTenang(page);
      expect(
        geser,
        `${rute} @${lebar}px melebar ${geser}px di luar viewport — ${await tersangka(page)}`,
      ).toBeLessThanOrEqual(0);
    }
  });
}

/**
 * Tidak melebar saja belum berarti terbaca: kartu `position: absolute` yang
 * sengaja menembus sudut bekerja selama ada kolom di sebelahnya. Begitu
 * bagiannya runtuh jadi satu kolom, kartu itu melebar, memanjang, dan menutupi
 * judul bab di bawahnya — tanpa menambah satu piksel pun ke `scrollWidth`.
 *
 * Kasus itu pernah terjadi persis di Beranda bab 3 (kartu angka lapangan di
 * sudut foto pencacahan), jadi tindihan dijaga terpisah dari pelebaran.
 */
test("hiasan mengambang tidak menutupi teks di layar sempit", async ({ page }) => {
  for (const rute of RUTE) {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(rute, { waitUntil: "networkidle" });

    const tindihan = await page.evaluate(() => {
      const mengambang = Array.from(document.querySelectorAll("body *")).filter((el) => {
        const pos = getComputedStyle(el).position;
        return pos === "absolute" || pos === "fixed";
      });
      const teks = Array.from(
        document.querySelectorAll("h1, h2, h3, p, dd, li"),
      ).filter((el) => (el.textContent ?? "").trim().length > 12);

      const hasil: string[] = [];
      for (const el of mengambang) {
        const a = el.getBoundingClientRect();
        // Hiasan kecil (garis, titik, ikon) tidak menutupi apa pun yang terbaca.
        if (a.width < 40 || a.height < 20) continue;
        // Peta menggambar labelnya sendiri di atas tile — itu bukan tindihan.
        if (el.closest(".maplibregl-map")) continue;

        for (const t of teks) {
          if (el.contains(t) || t.contains(el)) continue;
          const b = t.getBoundingClientRect();
          const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (x > 20 && y > 10) {
            hasil.push(
              `${JSON.stringify((el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 30))}` +
                ` menutupi ${JSON.stringify((t.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40))}`,
            );
            break;
          }
        }
      }
      return hasil;
    });

    expect(tindihan, `${rute} @390px: ${tindihan.join(" · ")}`).toEqual([]);
  }
});
