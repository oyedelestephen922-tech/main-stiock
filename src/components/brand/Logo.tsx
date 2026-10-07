import { useId } from "react";

/**
 * The MainStocks mark: an "M" drawn as a single market line.
 * The left leg rises, dips into a valley, then climbs to a higher peak —
 * a price path that reads as a letter. A faint link joins the two peaks,
 * so the three nodes form a small connected network.
 */
export const MARK_PATH = "M5 27 L5 10.5 L14 20 L25.5 5.5 L25.5 27";

interface MarkProps {
  size?: number;
  animated?: boolean;
  className?: string;
  title?: string;
}

export function LogoMark({ size = 28, animated = true, className = "", title }: MarkProps) {
  const id = useId().replace(/:/g, "");
  const grad = `ms-g-${id}`;
  const sweep = `ms-s-${id}`;
  const mask = `ms-m-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={`${animated ? "ms-logo" : ""} ${className}`}
    >
      <defs>
        <linearGradient id={grad} x1="4" y1="28" x2="27" y2="4" gradientUnits="userSpaceOnUse">
          <stop className="ms-gradient-a" offset="0" stopColor="var(--brand)" />
          <stop offset="0.55" stopColor="var(--electric)" />
          <stop offset="1" stopColor="var(--soft)" />
        </linearGradient>
        <linearGradient id={sweep} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
          <path d={MARK_PATH} stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>

      <g className="ms-mark">
        {/* network link between the two peaks */}
        <path d="M5 10.5 L25.5 5.5" stroke="var(--electric)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="1.5 2" />
        <path
          d={MARK_PATH}
          stroke={`url(#${grad})`}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {animated && (
          <g mask={`url(#${mask})`}>
            <rect className="ms-sweep" x="0" y="0" width="14" height="32" fill={`url(#${sweep})`} opacity="0.75" />
          </g>
        )}
        <circle className="ms-node" cx="5" cy="10.5" r="2.1" fill="var(--electric)" />
        <circle className="ms-node" cx="14" cy="20" r="1.6" fill="var(--bright)" />
        <circle className="ms-node" cx="25.5" cy="5.5" r="2.5" fill="var(--soft)" />
      </g>
    </svg>
  );
}

interface LogoProps {
  compact?: boolean;
  className?: string;
}

export function Logo({ compact = false, className = "" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={compact ? 24 : 28} />
      <span
        className="text-[0.95rem] font-[760] tracking-[0.06em] text-ink"
        style={{ fontStretch: "125%" }}
      >
        MAIN<span className="text-electric">STOCKS</span>
      </span>
    </span>
  );
}
