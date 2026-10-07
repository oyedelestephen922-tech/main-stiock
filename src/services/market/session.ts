import type { MarketSession } from "./types";

/**
 * US equity session from the clock, in New York time.
 * Does not know about exchange holidays — a live provider should
 * supply its own session value, which takes priority.
 */
export function usSession(now = new Date()): MarketSession {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const day = get("weekday");
    if (day === "Sat" || day === "Sun") return "closed";
    const minutes = (Number(get("hour")) % 24) * 60 + Number(get("minute"));
    if (minutes >= 570 && minutes < 960) return "open";
    if (minutes >= 240 && minutes < 570) return "pre";
    if (minutes >= 960 && minutes < 1200) return "post";
    return "closed";
  } catch {
    return "unknown";
  }
}

export const SESSION_LABEL: Record<MarketSession, string> = {
  open: "Market open",
  pre: "Pre-market",
  post: "After hours",
  closed: "Market closed",
  unknown: "Session unknown",
};
