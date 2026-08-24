import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Isi Stasiun",
  description:
    "WebGIS yang mengukur kesenjangan antara potensi belanja komuter dan belanja yang tertangkap gerai di dalam stasiun.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
