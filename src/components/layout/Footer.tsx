import Link from "next/link";
import { Logo } from "../brand/Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/markets", label: "Markets" },
      { href: "/dashboard/trade", label: "Trade" },
      { href: "/dashboard/portfolio", label: "Portfolio" },
      { href: "/dashboard/vaults", label: "Vaults" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/#main-token", label: "$MAIN token" },
      { href: "/learn", label: "Learn" },
      { href: "/learn#risks", label: "Risks" },
      { href: "/#transparency", label: "Transparency" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm text-ink-2">The on-chain stock market, reimagined.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold text-ink">{col.title}</h2>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-2 hover:text-electric">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1400px] px-4 py-6 text-xs leading-relaxed text-ink-3 sm:px-6">
          Investing involves risk, including the possible loss of the money you invest. Prices shown may be delayed or,
          during development, generated as demo data. Nothing on MainStocks is investment, legal or tax advice. ©{" "}
          {new Date().getFullYear()} MainStocks.
        </p>
      </div>
    </footer>
  );
}
