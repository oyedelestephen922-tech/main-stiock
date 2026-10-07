"use client";

import { useTheme } from "@/hooks/useTheme";
import { Icon } from "../ui/Icon";

/** Two-position switch: the thumb slides between moon and sun. */
export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!dark}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
      className="group inline-flex min-h-10 items-center gap-2.5 rounded-[var(--radius-control)] px-1.5 text-ink-2 hover:text-ink"
    >
      <span className="relative flex h-7 w-[52px] items-center rounded-full border border-line-strong bg-surface-2">
        <span
          className={`absolute top-[3px] size-5 rounded-full bg-brand shadow-[0_0_10px_var(--glow)] transition-transform duration-200 ${
            dark ? "translate-x-[3px]" : "translate-x-[27px]"
          }`}
        />
        <Icon name="moon" size={12} className={`relative z-10 ml-[7px] ${dark ? "text-on-brand" : "text-ink-3"}`} />
        <Icon name="sun" size={12} className={`relative z-10 ml-auto mr-[7px] ${dark ? "text-ink-3" : "text-on-brand"}`} />
      </span>
      {withLabel && <span className="text-sm font-medium">{dark ? "Dark" : "Light"}</span>}
    </button>
  );
}
