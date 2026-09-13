"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/auth/client";
import type { BackendStation } from "@/lib/auth/types";

export function CreateOperatorForm() {
  const { request } = useAuth();
  const [stations, setStations] = useState<BackendStation[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    request<BackendStation[]>("/stations")
      .then((rows) => {
        if (active) setStations(rows);
      })
      .catch(() => {
        // Non-fatal: the station <select> just stays empty and unusable —
        // the error from submitting without a station_id is clear enough.
      });
    return () => {
      active = false;
    };
  }, [request]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreated(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const stationId = String(form.get("station_id") ?? "");
    if (!email || !email.includes("@")) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (!stationId) {
      setError("Pilih stasiun yang diwakili operator ini.");
      return;
    }

    setPending(true);
    try {
      await request("/admin/operators", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          station_id: stationId,
        }),
      });
      setCreated(email);
      event.currentTarget.reset();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 400) {
        setError(cause.message || "Email ini sudah terdaftar.");
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError("Gagal membuat akun operator.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <div className="auth-field">
        <label htmlFor="operator-email">Email operator</label>
        <input
          id="operator-email"
          name="email"
          type="email"
          autoComplete="off"
          inputMode="email"
          placeholder="ops@kai.id"
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="operator-password">Kata sandi awal</label>
        <input
          id="operator-password"
          name="password"
          type="text"
          autoComplete="off"
          minLength={8}
          required
        />
      </div>

      <div className="auth-field">
        <label htmlFor="operator-station">Stasiun</label>
        <select id="operator-station" name="station_id" required defaultValue="">
          <option value="" disabled>
            {stations.length ? "Pilih stasiun" : "Memuat stasiun…"}
          </option>
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.name} · {station.code}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="auth-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {created && (
        <p className="auth-help" role="status">
          Akun operator untuk {created} berhasil dibuat.
        </p>
      )}

      <button className="b bp auth-submit" type="submit" disabled={pending}>
        {pending ? "Membuat…" : "Buat akun operator"}
      </button>
    </form>
  );
}
