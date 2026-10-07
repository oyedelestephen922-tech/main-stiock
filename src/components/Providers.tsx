"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { ToastProvider } from "./ui/Toast";
import { SearchProvider } from "./search/SearchPalette";
import { NetworkWatcher } from "./wallet/NetworkWatcher";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SearchProvider>
            <NetworkWatcher />
            {children}
          </SearchProvider>
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
