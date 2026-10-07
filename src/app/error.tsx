"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="type-title text-2xl">Something went wrong on this page</h1>
      <p className="mt-3 text-ink-2">Your wallet and funds are not affected. Reload the page to try again.</p>
      <button className="btn btn-primary mt-8" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
