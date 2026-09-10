import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  /**
   * Keluaran mandiri untuk image Docker.
   *
   * Next menelusuri berkas mana saja yang benar-benar dipakai saat runtime,
   * lalu menyalinnya ke `.next/standalone` bersama `server.js`. Tahap runner
   * di Dockerfile cukup membawa direktori itu — tidak perlu node_modules
   * lengkap, jadi image-nya jauh lebih ramping.
   *
   * Catatan: `.next/static` dan `public/` TIDAK ikut ter-trace dan disalin
   * manual di Dockerfile.
   */
  output: "standalone",
};

export default nextConfig;
