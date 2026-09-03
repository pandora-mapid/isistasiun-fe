/**
 * Kicker section — chip pil polos, tanpa nomor urut kecil (nomor hidup di
 * `KepalaBab`, bukan label "1 dari N").
 *
 * `warna="ink"` untuk band tinta: `Lencana` selalu menyetel `background`
 * inline, dan inline itu menang atas aturan `.ink-band .eyebrow-chip`. Tanpa
 * varian ini, di atas band tinta pil-nya jadi krem opak dengan teks putih
 * 40% di atasnya — kotak yang isinya tak terbaca.
 *
 * Fungsi polos (tanpa `"use client"`) supaya bisa dipakai di server maupun
 * client. Bagian dari sistem "laporan instrumen" bersama (`components/paper/`)
 * yang dipakai Beranda dan Insight.
 */
export function Lencana({
  label,
  warna = "netral",
  dot = false,
}: {
  label: string;
  warna?: "netral" | "brand" | "ink";
  dot?: boolean;
}) {
  const background =
    warna === "brand"
      ? "var(--brand-wash)"
      : warna === "ink"
        ? "rgba(250, 248, 244, 0.12)"
        : "var(--paper-2)";
  return (
    <span
      className="eyebrow-chip eyebrow"
      style={{
        background,
        ...(warna === "ink" ? { color: "var(--paper)" } : null),
      }}
    >
      {dot && <span className="dot" style={{ background: "var(--brand)" }} />}
      {label}
    </span>
  );
}
