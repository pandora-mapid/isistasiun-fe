"use client";

import { useEffect, useRef, useState } from "react";
import { RETAIL_LEGEND } from "@/lib/map/retail-style";
import type { RetailLocation } from "@/lib/data/retail";
import type { RentalAsset } from "@/lib/data/types";
import { categoryLabel } from "@/lib/data/dimensions";
import { RENTAL_STATUS_LEGEND, rentalStatusLabel } from "@/lib/data/rental";

const STATUS_LABEL: Record<RetailLocation["status"], string> = {
  tersedia: "Tersedia",
  kandidat: "Kandidat",
  perlu_verifikasi: "Perlu verifikasi",
};

export type FilterCategory = "all" | "sewa" | "potensi" | "existing" | "ruko";

// Helper metrik luas & rekomendasi jenis toko
function getRentalAssetMetrics(asset: RentalAsset): {
  areaLabel: string;
  recommendedStore: string;
} {
  const areaLabel =
    asset.land_area !== null && asset.land_area > 0
      ? `${asset.land_area} m²`
      : asset.building_area !== null && asset.building_area > 0
        ? `${asset.building_area} m² bgn`
        : "Lahan komersial";

  let recommendedStore = "Ritel / Toko Serbaguna";
  if (asset.land_area && asset.land_area <= 25) {
    recommendedStore = "Kios F&B / Minuman";
  } else if (asset.land_area && asset.land_area <= 50) {
    recommendedStore = "Minimarket / Apotek";
  } else if (asset.land_area && asset.land_area > 50) {
    recommendedStore = "Resto Transit / Kafe";
  }

  return {
    areaLabel,
    recommendedStore,
  };
}

function getRetailLocationMetrics(location: RetailLocation): {
  areaLabel: string;
  storeTypeLabel: string;
  suitabilityScore: string;
  suitabilityReason: string;
} {
  const areaMap: Record<string, string> = {
    "mgg-potential-1": "± 20 m²",
    "mgg-potential-2": "± 35 m²",
    "mgg-potential-3": "± 18 m²",
    "mgg-potential-4": "± 25 m²",
    "mgg-potential-5": "± 30 m²",
  };

  const storeMap: Record<
    string,
    { type: string; score: string; reason: string }
  > = {
    "mgg-potential-1": {
      type: "Farmasi & Apotek",
      score: "Sangat Cocok",
      reason:
        "Dekat gerbang keluar stasiun, kebutuhan darurat obat & perawatan pribadi komuter tinggi.",
    },
    "mgg-potential-2": {
      type: "F&B Grab-and-Go",
      score: "Sangat Cocok",
      reason:
        "Arus pejalan kaki padat saat jam sibuk, ideal untuk transaksi cepat kopi/makanan ringan.",
    },
    "mgg-potential-3": {
      type: "Layanan Jasa & ATM",
      score: "Cocok",
      reason:
        "Area peron transfer antarmoda, potensi layanan kilat & transaksi harian tinggi.",
    },
    "mgg-potential-4": {
      type: "Minimarket Komuter",
      score: "Sangat Cocok",
      reason:
        "Koridor utama peron, volume pergerakan belanja kebutuhan perjalanan tinggi.",
    },
    "mgg-potential-5": {
      type: "Kios Camilan & Roti",
      score: "Cocok",
      reason:
        "Zona tunggu transfer, cocok untuk sarapan cepat dan jajanan praktis.",
    },
  };

  if (location.kind === "potential") {
    const p = storeMap[location.id] ?? {
      type: location.category
        ? `${categoryLabel(location.category)} Komuter`
        : "Ritel / F&B",
      score: "Potensi Tinggi",
      reason:
        "Tingkat sirkulasi penumpang stasiun mendukung pembukaan gerai baru.",
    };
    return {
      areaLabel: areaMap[location.id] ?? "± 25 m²",
      storeTypeLabel: p.type,
      suitabilityScore: p.score,
      suitabilityReason: p.reason,
    };
  }

  if (location.kind === "existing") {
    return {
      areaLabel: "± 35–50 m²",
      storeTypeLabel: location.category
        ? categoryLabel(location.category)
        : "Retail Aktif",
      suitabilityScore: "Gerai Beroperasi",
      suitabilityReason:
        "Toko sedang aktif melayani kebutuhan pengguna stasiun.",
    };
  }

  return {
    areaLabel: "± 80–120 m²",
    storeTypeLabel: "Komersial Luar Stasiun / Kafe",
    suitabilityScore: "Potensi Menengah",
    suitabilityReason:
      "Cocok untuk gerai singgah atau usaha dengan durasi kunjungan lebih lama.",
  };
}

function Swatch({ kind }: { kind: RetailLocation["kind"] }) {
  return (
    <span
      className="retail-swatch"
      style={{
        background: RETAIL_LEGEND[kind].fill,
        borderColor: RETAIL_LEGEND[kind].stroke,
      }}
    />
  );
}

function RentalSwatch({
  status,
}: {
  status: RentalAsset["availability_status"];
}) {
  return (
    <span
      className="retail-swatch"
      style={{
        background: RENTAL_STATUS_LEGEND[status].color,
        borderColor: "#ffffff",
      }}
    />
  );
}

export interface RetailPanelProps {
  locations: RetailLocation[];
  rentalAssets?: RentalAsset[];
  selected: RetailLocation | null;
  selectedRental?: RentalAsset | null;
  activeFilter?: FilterCategory;
  onFilterChange?: (filter: FilterCategory) => void;
  onSelect: (location: RetailLocation) => void;
  onSelectRental?: (asset: RentalAsset) => void;
  onClose: () => void;
  onCloseRental?: () => void;
}

export function RetailPanel({
  locations,
  rentalAssets = [],
  selected,
  selectedRental = null,
  activeFilter: controlledFilter,
  onFilterChange,
  onSelect,
  onSelectRental,
  onClose,
  onCloseRental,
}: RetailPanelProps) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [internalFilter, setInternalFilter] = useState<FilterCategory>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [showAllGroups, setShowAllGroups] = useState<Record<string, boolean>>(
    {},
  );

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const toggleGroupShowAll = (groupKey: string) => {
    setShowAllGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const activeFilter = controlledFilter ?? internalFilter;
  const setActiveFilter = (filter: FilterCategory) => {
    setInternalFilter(filter);
    onFilterChange?.(filter);
  };

  // Klik di luar popup menu untuk menutup
  useEffect(() => {
    if (!filterOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  // Sesuaikan state open bila ada pilihan dari luar (marker peta atau daftar)
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  const currentSelectionId = selected?.id ?? selectedRental?.id ?? null;
  if (currentSelectionId !== prevSelectedId) {
    setPrevSelectedId(currentSelectionId);
    setOpen(currentSelectionId === null);
  }

  const q = query.trim().toLocaleLowerCase("id");

  // Filter aset sewa
  const matchedRentals = rentalAssets.filter((asset) => {
    if (!q) return true;
    return (
      asset.plot_name.toLocaleLowerCase("id").includes(q) ||
      (asset.area_name && asset.area_name.toLocaleLowerCase("id").includes(q))
    );
  });

  // Filter lokasi retail
  const matchedRetail = locations.filter((loc) => {
    if (!q) return true;
    return (
      loc.name.toLocaleLowerCase("id").includes(q) ||
      (loc.category &&
        categoryLabel(loc.category).toLocaleLowerCase("id").includes(q))
    );
  });

  const PREVIEW_LIMIT = 3;

  const listPotensi = matchedRetail.filter((l) => l.kind === "potential");
  const listExisting = matchedRetail.filter((l) => l.kind === "existing");
  const listRuko = matchedRetail.filter((l) => l.kind === "shopfront");

  const countSewa = matchedRentals.length;
  const countPotensi = listPotensi.length;
  const countExisting = listExisting.length;
  const countRuko = listRuko.length;
  const totalCount = countSewa + matchedRetail.length;

  const isCollapsedSewa =
    (collapsedGroups["sewa"] ?? false) && !selectedRental && !q;
  const canPaginateSewa =
    activeFilter === "all" && !q && countSewa > PREVIEW_LIMIT;
  const isShowAllSewa = showAllGroups["sewa"] ?? Boolean(selectedRental);
  const visibleRentals =
    canPaginateSewa && !isShowAllSewa
      ? matchedRentals.slice(0, PREVIEW_LIMIT)
      : matchedRentals;

  const isCollapsedPotensi =
    (collapsedGroups["potensi"] ?? false) &&
    selected?.kind !== "potential" &&
    !q;
  const canPaginatePotensi =
    activeFilter === "all" && !q && countPotensi > PREVIEW_LIMIT;
  const isShowAllPotensi =
    showAllGroups["potensi"] ?? selected?.kind === "potential";
  const visiblePotensi =
    canPaginatePotensi && !isShowAllPotensi
      ? listPotensi.slice(0, PREVIEW_LIMIT)
      : listPotensi;

  const isCollapsedExisting =
    (collapsedGroups["existing"] ?? false) &&
    selected?.kind !== "existing" &&
    !q;
  const canPaginateExisting =
    activeFilter === "all" && !q && countExisting > PREVIEW_LIMIT;
  const isShowAllExisting =
    showAllGroups["existing"] ?? selected?.kind === "existing";
  const visibleExisting =
    canPaginateExisting && !isShowAllExisting
      ? listExisting.slice(0, PREVIEW_LIMIT)
      : listExisting;

  const isCollapsedRuko =
    (collapsedGroups["ruko"] ?? false) && selected?.kind !== "shopfront" && !q;
  const canPaginateRuko =
    activeFilter === "all" && !q && countRuko > PREVIEW_LIMIT;
  const isShowAllRuko = showAllGroups["ruko"] ?? selected?.kind === "shopfront";
  const visibleRuko =
    canPaginateRuko && !isShowAllRuko
      ? listRuko.slice(0, PREVIEW_LIMIT)
      : listRuko;

  const filterOptions: {
    key: FilterCategory;
    label: string;
    count: number;
    color: string;
  }[] = [
    {
      key: "all",
      label: "Semua Kategori",
      count: totalCount,
      color: "#0f172a",
    },
    { key: "sewa", label: "Sewa Tempat", count: countSewa, color: "#2563eb" },
    {
      key: "potensi",
      label: "Potensi Toko",
      count: countPotensi,
      color: "#f59e0b",
    },
    {
      key: "existing",
      label: "Retail Aktif",
      count: countExisting,
      color: "#10b981",
    },
    {
      key: "ruko",
      label: "Ruko Depan Stasiun",
      count: countRuko,
      color: "#64748b",
    },
  ];

  const currentOption =
    filterOptions.find((opt) => opt.key === activeFilter) ?? filterOptions[0];

  const showSewa =
    (activeFilter === "all" || activeFilter === "sewa") && countSewa > 0;
  const showPotensi =
    (activeFilter === "all" || activeFilter === "potensi") && countPotensi > 0;
  const showExisting =
    (activeFilter === "all" || activeFilter === "existing") &&
    countExisting > 0;
  const showRuko =
    (activeFilter === "all" || activeFilter === "ruko") && countRuko > 0;

  const handleCloseDetail = () => {
    if (selected) onClose();
    if (selectedRental && onCloseRental) onCloseRental();
    setOpen(true);
  };

  const isAnySelected = Boolean(selected || selectedRental);

  return (
    <>
      <div className="retail-panel-container">
        {/* Tombol Collapsible Header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="retail-toggle-btn btn-reset"
          aria-expanded={open}
        >
          <div className="retail-toggle-left">
            <span className="retail-toggle-icon">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            {!open && isAnySelected ? (
              <div className="retail-selected-preview">
                {selected ? (
                  <>
                    <Swatch kind={selected.kind} />
                    <span className="retail-selected-name">
                      {selected.name}
                    </span>
                  </>
                ) : selectedRental ? (
                  <>
                    <RentalSwatch status={selectedRental.availability_status} />
                    <span className="retail-selected-name">
                      {selectedRental.plot_name}
                    </span>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="retail-toggle-text">
                <span className="retail-toggle-title">
                  Daftar Aset &amp; Retail
                </span>
                <span className="retail-toggle-subtitle">
                  {locations.length + rentalAssets.length} unit terdata
                </span>
              </div>
            )}
          </div>
          <div className="retail-toggle-right">
            <span
              className="retail-chevron-wrapper"
              style={{
                transform: `rotate(${open ? 180 : 0}deg)`,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>
        </button>

        {open && (
          <div className="retail-dropdown-body">
            {/* Toolbar: Kotak Pencarian + Filter Pop-Up Kecil */}
            <div className="retail-toolbar">
              <div className="retail-search-box">
                <svg
                  className="retail-search-icon"
                  width="15"
                  height="15"
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
                  type="text"
                  className="retail-search-input"
                  aria-label="Cari retail atau potensi toko"
                  placeholder="Cari aset sewa, gerai, potensi, ruko…"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="retail-search-clear"
                    aria-label="Hapus pencarian retail"
                    onClick={() => setQuery("")}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Pop-up Filter Kecil */}
              <div
                className="retail-filter-popup-container"
                ref={filterMenuRef}
              >
                <button
                  type="button"
                  className={`retail-filter-popup-btn ${activeFilter !== "all" ? "has-active" : ""}`}
                  onClick={() => setFilterOpen((v) => !v)}
                  aria-expanded={filterOpen}
                  aria-label="Filter kategori aset"
                  title="Pilih filter kategori aset"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span className="retail-filter-btn-text">
                    {activeFilter === "all" ? "Filter" : currentOption.label}
                  </span>
                  <span className="retail-filter-btn-badge">
                    {currentOption.count}
                  </span>
                  <svg
                    className="retail-filter-chevron"
                    style={{ transform: `rotate(${filterOpen ? 180 : 0}deg)` }}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {filterOpen && (
                  <div className="retail-filter-popup-menu" role="menu">
                    <div className="retail-filter-menu-header">
                      Filter Kategori
                    </div>
                    {filterOptions.map((opt) => {
                      const isSelected = activeFilter === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          role="menuitemradio"
                          aria-checked={isSelected}
                          className={`retail-filter-menu-item ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setActiveFilter(opt.key);
                            setFilterOpen(false);
                          }}
                        >
                          <div className="retail-filter-item-left">
                            <span
                              className="retail-filter-item-dot"
                              style={{ background: opt.color }}
                            />
                            <span className="retail-filter-item-label">
                              {opt.label}
                            </span>
                          </div>
                          <div className="retail-filter-item-right">
                            <span className="retail-filter-item-count">
                              {opt.count}
                            </span>
                            {isSelected && (
                              <svg
                                className="retail-filter-check"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {totalCount === 0 ? (
              <div className="retail-picker-empty">
                {locations.length + rentalAssets.length === 0
                  ? "Tidak ada asset untuk stasiun ini."
                  : `Tidak ada lokasi atau aset bernama “${query.trim()}”.`}
              </div>
            ) : (
              <div className="retail-sections">
                {/* 1. KELOMPOK SEWA TEMPAT (Space KAI & Kios) */}
                {showSewa && (
                  <section
                    className="retail-group rental-asset-group"
                    role="region"
                    aria-label="Aset sewa stasiun"
                  >
                    <div
                      className="retail-group-header clickable"
                      onClick={() => toggleGroupCollapse("sewa")}
                      role="button"
                      tabIndex={0}
                      aria-expanded={!isCollapsedSewa}
                      aria-label={`Sewa Tempat (Aset Stasiun), ${matchedRentals.length} lokasi. ${isCollapsedSewa ? "Klik untuk menampilkan" : "Klik untuk menyembunyikan"}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleGroupCollapse("sewa");
                        }
                      }}
                    >
                      <div className="retail-group-label">
                        <span
                          className="retail-swatch"
                          style={{
                            background: "#2563eb",
                            borderColor: "#60a5fa",
                          }}
                        />
                        <span>Sewa Tempat (Aset Stasiun)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="retail-group-count">
                          {matchedRentals.length} lokasi
                        </span>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="retail-group-chevron"
                          style={{
                            transform: isCollapsedSewa
                              ? "rotate(-90deg)"
                              : "rotate(0deg)",
                            transition:
                              "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            color: "var(--ink-muted)",
                          }}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                    {!isCollapsedSewa && (
                      <>
                        <div className="retail-group-items rental-asset-list">
                          {visibleRentals.map((asset) => {
                            const isSelected = selectedRental?.id === asset.id;
                            const metrics = getRentalAssetMetrics(asset);
                            return (
                              <button
                                key={asset.id}
                                type="button"
                                className={`retail-card-btn ${isSelected ? "selected" : ""}`}
                                aria-label={asset.plot_name}
                                aria-pressed={isSelected}
                                onClick={() => {
                                  if (onSelectRental) onSelectRental(asset);
                                }}
                              >
                                <div className="retail-card-content">
                                  <div className="retail-card-name">
                                    {asset.plot_name}
                                  </div>
                                  <div className="retail-card-badges">
                                    <span className="retail-badge-type type-sewa">
                                      Sewa Tempat
                                    </span>
                                    <span
                                      className="retail-badge-status"
                                      style={{
                                        background:
                                          asset.availability_status ===
                                          "available"
                                            ? "rgba(16, 185, 129, 0.12)"
                                            : asset.availability_status ===
                                                "occupied"
                                              ? "rgba(100, 116, 139, 0.12)"
                                              : "rgba(245, 158, 11, 0.12)",
                                        color:
                                          asset.availability_status ===
                                          "available"
                                            ? "#047857"
                                            : asset.availability_status ===
                                                "occupied"
                                              ? "#475569"
                                              : "#b45309",
                                      }}
                                    >
                                      {rentalStatusLabel(
                                        asset.availability_status,
                                      )}
                                    </span>
                                    <span className="retail-badge-source">
                                      {asset.data_source === "space_kai"
                                        ? "Space KAI"
                                        : "Survei"}
                                    </span>
                                  </div>
                                  <div className="retail-card-metrics">
                                    <span className="retail-metric-chip">
                                      📐 {metrics.areaLabel}
                                    </span>
                                    <span className="retail-metric-chip recommendation">
                                      🎯 Saran: {metrics.recommendedStore}
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className="retail-card-arrow"
                                  aria-hidden="true"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="m9 18 6-6-6-6" />
                                  </svg>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {canPaginateSewa && (
                          <button
                            type="button"
                            className="retail-expand-btn"
                            onClick={() => toggleGroupShowAll("sewa")}
                            aria-expanded={isShowAllSewa}
                          >
                            <span>
                              {isShowAllSewa
                                ? "Tampilkan lebih sedikit"
                                : `Tampilkan ${countSewa - PREVIEW_LIMIT} lainnya`}
                            </span>
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="retail-expand-icon"
                              style={{
                                transform: isShowAllSewa
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition:
                                  "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                              }}
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </section>
                )}

                {/* DAFTAR LOKASI RETAIL & POTENSI TOKO */}
                {locations.length === 0 ? (
                  <div className="retail-picker-empty">
                    Tidak ada asset untuk stasiun ini.
                  </div>
                ) : (
                  <div className="retail-location-list">
                    {/* 2. KELOMPOK POTENSI TOKO BARU */}
                    {showPotensi && (
                      <div className="retail-group">
                        <div
                          className="retail-group-header clickable"
                          onClick={() => toggleGroupCollapse("potensi")}
                          role="button"
                          tabIndex={0}
                          aria-expanded={!isCollapsedPotensi}
                          aria-label={`Potensi Toko Baru, ${countPotensi} lokasi. ${isCollapsedPotensi ? "Klik untuk menampilkan" : "Klik untuk menyembunyikan"}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleGroupCollapse("potensi");
                            }
                          }}
                        >
                          <div className="retail-group-label">
                            <Swatch kind="potential" />
                            <span>Potensi Toko Baru</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="retail-group-count">
                              {countPotensi}
                            </span>
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="retail-group-chevron"
                              style={{
                                transform: isCollapsedPotensi
                                  ? "rotate(-90deg)"
                                  : "rotate(0deg)",
                                transition:
                                  "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                color: "var(--ink-muted)",
                              }}
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                        {!isCollapsedPotensi && (
                          <>
                            <div className="retail-group-items">
                              {visiblePotensi.map((location) => {
                                const isSelected = selected?.id === location.id;
                                const metrics =
                                  getRetailLocationMetrics(location);
                                return (
                                  <button
                                    key={location.id}
                                    type="button"
                                    className={`retail-card-btn ${isSelected ? "selected" : ""}`}
                                    aria-label={location.name}
                                    aria-pressed={isSelected}
                                    onClick={() => onSelect(location)}
                                  >
                                    <div className="retail-card-content">
                                      <div className="retail-card-name">
                                        {location.name}
                                      </div>
                                      <div className="retail-card-badges">
                                        <span className="retail-badge-type type-potensi">
                                          Potensi Toko
                                        </span>
                                        <span
                                          className={`retail-badge-status status-${location.status}`}
                                        >
                                          {STATUS_LABEL[location.status]}
                                        </span>
                                        {location.category && (
                                          <span className="retail-badge-category">
                                            {categoryLabel(location.category)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="retail-card-metrics">
                                        <span className="retail-metric-chip">
                                          📐 {metrics.areaLabel}
                                        </span>
                                        <span className="retail-metric-chip recommendation">
                                          🎯 Cocok: {metrics.storeTypeLabel}
                                        </span>
                                      </div>
                                    </div>
                                    <div
                                      className="retail-card-arrow"
                                      aria-hidden="true"
                                    >
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="m9 18 6-6-6-6" />
                                      </svg>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {canPaginatePotensi && (
                              <button
                                type="button"
                                className="retail-expand-btn"
                                onClick={() => toggleGroupShowAll("potensi")}
                                aria-expanded={isShowAllPotensi}
                              >
                                <span>
                                  {isShowAllPotensi
                                    ? "Tampilkan lebih sedikit"
                                    : `Tampilkan ${countPotensi - PREVIEW_LIMIT} lainnya`}
                                </span>
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="retail-expand-icon"
                                  style={{
                                    transform: isShowAllPotensi
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                    transition:
                                      "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                  }}
                                >
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* 3. KELOMPOK RETAIL TERSEDIA / BEROPERASI */}
                    {showExisting && (
                      <div className="retail-group">
                        <div
                          className="retail-group-header clickable"
                          onClick={() => toggleGroupCollapse("existing")}
                          role="button"
                          tabIndex={0}
                          aria-expanded={!isCollapsedExisting}
                          aria-label={`Retail Beroperasi, ${countExisting} lokasi. ${isCollapsedExisting ? "Klik untuk menampilkan" : "Klik untuk menyembunyikan"}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleGroupCollapse("existing");
                            }
                          }}
                        >
                          <div className="retail-group-label">
                            <Swatch kind="existing" />
                            <span>Retail Beroperasi</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="retail-group-count">
                              {countExisting}
                            </span>
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="retail-group-chevron"
                              style={{
                                transform: isCollapsedExisting
                                  ? "rotate(-90deg)"
                                  : "rotate(0deg)",
                                transition:
                                  "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                color: "var(--ink-muted)",
                              }}
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                        {!isCollapsedExisting && (
                          <>
                            <div className="retail-group-items">
                              {visibleExisting.map((location) => {
                                const isSelected = selected?.id === location.id;
                                const metrics =
                                  getRetailLocationMetrics(location);
                                return (
                                  <button
                                    key={location.id}
                                    type="button"
                                    className={`retail-card-btn ${isSelected ? "selected" : ""}`}
                                    aria-label={location.name}
                                    aria-pressed={isSelected}
                                    onClick={() => onSelect(location)}
                                  >
                                    <div className="retail-card-content">
                                      <div className="retail-card-name">
                                        {location.name}
                                      </div>
                                      <div className="retail-card-badges">
                                        <span className="retail-badge-type type-tersedia">
                                          Retail Aktif
                                        </span>
                                        <span
                                          className={`retail-badge-status status-${location.status}`}
                                        >
                                          {STATUS_LABEL[location.status]}
                                        </span>
                                        {location.category && (
                                          <span className="retail-badge-category">
                                            {categoryLabel(location.category)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="retail-card-metrics">
                                        <span className="retail-metric-chip">
                                          📐 {metrics.areaLabel}
                                        </span>
                                        <span className="retail-metric-chip">
                                          🏪 {metrics.storeTypeLabel}
                                        </span>
                                      </div>
                                    </div>
                                    <div
                                      className="retail-card-arrow"
                                      aria-hidden="true"
                                    >
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="m9 18 6-6-6-6" />
                                      </svg>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {canPaginateExisting && (
                              <button
                                type="button"
                                className="retail-expand-btn"
                                onClick={() => toggleGroupShowAll("existing")}
                                aria-expanded={isShowAllExisting}
                              >
                                <span>
                                  {isShowAllExisting
                                    ? "Tampilkan lebih sedikit"
                                    : `Tampilkan ${countExisting - PREVIEW_LIMIT} lainnya`}
                                </span>
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="retail-expand-icon"
                                  style={{
                                    transform: isShowAllExisting
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                    transition:
                                      "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                  }}
                                >
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* 4. KELOMPOK RUKO DEPAN STASIUN */}
                    {showRuko && (
                      <div className="retail-group">
                        <div
                          className="retail-group-header clickable"
                          onClick={() => toggleGroupCollapse("ruko")}
                          role="button"
                          tabIndex={0}
                          aria-expanded={!isCollapsedRuko}
                          aria-label={`Ruko Depan Stasiun, ${countRuko} lokasi. ${isCollapsedRuko ? "Klik untuk menampilkan" : "Klik untuk menyembunyikan"}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleGroupCollapse("ruko");
                            }
                          }}
                        >
                          <div className="retail-group-label">
                            <Swatch kind="shopfront" />
                            <span>Ruko Depan Stasiun</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="retail-group-count">
                              {countRuko}
                            </span>
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="retail-group-chevron"
                              style={{
                                transform: isCollapsedRuko
                                  ? "rotate(-90deg)"
                                  : "rotate(0deg)",
                                transition:
                                  "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                color: "var(--ink-muted)",
                              }}
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                        {!isCollapsedRuko && (
                          <>
                            <div className="retail-group-items">
                              {visibleRuko.map((location) => {
                                const isSelected = selected?.id === location.id;
                                const metrics =
                                  getRetailLocationMetrics(location);
                                return (
                                  <button
                                    key={location.id}
                                    type="button"
                                    className={`retail-card-btn ${isSelected ? "selected" : ""}`}
                                    aria-label={location.name}
                                    aria-pressed={isSelected}
                                    onClick={() => onSelect(location)}
                                  >
                                    <div className="retail-card-content">
                                      <div className="retail-card-name">
                                        {location.name}
                                      </div>
                                      <div className="retail-card-badges">
                                        <span className="retail-badge-type type-ruko">
                                          Ruko Depan
                                        </span>
                                        <span
                                          className={`retail-badge-status status-${location.status}`}
                                        >
                                          {STATUS_LABEL[location.status]}
                                        </span>
                                      </div>
                                      <div className="retail-card-metrics">
                                        <span className="retail-metric-chip">
                                          📐 {metrics.areaLabel}
                                        </span>
                                        <span className="retail-metric-chip">
                                          🏢 {metrics.storeTypeLabel}
                                        </span>
                                      </div>
                                    </div>
                                    <div
                                      className="retail-card-arrow"
                                      aria-hidden="true"
                                    >
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="m9 18 6-6-6-6" />
                                      </svg>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {canPaginateRuko && (
                              <button
                                type="button"
                                className="retail-expand-btn"
                                onClick={() => toggleGroupShowAll("ruko")}
                                aria-expanded={isShowAllRuko}
                              >
                                <span>
                                  {isShowAllRuko
                                    ? "Tampilkan lebih sedikit"
                                    : `Tampilkan ${countRuko - PREVIEW_LIMIT} lainnya`}
                                </span>
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="retail-expand-icon"
                                  style={{
                                    transform: isShowAllRuko
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                    transition:
                                      "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                  }}
                                >
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL VIEW KARTU TERPILIH (RetailLocation ATAU RentalAsset) */}
      {selected ? (
        <article
          className="retail-detail retail-detail-card"
          aria-label="Detail lokasi retail"
          aria-live="polite"
        >
          <div className="retail-detail-top">
            <div className="retail-detail-kind-badge">
              <Swatch kind={selected.kind} />
              <span style={{ fontWeight: 500 }}>
                {selected.kind === "potential"
                  ? "Potensi Toko"
                  : selected.kind === "existing"
                    ? "Retail Aktif"
                    : "Ruko Komersial"}
              </span>
            </div>
            <button
              className="retail-detail-close-btn btn-reset"
              type="button"
              aria-label="Tutup detail retail"
              onClick={handleCloseDetail}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <h3 className="retail-detail-title">{selected.name}</h3>

          {(() => {
            const m = getRetailLocationMetrics(selected);
            return (
              <div className="retail-detail-grid">
                <div className="retail-detail-metric">
                  <span className="retail-metric-label">Status Aset</span>
                  <span
                    className={`retail-metric-value status-${selected.status}`}
                  >
                    {STATUS_LABEL[selected.status]}
                  </span>
                </div>
                <div className="retail-detail-metric">
                  <span className="retail-metric-label">
                    Prediksi Toko Cocok
                  </span>
                  <span
                    className="retail-metric-value bold"
                    style={{ color: "var(--brand-strong)" }}
                  >
                    {m.storeTypeLabel}
                  </span>
                </div>
                <div className="retail-detail-metric">
                  <span className="retail-metric-label">Estimasi Luas</span>
                  <span className="retail-metric-value">{m.areaLabel}</span>
                </div>
                <div className="retail-detail-metric">
                  <span className="retail-metric-label">
                    Tingkat Kesesuaian
                  </span>
                  <span className="retail-metric-value bold">
                    {m.suitabilityScore}
                  </span>
                </div>
                <div className="retail-detail-metric full-width">
                  <span className="retail-metric-label">Alasan Prediksi</span>
                  <span
                    className="retail-metric-value"
                    style={{
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: "var(--ink-2)",
                    }}
                  >
                    {m.suitabilityReason}
                  </span>
                </div>
                <div className="retail-detail-metric full-width">
                  <span className="retail-metric-label">Koordinat Spasial</span>
                  <span className="retail-metric-value mono">
                    {selected.latitude.toFixed(7)},{" "}
                    {selected.longitude.toFixed(7)}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="retail-detail-note">
            <p>{selected.note || RETAIL_LEGEND[selected.kind].description}</p>
          </div>

          <div className="retail-detail-action">
            <button
              type="button"
              className="retail-focus-map-btn btn-reset"
              onClick={() => onSelect(selected)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Pusatkan Kamera ke Lokasi Ini</span>
            </button>
          </div>
        </article>
      ) : selectedRental ? (
        <article
          className="retail-detail retail-detail-card"
          aria-label="Detail lokasi retail"
          aria-live="polite"
        >
          <div className="retail-detail-top">
            <div className="retail-detail-kind-badge">
              <RentalSwatch status={selectedRental.availability_status} />
              <span className="flex items-center gap-1.5">
                <span style={{ fontWeight: 500 }}>Sewa Tempat</span>
                <span style={{ opacity: 0.35, fontSize: 9 }}>•</span>
                <span
                  style={{
                    color:
                      RENTAL_STATUS_LEGEND[selectedRental.availability_status]
                        .color,
                    fontWeight: 600,
                  }}
                >
                  {rentalStatusLabel(selectedRental.availability_status)}
                </span>
              </span>
            </div>
            <button
              className="retail-detail-close-btn btn-reset"
              type="button"
              aria-label="Tutup detail retail"
              onClick={handleCloseDetail}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <h3 className="retail-detail-title">{selectedRental.plot_name}</h3>

          {(() => {
            const m = getRentalAssetMetrics(selectedRental);
            return (
              <div className="retail-detail-grid">
                <div className="retail-detail-metric">
                  <span className="retail-metric-label">
                    Status Ketersediaan
                  </span>
                  <span
                    className="retail-metric-value"
                    style={{
                      color:
                        RENTAL_STATUS_LEGEND[selectedRental.availability_status]
                          .color,
                      fontWeight: 600,
                    }}
                  >
                    {rentalStatusLabel(selectedRental.availability_status)}
                  </span>
                </div>
                <div className="retail-detail-metric">
                  <span className="retail-metric-label">Sumber Data</span>
                  <span className="retail-metric-value">
                    {selectedRental.data_source === "space_kai"
                      ? "Space KAI"
                      : "Survei Lapangan"}
                  </span>
                </div>
                <div className="retail-detail-metric">
                  <span className="retail-metric-label">Luas Tanah/Lahan</span>
                  <span className="retail-metric-value bold">
                    {m.areaLabel}
                  </span>
                </div>
                <div className="retail-detail-metric">
                  <span className="retail-metric-label">
                    Prediksi Toko Cocok
                  </span>
                  <span
                    className="retail-metric-value bold"
                    style={{ color: "var(--brand-strong)" }}
                  >
                    {m.recommendedStore}
                  </span>
                </div>
                <div className="retail-detail-metric full-width">
                  <span className="retail-metric-label">Koordinat Spasial</span>
                  <span className="retail-metric-value mono">
                    {selectedRental.latitude.toFixed(7)},{" "}
                    {selectedRental.longitude.toFixed(7)}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="retail-detail-note">
            <p>
              {selectedRental.note ||
                RENTAL_STATUS_LEGEND[selectedRental.availability_status]
                  .description}
            </p>
          </div>

          <div className="retail-detail-action">
            <button
              type="button"
              className="retail-focus-map-btn btn-reset"
              onClick={() => {
                if (onSelectRental) onSelectRental(selectedRental);
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Pusatkan Kamera ke Lokasi Ini</span>
            </button>
          </div>
        </article>
      ) : (
        <div className="retail-detail-placeholder">
          <div className="retail-placeholder-icon">📍</div>
          <div className="retail-placeholder-text">
            Pilih salah satu aset sewa atau retail di atas, atau klik langsung
            lingkaran penanda pada peta untuk meninjau rincian lokasi.
          </div>
        </div>
      )}
    </>
  );
}
