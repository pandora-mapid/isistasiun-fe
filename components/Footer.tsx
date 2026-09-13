import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#171714] text-surface-bright py-16 lg:py-20 border-t border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto px-gutter-sm lg:px-gutter">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 pb-12 border-b border-white/10">
          {/* Column 1: Brand */}
          <div className="md:col-span-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Logo.png"
                  alt="Isi Stasiun"
                  style={{ height: 32, width: "auto", objectFit: "contain" }}
                />
              </Link>
            </div>
            <p className="font-serif italic text-base lg:text-lg text-stone-300 max-w-md leading-snug">
              Melihat nilai ekonomi di balik pergerakan kota.
            </p>
            <p className="text-xs sm:text-sm text-stone-400 max-w-md leading-relaxed">
              Platform inteligensi spasial berbasis web untuk memetakan
              potensi komersial, keterjangkauan isochrone transit, dan
              optimalisasi ruang niaga stasiun perkeretaapian perkotaan.
            </p>
          </div>

          {/* Column 2: Navigasi Spasial */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-accent-yellow font-semibold mb-2 block">
              Navigasi Spasial
            </span>
            <div className="flex flex-col space-y-1 text-sm font-normal">
              <Link
                href="/"
                className="text-stone-400 hover:text-white hover:translate-x-0.5 transition-all py-1 inline-block"
              >
                Beranda
              </Link>
              <Link
                href="/peta"
                className="text-stone-400 hover:text-white hover:translate-x-0.5 transition-all py-1 inline-block"
              >
                Peta Spasial Transit
              </Link>
              <Link
                href="/insight"
                className="text-stone-400 hover:text-white hover:translate-x-0.5 transition-all py-1 inline-block"
              >
                Katalog Insight Mobilitas
              </Link>
              <Link
                href="/rekomendasi"
                className="text-stone-400 hover:text-white hover:translate-x-0.5 transition-all py-1 inline-block"
              >
                Matriks Rekomendasi Tenan
              </Link>
              <Link
                href="/metodologi"
                className="text-stone-400 hover:text-white hover:translate-x-0.5 transition-all py-1 inline-block"
              >
                Metodologi &amp; Sumber Data
              </Link>
            </div>
          </div>

          {/* Column 3: Kompetisi & Kolaborasi */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-accent-yellow font-semibold mb-2 block">
              Kompetisi &amp; Kolaborasi
            </span>
            <p className="text-sm text-stone-300 font-medium leading-normal">
              Built for MAPID WebGIS Competition 2026
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-mono font-medium border border-emerald-500/30 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Transit Analytics Track</span>
            </div>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="pt-8">
          <p className="text-xs text-stone-500 font-normal">
            © 2026 Isi Stasiun. All rights reserved. Data spasial dan estimasi
            pergerakan penumpang dikembangkan untuk studi kelayakan komersial.
          </p>
        </div>
      </div>
    </footer>
  );
}
