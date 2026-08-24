/**
 * Stands in for the design tool's `<image-slot>` custom element (a design-tool
 * only helper — not needed at runtime). Marks where real station/survey
 * photography goes; swap the `<div>` for a Next.js `<Image>` once assets exist.
 */
export function ImagePlaceholder({
  label,
  className,
  style,
}: {
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        color: "#94A3B8",
        textAlign: "center",
        padding: "0 24px",
        ...style,
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" />
        <path d="m21 15-5-5-9 9" />
      </svg>
      <span style={{ fontSize: 11.5, lineHeight: 1.5 }}>{label}</span>
    </div>
  );
}
