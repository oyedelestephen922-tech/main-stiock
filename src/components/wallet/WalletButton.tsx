"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAccount, useBalance, useConnect, useConnectors, useDisconnect, useSwitchChain } from "wagmi";
import { formatUnits } from "viem";
import { primaryChain, supportedChains } from "@/lib/wagmi";
import { formatNumber, shortAddress } from "@/lib/format";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";

const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

export function WalletButton({ block = false }: { block?: boolean }) {
  const mounted = useMounted();
  const { address, isConnected, chainId, status } = useAccount();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!mounted || status === "reconnecting") {
    return (
      <button className={`btn btn-primary btn-sm ${block ? "w-full" : ""}`} disabled aria-busy="true">
        <Icon name="wallet" size={16} />
        CONNECT WALLET
      </button>
    );
  }

  if (isConnected && address) {
    return <AccountMenu address={address} chainId={chainId} block={block} />;
  }

  return (
    <>
      <button className={`btn btn-primary btn-sm ${block ? "w-full" : ""}`} onClick={() => setPickerOpen(true)}>
        <Icon name="wallet" size={16} />
        CONNECT WALLET
      </button>
      <WalletPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}

function WalletPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const connectors = useConnectors();
  const { connect, isPending, variables } = useConnect();
  const toast = useToast();

  // Show EIP-6963 wallets by name; hide the generic "Injected" entry when named ones exist.
  const named = connectors.filter((c) => c.id !== "injected");
  const list = named.length > 0 ? named : connectors;
  const pendingId = isPending && variables?.connector && "id" in variables.connector ? variables.connector.id : null;

  return (
    <Modal open={open} onClose={onClose} title="Connect a wallet">
      <p className="mb-4 text-sm text-ink-2">
        Choose the wallet you already use. MainStocks only reads your address and asks your wallet to approve each
        transaction.
      </p>

      {list.length === 0 ? (
        <div className="rounded-[var(--radius-control)] border border-line p-4 text-sm text-ink-2">
          No wallet found in this browser. Install a browser wallet such as MetaMask or Rabby, then reload this page.
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.uid}>
              <button
                className="panel-interactive flex w-full items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface-2 px-4 py-3 text-left disabled:opacity-60"
                disabled={isPending}
                onClick={() =>
                  connect(
                    { connector: c, chainId: primaryChain.id },
                    {
                      onSuccess: onClose,
                      onError: (e) =>
                        toast({
                          tone: "error",
                          title: e.name === "UserRejectedRequestError" ? "Connection cancelled" : "Couldn't connect wallet",
                          description:
                            e.name === "UserRejectedRequestError"
                              ? "You declined the request in your wallet."
                              : "Unlock your wallet and try again.",
                        }),
                    },
                  )
                }
              >
                {c.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.icon} alt="" className="size-7 rounded-md" />
                ) : (
                  <span className="grid size-7 place-items-center rounded-md bg-raised text-electric">
                    <Icon name="wallet" size={16} />
                  </span>
                )}
                <span className="flex-1 font-semibold text-ink">{c.id === "walletConnect" ? "WalletConnect (mobile)" : c.name}</span>
                {pendingId === c.id ? (
                  <span className="text-xs text-ink-2">Check your wallet…</span>
                ) : (
                  <Icon name="chevronRight" size={16} className="text-ink-3" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs text-ink-2">
        <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-electric" />
        MainStocks will never ask for your recovery phrase, seed phrase or private key. Anyone who does is not us.
      </p>
    </Modal>
  );
}

function AccountMenu({ address, chainId, block }: { address: `0x${string}`; chainId?: number; block: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const toast = useToast();
  const chain = supportedChains.find((c) => c.id === chainId);
  const wrongNetwork = !chain;
  const balance = useBalance({ address, query: { enabled: !wrongNetwork, refetchInterval: 30_000 } });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const explorer = chain?.blockExplorers?.default.url;
  const bal =
    balance.data != null ? `${formatNumber(Number(formatUnits(balance.data.value, balance.data.decimals)), 4)} ${balance.data.symbol}` : "—";

  return (
    <div ref={ref} className={`relative ${block ? "w-full" : ""}`}>
      <button
        className={`btn btn-secondary btn-sm ${block ? "w-full" : ""} ${wrongNetwork ? "!border-down/60" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`status-dot ${wrongNetwork ? "text-down" : "text-bright"}`} />
        <span className="tabular">{shortAddress(address)}</span>
        <Icon name="chevronDown" size={14} className="text-ink-3" />
      </button>

      {open && (
        <div
          className={`panel glass rise-in absolute z-50 mt-2 w-72 p-2 ${block ? "left-0" : "right-0"}`}
          role="menu"
        >
          <dl className="space-y-3 px-3 py-3 text-sm">
            <div>
              <dt className="text-xs text-ink-3">Address</dt>
              <dd className="mt-0.5 flex items-center justify-between gap-2">
                <span className="tabular font-semibold text-ink">{shortAddress(address)}</span>
                <button
                  className="btn-ghost rounded p-1.5"
                  aria-label="Copy address"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(address);
                      toast({ tone: "success", title: "Address copied" });
                    } catch {
                      toast({ tone: "error", title: "Couldn't copy address" });
                    }
                  }}
                >
                  <Icon name="copy" size={14} />
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">Network</dt>
              <dd className={`mt-0.5 font-semibold ${wrongNetwork ? "text-down" : "text-ink"}`}>
                {chain?.name ?? "Unsupported network"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">Balance</dt>
              <dd className="type-figure mt-0.5 text-ink">{wrongNetwork ? "—" : balance.isLoading ? "Loading…" : bal}</dd>
            </div>
          </dl>

          {wrongNetwork && (
            <button
              className="btn btn-primary btn-sm mb-1 w-full"
              disabled={switching}
              onClick={() =>
                switchChain(
                  { chainId: primaryChain.id },
                  { onError: () => toast({ tone: "error", title: "Network switch cancelled" }) },
                )
              }
            >
              {switching ? "Switching…" : `Switch to ${primaryChain.name}`}
            </button>
          )}

          <div className="border-t border-line pt-1">
            {explorer && (
              <a
                role="menuitem"
                href={`${explorer}/address/${address}`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex min-h-10 items-center gap-2 rounded-md px-3 text-sm text-ink-2 hover:bg-raised hover:text-ink"
              >
                <Icon name="external" size={15} /> View on explorer
              </a>
            )}
            <button
              role="menuitem"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-sm text-ink-2 hover:bg-raised hover:text-ink"
            >
              <Icon name="logout" size={15} /> Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
