"use client";

import { useEffect, useRef, useState } from "react";
import {
  BASEMAP_OPTIONS,
  type BasemapName,
  type BasemapOption,
} from "@/lib/map/config";

export type LayerToggleItem = {
  key: string;
  label: string;
  dot: string;
  description?: string;
  available: boolean;
};

export type CategoryOption = {
  key: string;
  label: string;
  dot?: string;
};

type MapToolbarProps = {
  /** Daftar ID layer yang sedang aktif */
  activeLayers: string[];
  /** Callback saat toggle satu layer */
  onToggleLayer: (layerKey: string) => void;
  /** Definisi baris layer untuk checklist */
  layerItems: LayerToggleItem[];
  /** Catchment walking minutes aktif (3, 5, 10) */
  activeCatchment: number;
  /** Callback saat catchment diubah */
  onSelectCatchment: (minutes: number) => void;
  /** Basemap yang sedang aktif */
  activeBasemap: BasemapName;
  /** Callback saat memilih basemap baru */
  onSelectBasemap: (name: BasemapName) => void;
  /** Callback saat tombol reset view ditekan */
  onResetView: () => void;
  /** Kategori aktif (opsional) */
  activeCategory?: string;
  /** Callback saat memilih kategori baru */
  onSelectCategory?: (category: string) => void;
  /** Daftar kategori usaha (opsional) */
  categories?: CategoryOption[];
};

export function MapToolbar({
  activeLayers,
  onToggleLayer,
  layerItems,
  activeCatchment,
  onSelectCatchment,
  activeBasemap,
  onSelectBasemap,
  onResetView,
  activeCategory,
  onSelectCategory,
  categories,
}: MapToolbarProps) {
  const [activePanel, setActivePanel] = useState<"layers" | "basemap" | null>(
    null,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  // Deteksi status fullscreen browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Tutup panel jika pengguna menekan ESC atau klik di luar toolbar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        setActivePanel(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePanel(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const activeLayerCount = layerItems.filter(
    (l) => l.available && activeLayers.includes(l.key),
  ).length;

  const currentBasemapOption = BASEMAP_OPTIONS.find(
    (b) => b.id === activeBasemap,
  );

  return (
    <div
      ref={toolbarRef}
      className="map-floating-toolbar"
      style={{
        position: "absolute",
        left: 10,
        top: 332,
        zIndex: 22,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Kolom tombol alat utama */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 8,
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.12)",
          border: "1px solid #cbd5e1",
          overflow: "hidden",
        }}
      >
        {/* 1. Tombol Lapisan Peta */}
        <button
          type="button"
          onClick={() =>
            setActivePanel((curr) => (curr === "layers" ? null : "layers"))
          }
          className="btn-reset layers-toggle"
          title="Kelola lapisan & filter peta"
          aria-label="Kelola lapisan peta"
          aria-expanded={activePanel === "layers"}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            background:
              activePanel === "layers"
                ? "rgba(15, 23, 42, 0.08)"
                : "transparent",
            color: activePanel === "layers" ? "#0f172a" : "#475569",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {/* Ikon Layers / Stack */}
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          {/* Badge jumlah layer aktif */}
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 12,
              height: 12,
              padding: "0 2px",
              borderRadius: 6,
              background: "#0f172a",
              color: "#ffffff",
              fontSize: 8,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {activeLayerCount}
          </span>
        </button>

        <div style={{ height: 1, background: "#e2e8f0" }} />

        {/* 2. Tombol Galeri Peta Dasar */}
        <button
          type="button"
          onClick={() =>
            setActivePanel((curr) => (curr === "basemap" ? null : "basemap"))
          }
          className="btn-reset"
          title="Pilih gaya peta dasar (Basemap Gallery)"
          aria-label="Pilih peta dasar"
          aria-expanded={activePanel === "basemap"}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            background:
              activePanel === "basemap"
                ? "rgba(15, 23, 42, 0.08)"
                : "transparent",
            color: activePanel === "basemap" ? "#0f172a" : "#475569",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {/* Ikon Map / Basemap */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        </button>

        <div style={{ height: 1, background: "#e2e8f0" }} />

        {/* 3. Tombol Reset / Pusatkan Pandangan */}
        <button
          type="button"
          onClick={onResetView}
          className="btn-reset"
          title="Kembalikan fokus ke batas kawasan stasiun"
          aria-label="Pusatkan peta"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            background: "transparent",
            color: "#475569",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {/* Ikon Crosshair / Focus */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
        </button>

        <div style={{ height: 1, background: "#e2e8f0" }} />

        {/* 4. Tombol Layar Penuh (Fullscreen) */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="btn-reset"
          title={isFullscreen ? "Keluar layar penuh" : "Tampilan layar penuh"}
          aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            background: "transparent",
            color: "#475569",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {isFullscreen ? (
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
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          ) : (
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
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          )}
        </button>
      </div>

      {/* POPOVER 1: Panel Lapisan Peta */}
      {activePanel === "layers" && (
        <div
          style={{
            position: "absolute",
            left: 42,
            top: 0,
            width: 275,
            borderRadius: 12,
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 30px rgba(15, 23, 42, 0.16)",
            border: "1px solid #cbd5e1",
            padding: "14px 14px 12px",
            color: "#0f172a",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                Lapisan Peta
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: "#f1f5f9",
                  color: "#475569",
                }}
              >
                {activeLayerCount} aktif
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="btn-reset"
              style={{
                fontSize: 11,
                color: "#64748b",
                cursor: "pointer",
                padding: "2px 4px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Daftar Layer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {layerItems.map((item) => {
              const active = activeLayers.includes(item.key);
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => item.available && onToggleLayer(item.key)}
                  className="lyr btn-reset"
                  aria-disabled={!item.available}
                  aria-pressed={active}
                  title={
                    item.available ? undefined : "lapisan ini belum punya data"
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: active
                      ? "rgba(15, 23, 42, 0.04)"
                      : "transparent",
                    cursor: item.available ? "pointer" : "not-allowed",
                    opacity: item.available ? 1 : 0.45,
                    transition: "all 0.12s ease",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  {/* Checkbox bergaya custom */}
                  <span
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 4,
                      border: active
                        ? "1.5px solid #0f172a"
                        : "1.5px solid #94a3b8",
                      background: active ? "#0f172a" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {active && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: item.dot,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      fontWeight: active ? 600 : 450,
                      color: item.available ? "#0f172a" : "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </span>
                  {!item.available && (
                    <span
                      style={{
                        fontSize: 9,
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      belum ada
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Pengaturan Radius Jalan Kaki (Catchment) */}
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>
                Jangkauan Jalan Kaki
              </span>
              <span style={{ fontSize: 10, color: "#64748b" }}>
                isochrone stasiun
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[3, 5, 10].map((mnt) => {
                const isSelected = activeCatchment === mnt;
                return (
                  <button
                    key={mnt}
                    type="button"
                    onClick={() => onSelectCatchment(mnt)}
                    className="btn-reset"
                    style={{
                      flex: 1,
                      padding: "4px 0",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected ? "#0f172a" : "#f1f5f9",
                      color: isSelected ? "#ffffff" : "#475569",
                      border: `1px solid ${isSelected ? "#0f172a" : "#e2e8f0"}`,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.12s ease",
                    }}
                  >
                    {mnt} mnt
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pengaturan Kategori Usaha */}
          {categories && onSelectCategory && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}
                >
                  Kategori Usaha
                </span>
                <span style={{ fontSize: 10, color: "#64748b" }}>
                  filter titik
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                }}
              >
                {categories.map((c) => {
                  const isSelected = activeCategory === c.key;
                  return (
                    <button
                      type="button"
                      key={c.key}
                      onClick={() => onSelectCategory(c.key)}
                      className="btn-reset"
                      aria-pressed={isSelected}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: isSelected ? 600 : 400,
                        background: isSelected ? "#0f172a" : "#f1f5f9",
                        color: isSelected ? "#ffffff" : "#334155",
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                      }}
                    >
                      {c.dot && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: isSelected ? "#ffffff" : c.dot,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* POPOVER 2: Galeri Peta Dasar (Basemap Gallery) */}
      {activePanel === "basemap" && (
        <div
          style={{
            position: "absolute",
            left: 42,
            top: 25,
            width: 295,
            borderRadius: 12,
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 30px rgba(15, 23, 42, 0.16)",
            border: "1px solid #cbd5e1",
            padding: "14px 14px 12px",
            color: "#0f172a",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                Peta Dasar
              </span>
              <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>
                Pilih gaya peta latar untuk analisis
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="btn-reset"
              style={{
                fontSize: 11,
                color: "#64748b",
                cursor: "pointer",
                padding: "2px 4px",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxHeight: 330,
              overflowY: "auto",
              paddingRight: 2,
            }}
          >
            {BASEMAP_OPTIONS.map((opt: BasemapOption) => {
              const isSelected = activeBasemap === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    onSelectBasemap(opt.id);
                    setActivePanel(null);
                  }}
                  className="btn-reset"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: isSelected ? "#0f172a" : "#f8fafc",
                    color: isSelected ? "#ffffff" : "#0f172a",
                    border: `1px solid ${isSelected ? "#0f172a" : "#e2e8f0"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 650 }}>
                        {opt.name}
                      </span>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 4,
                            background: isSelected
                              ? "rgba(255, 255, 255, 0.2)"
                              : "rgba(15, 23, 42, 0.08)",
                            color: isSelected ? "#ffffff" : "#475569",
                            fontWeight: 600,
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: isSelected
                          ? "rgba(255, 255, 255, 0.75)"
                          : "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {opt.description}
                    </div>
                  </div>

                  {isSelected && (
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#ffffff",
                        color: "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
