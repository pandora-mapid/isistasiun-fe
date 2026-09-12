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
      <Link href="/login" className="b bs auth-nav-login">
        Masuk
      </Link>
    );
  }

  return (
    <div className="auth-nav-user">
      <Link href="/premium" className="auth-nav-identity" title={user?.email}>
        <span>{user?.role === "admin" ? "Admin" : "Operator"}</span>
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
