"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { NavBar } from "@/components/NavBar";
import { CreateOperatorForm } from "./CreateOperatorForm";

export function AdminDashboard() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=%2Fadmin");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="page-canvas paper-canvas premium-page">
        <div className="premium-gate" role="status">
          <span className="eyebrow-chip">Akses admin</span>
          <h1>
            {status === "loading"
              ? "Memeriksa sesi…"
              : "Mengalihkan ke halaman masuk…"}
          </h1>
        </div>
      </main>
    );
  }

  if (user?.role !== "admin") {
    return (
      <main className="page-canvas paper-canvas premium-page">
        <div className="premium-gate" role="alert">
          <span className="eyebrow-chip">Akses admin</span>
          <h1>Halaman ini khusus admin.</h1>
          <p>Akun anda ({user?.role}) tidak punya akses ke sini.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-canvas paper-canvas premium-page">
      <NavBar
        active="admin"
        cta={
          <Link href="/peta" className="b bs">
            Buka peta
          </Link>
        }
      />
      <section className="auth-shell" aria-labelledby="admin-title">
        <div className="auth-intro">
          <span className="eyebrow-chip">Kelola akun</span>
          <h1 id="admin-title">Buat akun operator baru.</h1>
          <p>
            Operator mewakili satu organisasi (KAI, KAI Commuter, kawasan
            operator) dan terikat ke satu stasiun sejak akunnya dibuat — beda
            dari akun premium yang bisa membuka semua stasiun.
          </p>
        </div>
        <div className="auth-card">
          <div className="auth-card-head">
            <span className="k">Operator baru</span>
          </div>
          <CreateOperatorForm />
        </div>
      </section>
    </main>
  );
}
