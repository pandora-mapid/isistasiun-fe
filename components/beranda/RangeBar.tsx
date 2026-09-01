/**
 * Bar rentang P10–P90 dengan penanda median.
 *
 * Ini klaim epistemik produk ini dalam satu bentuk: yang diukur bukan sebuah
 * angka, melainkan sebuah rentang. Halaman depan sebelumnya menuliskannya
 * sebagai teks biasa — "Rp 2.400.000 – 4.100.000" — sehingga sifat rentangnya
 * hanya diakui, tidak pernah terlihat.
 *
 * Posisi mediannya dihitung `posisiDalamRentang()` di `lib/analytics/select.ts`,
 * bukan di sini: aturan penjepitannya sudah ada di sana dan sudah diuji.
 */
import { posisiDalamRentang } from "@/lib/analytics/select";
import type { Range } from "@/lib/data/types";
import { rupiahRingkas, TIDAK_DIESTIMASI } from "@/lib/format";

export function RangeBar({
  range,
  animate = false,
  labels = true,
}: {
  range: Range;
  /** Menggambar dirinya sendiri sekali saat halaman dibuka. Hanya untuk hero. */
  animate?: boolean;
  labels?: boolean;
}) {
  const adaEstimasi = range.p10 !== null && range.p90 !== null;
  const median = posisiDalamRentang(range, range.p50) * 100;

  if (!adaEstimasi) {
    return (
      <div>
        <div
          style={{
            height: 3,
            borderTop: "1.5px dashed var(--rule-strong)",
            opacity: 0.7,
          }}
        />
        {labels && (
          <div
            className="fig"
            style={{
              marginTop: 8,
              fontSize: 11,
              color: "var(--ink-faint)",
            }}
          >
            {TIDAK_DIESTIMASI}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative", height: 12 }}>
        {/* Batang membentang P10 → P90. Warnanya muda karena yang harus
            menonjol adalah mediannya, bukan lebar rentangnya. */}
        <div
          className={animate ? "draw" : undefined}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 5,
            height: 2,
            background: "var(--data-soft)",
            transformOrigin: "left center",
          }}
        />
        {/* Ujung-ujungnya diberi tiang supaya batasnya terbaca sebagai batas,
            bukan sebagai garis yang kebetulan berhenti. */}
        {[0, 100].map((x) => (
          <div
            key={x}
            className={animate ? "draw-dot" : undefined}
            style={{
              position: "absolute",
              left: `${x}%`,
              marginLeft: x === 0 ? 0 : -1.5,
              top: 1,
              width: 1.5,
              height: 10,
              background: "var(--data-soft)",
            }}
          />
        ))}
        <div
          className={animate ? "draw-dot" : undefined}
          style={{
            position: "absolute",
            left: `${median}%`,
            marginLeft: -4,
            top: 2,
            width: 8,
            height: 8,
            borderRadius: "var(--r-pill)",
            background: "var(--data)",
          }}
        />
      </div>
      {labels && (
        <div
          className="fig"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 8,
            fontSize: 10.5,
            color: "var(--ink-faint)",
          }}
        >
          {/* `nowrap` per label: tanpa itu satu label pecah di tengah angka
              ketika ruangnya menyempit, dan "Rp 2,3" / "jt" berakhir di dua
              baris berbeda. */}
          <span style={{ whiteSpace: "nowrap" }}>
            P10 {rupiahRingkas(range.p10)}
          </span>
          <span style={{ color: "var(--data)", whiteSpace: "nowrap" }}>
            median {rupiahRingkas(range.p50)}
          </span>
          <span style={{ whiteSpace: "nowrap" }}>
            P90 {rupiahRingkas(range.p90)}
          </span>
        </div>
      )}
    </div>
  );
}
