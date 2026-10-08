import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { erc20Abi, formatUnits, maxUint256 } from "viem";
import { config } from "@/lib/config";
import { ASSETS, getAsset } from "@/lib/assets";
import { formatNumber, formatUsd } from "@/lib/format";
import { supportedChains } from "@/lib/wagmi";
import { useQuote, isDemoProvider } from "@/hooks/useMarket";
import { preferencesStore } from "@/services/stores";
import { buildTradeCall, tradingStatus } from "@/contracts/tradeRouter";
import { getTokenAddress } from "@/contracts/deployed";
import { Modal } from "../ui/Modal";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";
import { Change, DemoBadge } from "../ui/Market";
import { WalletButton } from "../wallet/WalletButton";

type Side = "buy" | "sell";
const SLIPPAGE = [10, 50, 100];

export function TradePanel({ ticker: fixedTicker, onTickerChange }: { ticker?: string; onTickerChange?: (t: string) => void }) {
  const [side, setSide] = useState<Side>("buy");
  const [selected, setTicker] = useState("NVDA");
  const ticker = fixedTicker ?? selected;
  const [amount, setAmount] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const prefs = preferencesStore.useValue();
  const quote = useQuote(ticker);
  const { address, isConnected, chainId } = useAccount();
  const onSupportedChain = supportedChains.some((c) => c.id === chainId);
  const balance = useBalance({ address, query: { enabled: isConnected && onSupportedChain } });
  const status = tradingStatus(ticker);

  const value = Number(amount);
  const valid = amount !== "" && Number.isFinite(value) && value > 0;
  const price = quote.data?.price ?? null;
  const slip = prefs.slippageBps / 10_000;

  const preview = useMemo(() => {
    if (!valid || price == null) return null;
    if (side === "buy") {
      const shares = value / price;
      return { pay: value, payLabel: formatUsd(value), receive: shares, receiveLabel: `${formatNumber(shares, 6)} ${ticker}`, min: `${formatNumber(shares * (1 - slip), 6)} ${ticker}` };
    }
    const usd = value * price;
    return { pay: value, payLabel: `${formatNumber(value, 6)} ${ticker}`, receive: usd, receiveLabel: formatUsd(usd), min: formatUsd(usd * (1 - slip)) };
  }, [valid, price, side, value, ticker, slip]);

  const balanceLabel = !isConnected
    ? "Connect a wallet to see your balance"
    : !onSupportedChain
      ? "Switch to a supported network"
      : balance.data
        ? `${formatNumber(Number(formatUnits(balance.data.value, balance.data.decimals)), 4)} ${balance.data.symbol}`
        : "Loading…";

  return (
    <section aria-label="Trade" className="panel p-4 sm:p-5">
      <div role="tablist" aria-label="Order side" className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-surface-2 p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={side === s}
            onClick={() => setSide(s)}
            className={`h-10 rounded-md text-sm font-bold tracking-[0.08em] transition-colors ${
              side === s
                ? s === "buy"
                  ? "bg-brand text-on-brand shadow-[0_6px_20px_-10px_var(--glow)]"
                  : "bg-down text-white"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            {s === "buy" ? "BUY" : "SELL"}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="trade-asset" className="mb-1.5 block text-xs font-medium text-ink-2">
            Asset
          </label>
          {fixedTicker ? (
            <div className="field flex items-center justify-between">
              <span className="font-semibold">{ticker}</span>
              <span className="text-sm text-ink-2">{getAsset(ticker)?.name}</span>
            </div>
          ) : (
            <div className="relative">
              <select
                id="trade-asset"
                className="field appearance-none pr-9 font-semibold"
                value={ticker}
                onChange={(e) => {
                  setTicker(e.target.value);
                  onTickerChange?.(e.target.value);
                }}
              >
                {ASSETS.map((a) => (
                  <option key={a.ticker} value={a.ticker}>
                    {a.ticker} — {a.name}
                  </option>
                ))}
              </select>
              <Icon name="chevronDown" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="trade-amount" className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-2">
            <span>{side === "buy" ? "Amount (USD)" : `Amount (${ticker} shares)`}</span>
          </label>
          <div className="relative">
            <input
              id="trade-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              className="field type-figure h-14 pr-16 text-xl"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(",", ".");
                if (/^\d*\.?\d{0,6}$/.test(v)) setAmount(v);
              }}
              aria-invalid={amount !== "" && !valid}
              aria-describedby="trade-amount-hint"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-3">
              {side === "buy" ? "USD" : ticker}
            </span>
          </div>
          <p id="trade-amount-hint" className="mt-1.5 text-xs text-ink-3">
            Wallet balance: {balanceLabel}
          </p>
        </div>

        <dl className="space-y-2.5 rounded-[var(--radius-control)] border border-line bg-surface-2 p-3.5 text-sm">
          <Row label="Price">
            <span className="flex items-center gap-2">
              {isDemoProvider && <DemoBadge />}
              <span className="type-figure text-ink">{formatUsd(price)}</span>
            </span>
          </Row>
          <Row label="24h">
            <Change percent={quote.data?.changePercent} />
          </Row>
          <Row label={side === "buy" ? "Estimated shares" : "Estimated value"}>
            <span className="type-figure text-ink">{preview?.receiveLabel ?? "—"}</span>
          </Row>
          <Row label="Fees">
            <span className="text-ink-2">{status.available ? "Shown in order review" : "—"}</span>
          </Row>
          <Row label="Max slippage">
            <span className="flex gap-1" role="radiogroup" aria-label="Maximum slippage">
              {SLIPPAGE.map((bps) => (
                <button
                  key={bps}
                  role="radio"
                  aria-checked={prefs.slippageBps === bps}
                  onClick={() => preferencesStore.set((p) => ({ ...p, slippageBps: bps }))}
                  className={`h-7 rounded-md px-2 text-xs font-semibold tabular ${
                    prefs.slippageBps === bps ? "bg-raised text-electric ring-1 ring-electric/50" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  {(bps / 100).toFixed(1)}%
                </button>
              ))}
            </span>
          </Row>
          <Row label="Minimum received">
            <span className="type-figure text-ink">{preview?.min ?? "—"}</span>
          </Row>
        </dl>

        <button className="btn btn-primary w-full" disabled={!valid || price == null} onClick={() => setReviewing(true)}>
          REVIEW ORDER
        </button>

        {!status.available && (
          <p className="flex items-start gap-2 text-xs text-ink-2">
            <Icon name="info" size={14} className="mt-0.5 shrink-0 text-electric" />
            {status.reason}
          </p>
        )}
      </div>

      <ReviewModal
        open={reviewing}
        onClose={() => setReviewing(false)}
        side={side}
        ticker={ticker}
        price={price}
        preview={preview}
        slippageBps={prefs.slippageBps}
        connected={isConnected && onSupportedChain}
        userAddress={address}
      />
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-3">
      <dt className="text-ink-2">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

interface ReviewProps {
  open: boolean;
  onClose: () => void;
  side: Side;
  ticker: string;
  price: number | null;
  preview: { pay: number; payLabel: string; receive: number; receiveLabel: string; min: string } | null;
  slippageBps: number;
  connected: boolean;
  userAddress?: `0x${string}`;
}

function ReviewModal({ open, onClose, side, ticker, price, preview, slippageBps, connected, userAddress }: ReviewProps) {
  const toast = useToast();
  const status = tradingStatus(ticker);
  const routerAddress = config.contracts.tradeRouter;
  const tokenInAddress = side === "buy" ? config.contracts.usdc : getTokenAddress(ticker);
  const tokenInSymbol = side === "buy" ? "USD" : ticker;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenInAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: userAddress && routerAddress ? [userAddress, routerAddress] : undefined,
    query: { enabled: !!userAddress && !!routerAddress && !!tokenInAddress },
  });

  const amountInRequired = useMemo(() => {
    if (!preview) return 0n;
    if (side === "buy") {
      return BigInt(Math.max(1, Math.floor(preview.pay * 1e6)));
    } else {
      return BigInt(Math.max(1, Math.floor(preview.pay * 1e18)));
    }
  }, [preview, side]);

  const needsApproval = allowance !== undefined && (allowance as bigint) < amountInRequired;

  const [isApproving, setIsApproving] = useState(false);
  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({ hash: approveHash });

  useEffect(() => {
    if (approveReceipt.isSuccess) {
      setIsApproving(false);
      refetchAllowance();
      toast({ tone: "success", title: "Approved", description: `${tokenInSymbol} approved for trading.` });
    }
    if (approveReceipt.isError || approveError) {
      setIsApproving(false);
      toast({ tone: "error", title: "Approval failed", description: "Approval transaction was rejected or failed." });
    }
  }, [approveReceipt.isSuccess, approveReceipt.isError, approveError, refetchAllowance, tokenInSymbol, toast]);

  const approve = () => {
    if (!tokenInAddress || !routerAddress) return;
    setIsApproving(true);
    writeApprove({
      address: tokenInAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [routerAddress, maxUint256],
    });
  };

  const { writeContract, data: hash, isPending, reset, error: writeError } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const phase: "review" | "signing" | "pending" | "success" | "failed" = writeError
    ? "failed"
    : isPending
      ? "signing"
      : hash && receipt.isLoading
        ? "pending"
        : receipt.isSuccess
          ? receipt.data?.status === "success"
            ? "success"
            : "failed"
          : receipt.isError
            ? "failed"
            : "review";

  useEffect(() => {
    if (phase === "success") toast({ tone: "success", title: "Trade confirmed", description: `${side === "buy" ? "Bought" : "Sold"} ${ticker}` });
    if (phase === "failed")
      toast({
        tone: "error",
        title: "Trade failed",
        description: /rejected|denied/i.test(writeError?.message ?? "") ? "You rejected the transaction in your wallet." : "Nothing was executed. Check your wallet and try again.",
      });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    reset();
    onClose();
  };

  const confirm = () => {
    if (!preview || !status.available) return;
    const call = buildTradeCall({
      side,
      ticker,
      amountUsd: side === "buy" ? preview.pay : preview.receive,
      minReceive: preview.receive * (1 - slippageBps / 10_000),
      shares: side === "sell" ? preview.pay : preview.receive,
      recipient: userAddress,
    });
    if (!call) {
      toast({ tone: "error", title: "Trading isn't wired up yet", description: "No contract call is defined for this order." });
      return;
    }
    writeContract(call);
  };

  return (
    <Modal open={open} onClose={close} title={phase === "review" ? "Review order" : "Order status"}>
      {phase === "review" && (
        <>
          <dl className="divide-y divide-line rounded-[var(--radius-control)] border border-line text-sm">
            {[
              ["Side", <span key="s" className={side === "buy" ? "font-bold text-electric" : "font-bold text-down"}>{side.toUpperCase()}</span>],
              ["Asset", `${ticker} · ${getAsset(ticker)?.name ?? ""}`],
              ["Price", formatUsd(price)],
              [side === "buy" ? "You pay" : "You sell", preview?.payLabel ?? "—"],
              ["Estimated receive", preview?.receiveLabel ?? "—"],
              ["Max slippage", `${(slippageBps / 100).toFixed(1)}%`],
              ["Minimum received", preview?.min ?? "—"],
              ["Fees", status.available ? "Set by the trading contract" : "—"],
              ["Network fee", "Estimated by your wallet"],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="text-ink-2">{k}</dt>
                <dd className="type-figure text-right text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          {isDemoProvider && (
            <p className="mt-4 flex items-start gap-2 text-xs text-ink-2">
              <Icon name="info" size={14} className="mt-0.5 shrink-0 text-note" />
              This price is demo data. A live order would use the contract&apos;s price at execution.
            </p>
          )}

          <div className="mt-5 space-y-3">
            {!status.available ? (
              <>
                <button className="btn btn-primary w-full" disabled aria-describedby="confirm-reason">
                  CONFIRM TRADE
                </button>
                <p id="confirm-reason" className="text-center text-xs text-ink-2">
                  {status.reason}
                </p>
              </>
            ) : !connected ? (
              <WalletButton block />
            ) : needsApproval ? (
              <button
                className="btn btn-primary w-full"
                disabled={isApproving || isApprovePending || Boolean(approveHash && approveReceipt.isLoading)}
                onClick={approve}
              >
                {isApproving || isApprovePending || Boolean(approveHash && approveReceipt.isLoading)
                  ? `APPROVING ${tokenInSymbol}…`
                  : `APPROVE ${tokenInSymbol} TO TRADE`}
              </button>
            ) : (
              <button className="btn btn-primary w-full" onClick={confirm}>
                CONFIRM TRADE
              </button>
            )}
            <button className="btn btn-ghost w-full" onClick={close}>
              Cancel
            </button>
          </div>
        </>
      )}

      {phase !== "review" && (
        <TxStatus phase={phase} hash={hash} onClose={close} onRetry={reset} />
      )}
    </Modal>
  );
}

function TxStatus({
  phase,
  hash,
  onClose,
  onRetry,
}: {
  phase: "signing" | "pending" | "success" | "failed";
  hash?: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  const copy = {
    signing: { icon: "wallet", title: "Confirm in your wallet", body: "Approve the transaction in your wallet to continue." },
    pending: { icon: "refresh", title: "Transaction pending", body: "Waiting for the network to confirm your trade." },
    success: { icon: "check", title: "Trade confirmed", body: "Your order was executed on-chain." },
    failed: { icon: "alert", title: "Transaction failed", body: "Nothing was executed. You can review the order and try again." },
  }[phase];

  return (
    <div className="flex flex-col items-center py-4 text-center" role="status" aria-live="polite">
      <span
        className={`grid size-14 place-items-center rounded-full border ${
          phase === "failed" ? "border-down/50 text-down" : "border-line-strong text-electric"
        }`}
      >
        <Icon name={copy.icon as "wallet"} size={24} className={phase === "pending" ? "animate-spin" : ""} />
      </span>
      <p className="mt-4 text-lg font-semibold">{copy.title}</p>
      <p className="mt-1 text-sm text-ink-2">{copy.body}</p>
      {hash && <p className="mt-3 break-all text-xs text-ink-3 tabular">{hash}</p>}
      <div className="mt-6 flex w-full gap-2">
        {phase === "failed" && (
          <button className="btn btn-secondary flex-1" onClick={onRetry}>
            Back to review
          </button>
        )}
        {(phase === "success" || phase === "failed") && (
          <button className="btn btn-primary flex-1" onClick={onClose}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}
