const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export const DASH = "—";

export function formatUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return `$${DASH}`;
  return usd.format(value);
}

export function formatSignedUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return `+$${DASH}`;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${usd.format(Math.abs(value))}`;
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return `${DASH}%`;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

export function formatCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return compact.format(value);
}

export function formatNumber(value: number | null | undefined, digits = 4): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

export function shortAddress(address?: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function direction(value: number | null | undefined): "up" | "down" | "flat" {
  if (value == null || !Number.isFinite(value) || value === 0) return "flat";
  return value > 0 ? "up" : "down";
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning.";
  if (h < 18) return "Good afternoon.";
  return "Good evening.";
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
