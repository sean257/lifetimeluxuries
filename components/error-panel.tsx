"use client";
import Link from "next/link";
import { useEffect } from "react";

export function ErrorPanel({
  error,
  reset,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="mx-auto grid max-w-[460px] gap-4 border border-line bg-surface px-7 py-9 text-center">
      <div className="eyebrow">Something went wrong</div>
      <h1 className="text-3xl">This page didn&apos;t load</h1>
      <p className="text-sm text-muted">
        It may be a connection problem. Try again, and if it keeps happening, wait a minute and reload.
      </p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button type="button" className="btn btn-solid" onClick={reset}>
          Try again
        </button>
        <Link href={homeHref} className="btn btn-ghost">
          {homeLabel}
        </Link>
      </div>
      {error.digest ? <p className="num text-[11px] text-muted">Reference: {error.digest}</p> : null}
    </div>
  );
}
