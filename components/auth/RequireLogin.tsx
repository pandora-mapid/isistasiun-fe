"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "./AuthProvider";

/**
 * Gates base map / basic analysis screens (Peta, Insight, Metodologi,
 * Rekomendasi) behind a login — any role qualifies, this is not a role
 * check. Mirrors the gate PremiumDashboard has always used inline; pulled
 * out here because four screens need it now instead of one.
 *
 * A Server Component page can still render everything else server-side —
 * this only needs to wrap the page's return value, not become its host.
 */
export function RequireLogin({
  next,
  children,
}: {
  next: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [status, router, next]);

  if (status !== "authenticated") {
    return (
      <main className="page-canvas paper-canvas premium-page">
        <div className="premium-gate" role="status">
          <span className="eyebrow-chip">Perlu masuk</span>
          <h1>
            {status === "loading"
              ? "Memeriksa sesi…"
              : "Mengalihkan ke halaman masuk…"}
          </h1>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
