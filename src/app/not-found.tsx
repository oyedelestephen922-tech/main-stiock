import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="type-display text-[clamp(4rem,14vw,8rem)] text-electric">404</p>
      <h1 className="type-title mt-2 text-2xl">This page isn&apos;t on the market</h1>
      <p className="mt-3 text-ink-2">The link may be old, or the asset may not be listed on MainStocks.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/markets" className="btn btn-primary">
          EXPLORE MARKETS
        </Link>
        <Link href="/" className="btn btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
