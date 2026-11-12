type MarkProps = { className?: string; title?: string };

/** Crown-and-diamond mark (public/brand/logo-mark.svg), inline so it inherits the rose token. */
export function LogoMark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 48 56"
      fill="none"
      stroke="var(--color-rose)"
      strokeWidth={1.6}
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M14 13 L16 5 L20 9 L24 2 L28 9 L32 5 L34 13 Z" />
      <path d="M10 17 H38 L46 27 L24 54 L2 27 Z" />
      <path d="M2 27 H46 M17 17 L13 27 L24 54 L35 27 L31 17 M17 17 L24 27 L31 17" />
    </svg>
  );
}

/** "Lifetime" in Pinyon Script over spaced "LUXURIES". */
export function Wordmark() {
  return (
    <span className="flex flex-col items-center leading-none">
      <b className="font-script text-[28px] font-normal text-rose">Lifetime</b>{" "}
      <span className="mt-0.5 -mr-[0.42em] font-display text-[9.5px] tracking-[0.42em] text-rose">
        LUXURIES
      </span>
    </span>
  );
}
