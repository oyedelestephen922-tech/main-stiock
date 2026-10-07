"use client";

import { config } from "@/lib/config";
import { LogoMark } from "../brand/Logo";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";

/**
 * $MAIN — the MainStocks token.
 * Everything here is driven by config: until NEXT_PUBLIC_MAIN_TOKEN_ADDRESS is set,
 * the section says plainly that the token has not launched and shows no address.
 */
export function MainToken() {
  const toast = useToast();
  const { address, chainName, explorerUrl, ponsUrl } = config.mainToken;
  const live = Boolean(address);

  const steps = [
    {
      title: "Announced",
      body: "$MAIN is confirmed as the MainStocks token.",
      state: "done" as const,
    },
    {
      title: "Launch on Pons",
      body: "The token goes live on the Pons launchpad.",
      state: live ? ("done" as const) : ("current" as const),
    },
    {
      title: "Official address published",
      body: "The contract address appears on this page first.",
      state: live ? ("done" as const) : ("pending" as const),
    },
  ];

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast({ tone: "success", title: "$MAIN address copied", description: "Check it matches in your wallet before you buy." });
    } catch {
      toast({ tone: "error", title: "Couldn't copy the address" });
    }
  };

  return (
    <section id="main-token" aria-labelledby="main-token-h" className="mx-auto max-w-[1400px] px-4 pt-28 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h2 id="main-token-h" className="type-title text-[clamp(1.35rem,2.4vw,1.8rem)]">
          The MainStocks token
        </h2>
        <p className="mt-2 text-ink-2">
          $MAIN is launching on Pons. Its supply, distribution and role on MainStocks will be published here in full
          before launch — nothing is promised until it&apos;s written down.
        </p>
      </div>

      <div className="panel grid overflow-hidden lg:grid-cols-[1.15fr_1fr]">
        {/* ── the ticket ── */}
        <div className="relative isolate overflow-hidden border-b border-line p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(70%_90%_at_100%_0%,color-mix(in_srgb,var(--brand)_22%,transparent),transparent_70%)]"
          />
          <LogoMark
            size={150}
            animated={false}
            className="pointer-events-none absolute right-6 top-6 -z-10 opacity-[0.08]"
          />

          <div className="flex items-center gap-2 text-sm text-ink-2">
            <LogoMark size={20} />
            <span>MainStocks · Token</span>
          </div>

          <p
            className="mt-6 bg-gradient-to-r from-brand via-electric to-bright bg-clip-text text-[clamp(3rem,8vw,5.5rem)] font-[800] leading-none tracking-[-0.03em] text-transparent"
            style={{ fontStretch: "125%" }}
          >
            $MAIN
          </p>

          <div className="mt-8">
            <p className="mb-2 text-xs font-medium text-ink-3">Official contract address</p>
            {live && address ? (
              <div className="rounded-[var(--radius-control)] border border-line-strong bg-surface-2 p-3">
                <p className="tabular break-all text-sm font-semibold text-ink">{address}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={copy}>
                    <Icon name="copy" size={14} /> Copy address
                  </button>
                  {explorerUrl && (
                    <a
                      className="btn btn-ghost btn-sm"
                      href={`${explorerUrl}/token/${address}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <Icon name="external" size={14} /> View on explorer
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-dashed border-line-strong px-4 py-3.5">
                <span className="status-dot shrink-0 text-electric" data-live="true" />
                <p className="text-sm text-ink-2">
                  <span className="font-semibold text-ink">Not launched yet.</span> The address goes live here first, the
                  moment $MAIN launches on Pons.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8">
            <p className="mb-2 text-xs font-medium text-ink-3">Published here before launch</p>
            <ul className="divide-y divide-line border-y border-line text-sm">
              {["Total supply", "Distribution", "Role on MainStocks", "Contract audit"].map((item) => (
                <li key={item} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-ink">{item}</span>
                  <span className="text-xs text-ink-3">To be published</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── launch track + facts ── */}
        <div className="flex flex-col p-6 sm:p-8">
          <h3 className="text-sm font-semibold text-ink">Launch track</h3>
          <ol className="mt-5 space-y-0">
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[13px] top-8 bottom-0 w-px ${s.state === "done" ? "bg-electric" : "bg-line-strong"}`}
                  />
                )}
                <span
                  className={`relative grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                    s.state === "done"
                      ? "border-electric bg-brand text-on-brand"
                      : s.state === "current"
                        ? "border-electric text-electric shadow-[0_0_0_4px_var(--glow)]"
                        : "border-line-strong text-ink-3"
                  }`}
                >
                  {s.state === "done" ? <Icon name="check" size={13} strokeWidth={2.4} /> : i + 1}
                </span>
                <div className="pt-0.5">
                  <p className={`font-semibold ${s.state === "pending" ? "text-ink-2" : "text-ink"}`}>
                    {s.title}
                    {s.state === "current" && <span className="ml-2 text-xs font-semibold text-electric">Up next</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-2">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-control)] border border-line bg-line text-sm">
            {[
              ["Ticker", "$MAIN"],
              ["Launchpad", "Pons"],
              ["Chain", chainName || "Announced at launch"],
              ["Status", live ? "Live" : "Not launched"],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface px-4 py-3">
                <dt className="text-xs text-ink-3">{k}</dt>
                <dd className="mt-0.5 font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <a
            href={ponsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-electric hover:underline"
          >
            Visit Pons <Icon name="external" size={13} />
          </a>
        </div>
      </div>

      {/* ── safety note ── */}
      <div className="mt-4 flex items-start gap-3 rounded-[var(--radius-control)] border border-down/30 bg-down-bg px-4 py-3.5 text-sm">
        <Icon name="shield" size={17} className="mt-0.5 shrink-0 text-down" />
        <p className="text-ink-2">
          <span className="font-semibold text-ink">One token, one address, one page.</span> Copies of $MAIN will appear
          within minutes of launch. Before you buy, match the contract address character by character with the one shown
          here. If it isn&apos;t on this page, it isn&apos;t $MAIN.
        </p>
      </div>
    </section>
  );
}
