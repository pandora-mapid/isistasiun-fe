import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Dua famili, dua tugas yang tidak saling menggantikan.
 *
 * Selalu dirujuk lewat variabel CSS, tidak pernah sebagai string literal:
 * next/font mengacak nama font-family yang sebenarnya dihasilkan, jadi menulis
 * `'Inter'` di dalam CSS diam-diam jatuh ke font sistem.
 *
 * Instrument Serif (`--font-serif`) sempat dimuat khusus untuk headline
 * Beranda versi editorial ("laporan instrumen"). Putaran kelima memindahkan
 * Beranda ke sistem "modern" — headline besar sekarang Inter 800/900, bukan
 * serif — dan tidak ada layar lain yang pernah memakainya, jadi fontnya
 * dilepas seluruhnya alih-alih dibiarkan termuat tanpa pemakai.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

/**
 * Huruf angka.
 *
 * Kelas `.mono` yang lama bukan monospace sama sekali — ia Inter dengan
 * `tabular-nums`, jadi angkanya rata tapi tidak pernah terbaca sebagai bacaan
 * instrumen. Untuk produk yang seluruh klaimnya adalah pengukuran, itu kerugian
 * yang tidak perlu.
 */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Isi Stasiun",
  description:
    "WebGIS yang mengukur kesenjangan antara potensi belanja komuter dan belanja yang tertangkap gerai di dalam stasiun.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
