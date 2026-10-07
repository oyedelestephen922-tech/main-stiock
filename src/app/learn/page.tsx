import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = { title: "Learn" };

const TOPICS = [
  {
    id: "basics",
    title: "What you're looking at",
    body: [
      "MainStocks shows stocks and index funds through a wallet-connected interface. Each asset has a live (or, during development, demo) price, a chart, and a trade panel.",
      "Prices change constantly. The number you see when you start an order can differ from the price when your transaction is executed.",
    ],
  },
  {
    id: "orders",
    title: "How an order works",
    body: [
      "You choose an asset and an amount, then select Review order. The review shows the price, the estimated amount you'll receive, fees and your maximum slippage.",
      "Nothing is sent until you select Confirm trade and approve the transaction in your own wallet. You can cancel at either step.",
    ],
  },
  {
    id: "slippage",
    title: "Slippage, in plain terms",
    body: [
      "Slippage is how far the price is allowed to move against you between review and execution. With 0.5% slippage, a $1,000 buy will not fill if it would cost more than about $1,005 worth of value.",
      "Lower slippage protects you from price swings but means orders fail more often in fast markets.",
    ],
  },
  {
    id: "wallet",
    title: "Keeping your wallet safe",
    body: [
      "MainStocks will never ask for your recovery phrase, seed phrase or private key — not in the app, not by email, not in chat. Anyone who asks is attempting theft.",
      "Always check the network and the contract address your wallet shows before approving a transaction.",
    ],
  },
  {
    id: "risks",
    title: "Risks",
    body: [
      "Investing involves risk, including losing some or all of the money you put in. Smart contracts can contain bugs, networks can be congested, and prices can move quickly.",
      "Only invest what you can afford to lose, and consider independent financial advice for decisions that matter to you.",
    ],
  },
];

export default function LearnPage() {
  return (
    <>
      <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 sm:pt-14">
        <h1 className="type-display max-w-3xl text-[clamp(1.9rem,4.4vw,3.2rem)]">Learn the basics</h1>
        <p className="mt-4 max-w-xl text-ink-2">Short, plain answers to what people ask most before their first trade.</p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {TOPICS.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="block rounded-md px-3 py-2 text-sm text-ink-2 hover:bg-raised hover:text-ink">
                    {t.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="max-w-[68ch] space-y-14">
            {TOPICS.map((t) => (
              <section key={t.id} id={t.id} aria-labelledby={`${t.id}-h`}>
                <h2 id={`${t.id}-h`} className="type-title text-[1.6rem]">
                  {t.title}
                </h2>
                {t.body.map((p) => (
                  <p key={p.slice(0, 24)} className="mt-4 text-[1.02rem] leading-relaxed text-ink-2">
                    {p}
                  </p>
                ))}
              </section>
            ))}
            <div className="flex flex-wrap gap-3 border-t border-line pt-8">
              <Link href="/markets" className="btn btn-primary">
                EXPLORE MARKETS
              </Link>
              <Link href="/dashboard" className="btn btn-secondary">
                OPEN DASHBOARD
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
