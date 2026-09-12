"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Station } from "@/lib/data/types";

export type LocatedStation = Station & { longitude: number; latitude: number };

export function StationSearch({
  stations,
  selectedStationId,
  error,
  onSelect,
}: {
  stations: Station[] | null;
  selectedStationId?: number | null;
  error: string | null;
  onSelect: (station: LocatedStation) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const userEditedQuery = useRef(false);
  useEffect(() => {
    const selected = stations?.find(
      (station) => station.id === selectedStationId,
    );
    if (selected && !userEditedQuery.current) setQuery(selected.name);
  }, [stations, selectedStationId]);
  const results = (stations ?? []).filter(
    (station): station is LocatedStation =>
      typeof station.longitude === "number" &&
      Number.isFinite(station.longitude) &&
      typeof station.latitude === "number" &&
      Number.isFinite(station.latitude) &&
      Math.abs(station.longitude) <= 180 &&
      Math.abs(station.latitude) <= 90 &&
      `stasiun ${station.name}`
        .toLocaleLowerCase("id")
        .includes(query.trim().toLocaleLowerCase("id")),
  );
  const activeIndex = Math.min(active, results.length - 1);

  function select(station: LocatedStation) {
    userEditedQuery.current = false;
    setQuery(station.name);
    setOpen(false);
    onSelect(station);
  }

  return (
    <div
      className="station-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="station-search-field">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          role="combobox"
          aria-label="Cari stasiun"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && activeIndex >= 0
              ? `${listId}-${results[activeIndex].id}`
              : undefined
          }
          placeholder="Cari stasiun…"
          autoComplete="off"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            userEditedQuery.current = true;
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              if (results.length)
                setActive(
                  open
                    ? (activeIndex +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        results.length) %
                        results.length
                    : event.key === "ArrowDown"
                      ? 0
                      : results.length - 1,
                );
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (activeIndex >= 0) select(results[activeIndex]);
              else setOpen(true);
            }
          }}
        />
        {query && (
          <button
            type="button"
            aria-label="Hapus pencarian stasiun"
            onClick={(event) => {
              userEditedQuery.current = true;
              setQuery("");
              setActive(0);
              setOpen(true);
              event.currentTarget.parentElement
                ?.querySelector("input")
                ?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>
      <div
        id={listId}
        role="listbox"
        aria-label="Stasiun tersedia"
        hidden={!open}
        className="station-search-results"
      >
        {results.map((station, index) => (
          <div
            key={station.id}
            id={`${listId}-${station.id}`}
            role="option"
            aria-selected={index === activeIndex}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActive(index)}
            onClick={() => select(station)}
            className="station-search-option"
          >
            <strong>Stasiun {station.name}</strong>
            <span>
              {station.point_count} titik pengamatan · Lihat di peta →
            </span>
          </div>
        ))}
      </div>
      {open && results.length === 0 && (
        <div className="station-search-empty" role="status">
          {error
            ? "Daftar stasiun gagal dimuat."
            : !stations
              ? "Memuat stasiun…"
              : "Stasiun tidak ditemukan. Cari stasiun yang sudah ditandai."}
        </div>
      )}
    </div>
  );
}
