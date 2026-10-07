"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { supportedChains } from "@/lib/wagmi";
import { useToast } from "../ui/Toast";

/** Announces wallet connection and network changes as notifications. */
export function NetworkWatcher() {
  const { chainId, isConnected, address } = useAccount();
  const toast = useToast();
  const prev = useRef<{ chainId?: number; connected: boolean } | null>(null);

  useEffect(() => {
    const last = prev.current;
    prev.current = { chainId, connected: isConnected };
    if (!last) return; // first render after reconnect — stay quiet

    if (!last.connected && isConnected) {
      toast({ tone: "success", title: "Wallet connected", description: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : undefined });
      return;
    }
    if (last.connected && !isConnected) {
      toast({ tone: "info", title: "Wallet disconnected" });
      return;
    }
    if (isConnected && chainId && last.chainId && chainId !== last.chainId) {
      const chain = supportedChains.find((c) => c.id === chainId);
      toast(
        chain
          ? { tone: "info", title: `Network changed to ${chain.name}` }
          : { tone: "error", title: "Unsupported network", description: `Switch to ${supportedChains[0].name} to use MainStocks.` },
      );
    }
  }, [chainId, isConnected, address, toast]);

  return null;
}
