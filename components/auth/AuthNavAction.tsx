"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "./AuthProvider";

export function AuthNavAction() {
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const [pending, setPending] = useState(false);

  if (status === "loading") {
    return <span className="auth-nav-status" aria-label="Memeriksa sesi">•••</span>;
  }

  if (status === "anonymous") {
    return (
      <div className="auth-nav-user">
        <Link href="/register" className="b bs">
          Daftar
        </Link>
        <Link href="/login" className="b bp auth-nav-login">
          Masuk
        </Link>
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    operator: "Operator",
    premium: "Premium",
    user: "User",
  };

  return (
    <div className="auth-nav-user">
      <Link
        href={user?.role === "admin" ? "/admin" : "/premium"}
        className="auth-nav-identity"
        title={user?.email}
      >
        <span>{roleLabel[user?.role ?? "user"]}</span>
        <small>{user?.email}</small>
      </Link>
      <button
        type="button"
        className="b bs"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            await logout();
            router.replace("/login");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Keluar…" : "Keluar"}
      </button>
    </div>
  );
}
