import type { SVGProps } from "react";

/** A small, consistent line-icon set (1.6px stroke on a 20px grid). */
const PATHS = {
  search: "M9 15.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM13.7 13.7 17.5 17.5",
  sun: "M10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM10 2v1.6M10 16.4V18M2 10h1.6M16.4 10H18M4.3 4.3l1.2 1.2M14.5 14.5l1.2 1.2M4.3 15.7l1.2-1.2M14.5 5.5l1.2-1.2",
  moon: "M16.5 12.2A7 7 0 0 1 7.8 3.5a7 7 0 1 0 8.7 8.7Z",
  wallet: "M3 6.5h12.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15.5v-9Zm0 0V5a1.5 1.5 0 0 1 1.5-1.5h9M13.5 12h.01",
  star: "m10 2.8 2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7L10 2.8Z",
  overview: "M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z",
  markets: "M3 16.5h14M5 13l3-4 3 2.5L15.5 5",
  trade: "M4 7h11l-3-3M16 13H5l3 3",
  portfolio: "M10 3a7 7 0 1 0 7 7h-7V3ZM12.5 2.6A7 7 0 0 1 17.4 7.5H12.5V2.6Z",
  vault: "M3 4h14v12H3zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM10 10h.01M3 16v1.5M17 16v1.5",
  activity: "M2.5 10h3l2.2-5.5 4.6 11 2.2-5.5h3",
  settings: "M10 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM16.2 12.2l.9 1.6-1.7 2.9-1.8-.2a6 6 0 0 1-1.6.9L11.3 19H8.7L8 17.4a6 6 0 0 1-1.6-.9l-1.8.2-1.7-2.9.9-1.6a6 6 0 0 1 0-1.8l-.9-1.6 1.7-2.9 1.8.2A6 6 0 0 1 8 5.1L8.7 3h2.6L12 5.1a6 6 0 0 1 1.6.9l1.8-.2 1.7 2.9-.9 1.6a6 6 0 0 1 0 1.9Z",
  learn: "M2.5 7 10 3.5 17.5 7 10 10.5 2.5 7ZM5.5 8.5v4c0 1.4 2 2.5 4.5 2.5s4.5-1.1 4.5-2.5v-4M17.5 7v5",
  menu: "M3 6h14M3 10h14M3 14h14",
  close: "M5 5l10 10M15 5 5 15",
  chevronDown: "m5 7.5 5 5 5-5",
  chevronRight: "m7.5 5 5 5-5 5",
  arrowUp: "M10 16V4M5 9l5-5 5 5",
  arrowDown: "M10 4v12M5 11l5 5 5-5",
  copy: "M7 7h9v9H7zM4 13V4h9",
  external: "M11 3h6v6M17 3l-8 8M14 12v4.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5H8",
  logout: "M8 17H4.5a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5H8M13 14l4-4-4-4M17 10H8",
  check: "m4 10.5 3.5 3.5L16 5.5",
  alert: "M10 7v4M10 14h.01M8.6 3.4 2.2 15a1.6 1.6 0 0 0 1.4 2.4h12.8a1.6 1.6 0 0 0 1.4-2.4L11.4 3.4a1.6 1.6 0 0 0-2.8 0Z",
  info: "M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM10 9v5M10 6h.01",
  grip: "M7.5 5h.01M12.5 5h.01M7.5 10h.01M12.5 10h.01M7.5 15h.01M12.5 15h.01",
  shield: "M10 2.5 3.5 5v5c0 4 2.8 6.6 6.5 7.5 3.7-.9 6.5-3.5 6.5-7.5V5L10 2.5Z",
  network: "M5 5.5h.01M15 4h.01M10 15h.01M5 5.5 15 4M5 5.5 10 15M15 4l-5 11",
  receipt: "M5 2.5h10v15l-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5v-15ZM8 7h4M8 10.5h4",
  key: "M7 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM10.5 10.5 17 17M14 14l2-2",
  ledger: "M4 3h12v14H4zM7 7h6M7 10h6M7 13h3",
  refresh: "M16 10a6 6 0 1 1-1.8-4.3M16 3.5V6h-2.5",
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  filled?: boolean;
}

export function Icon({ name, size = 18, filled = false, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
