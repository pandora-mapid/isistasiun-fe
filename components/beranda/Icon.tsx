import type { CSSProperties, SVGProps } from "react";

export type IconName =
  | "arrow_forward"
  | "arrow_downward"
  | "add"
  | "remove"
  | "layers"
  | "trending_up"
  | "storefront"
  | "store"
  | "conversion_path"
  | "directions_walk"
  | "visibility"
  | "shopping_bag"
  | "payments"
  | "speed"
  | "account_balance_wallet"
  | "category"
  | "restaurant"
  | "local_convenience_store"
  | "medication"
  | "dry_cleaning"
  | "balance"
  | "schedule"
  | "unfold_more"
  | "expand_more"
  | "info"
  | "verified"
  | "psychology"
  | "auto_awesome"
  | "fact_check"
  | "close"
  | "train"
  | "check_circle"
  | "open_in_new"
  | "person";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, className = "", style, ...props }: IconProps) {
  const common = {
    className,
    style,
    width: "1em",
    height: "1em",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": "true" as const,
    ...props,
  };

  switch (name) {
    case "arrow_forward":
      return (
        <svg {...common}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );

    case "arrow_downward":
      return (
        <svg {...common}>
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      );

    case "add":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case "remove":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );

    case "layers":
      return (
        <svg {...common}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );

    case "trending_up":
      return (
        <svg {...common}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );

    case "storefront":
    case "store":
      return (
        <svg {...common}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );

    case "conversion_path":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path d="M6 9v3a3 3 0 0 0 3 3h6" />
        </svg>
      );

    case "directions_walk":
      return (
        <svg {...common}>
          <circle cx="13" cy="4" r="2" />
          <path d="m9 20 3-6 2 3 3 3" />
          <path d="m6 16 3-3 2 1 3-3" />
          <path d="M14 9a3 3 0 0 0-3-3H9" />
        </svg>
      );

    case "visibility":
      return (
        <svg {...common}>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case "shopping_bag":
      return (
        <svg {...common}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );

    case "payments":
      return (
        <svg {...common}>
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      );

    case "speed":
      return (
        <svg {...common}>
          <path d="m12 14 4-4" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
        </svg>
      );

    case "account_balance_wallet":
      return (
        <svg {...common}>
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
      );

    case "category":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="3" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <polygon points="12 14 7 21 17 21" />
        </svg>
      );

    case "restaurant":
      return (
        <svg {...common}>
          <path d="M18 2v20M21 15V2a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3z" />
          <path d="M3 2v6a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2M6 2v20" />
        </svg>
      );

    case "local_convenience_store":
      return (
        <svg {...common}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <rect x="9" y="13" width="6" height="9" />
        </svg>
      );

    case "medication":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="10" rx="5" />
          <line x1="12" x2="12" y1="7" y2="17" />
        </svg>
      );

    case "dry_cleaning":
      return (
        <svg {...common}>
          <path d="M12 2a3 3 0 0 0-3 3c0 1.3.8 2.4 2 2.8L2 14h20L13 7.8c1.2-.4 2-1.5 2-2.8a3 3 0 0 0-3-3z" />
          <path d="M4 14v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
        </svg>
      );

    case "balance":
      return (
        <svg {...common}>
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h18" />
        </svg>
      );

    case "schedule":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );

    case "unfold_more":
      return (
        <svg {...common}>
          <polyline points="7 9 12 4 17 9" />
          <polyline points="7 15 12 20 17 15" />
        </svg>
      );

    case "expand_more":
      return (
        <svg {...common}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      );

    case "verified":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );

    case "psychology":
      return (
        <svg {...common}>
          <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-3 3.9 4 4 0 0 0 2 3.5 4 4 0 0 0 5 3.6V20a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2a4 4 0 0 0 5-3.6 4 4 0 0 0 2-3.5A4 4 0 0 0 16 7V6a4 4 0 0 0-4-4z" />
        </svg>
      );

    case "auto_awesome":
      return (
        <svg {...common}>
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
        </svg>
      );

    case "fact_check":
      return (
        <svg {...common}>
          <rect width="16" height="18" x="4" y="3" rx="2" />
          <path d="m9 12 2 2 4-4" />
          <path d="M8 7h8" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <line x1="18" x2="6" y1="6" y2="18" />
          <line x1="6" x2="18" y1="6" y2="18" />
        </svg>
      );

    case "train":
      return (
        <svg {...common}>
          <rect width="16" height="16" x="4" y="3" rx="2" />
          <path d="M4 11h16" />
          <path d="M12 3v8" />
          <path d="m8 19-3 3" />
          <path d="m16 19 3 3" />
          <circle cx="8" cy="15" r="1" fill="currentColor" />
          <circle cx="16" cy="15" r="1" fill="currentColor" />
        </svg>
      );

    case "check_circle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );

    case "open_in_new":
      return (
        <svg {...common}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" x2="21" y1="14" y2="3" />
        </svg>
      );

    case "person":
      return (
        <svg {...common}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );

    default:
      return null;
  }
}
