"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface HeroContractProps {
  address?: string;
}

export function HeroContract({ address = "0x799bddc837a4304c79276ac3069596e7fb091bbd" }: HeroContractProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        tone: "success",
        title: "Contract Address Copied",
        description: "0x799bddc837a4304c79276ac3069596e7fb091bbd",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ tone: "error", title: "Failed to copy address" });
    }
  };

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="mt-7 flex flex-wrap items-center gap-2.5 rounded-[var(--radius-control)] border border-line-strong bg-surface-2/90 px-3.5 py-2.5 shadow-sm backdrop-blur-md max-w-[34rem]">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        <span className="text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
          Official CA
        </span>
      </div>

      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <code className="hidden sm:inline font-mono text-xs font-semibold text-ink tracking-wide truncate select-all">
          {address}
        </code>
        <code className="sm:hidden font-mono text-xs font-semibold text-ink tracking-wide select-all">
          {shortAddress}
        </code>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-secondary btn-sm h-7 px-2.5 text-xs flex items-center gap-1.5 transition-all"
            title="Copy Contract Address"
          >
            <Icon name={copied ? "check" : "copy"} size={13} className={copied ? "text-brand" : ""} />
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <a
            href={`https://robinhoodchain.blockscout.com/token/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm h-7 px-2 text-xs text-ink-2 hover:text-ink"
            title="View on Robinhood Chain Explorer"
          >
            <Icon name="external" size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
