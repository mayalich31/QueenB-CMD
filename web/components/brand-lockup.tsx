import Image from "next/image";
import Link from "next/link";

export function QueenBLogo({ className = "h-11" }: { className?: string }) {
  return (
    <Image
      alt="QueenB"
      className={`queenb-logo w-auto object-contain object-left ${className}`}
      height={96}
      src="/queenb-logo.png"
      width={169}
    />
  );
}

export function QueensMatchMark({
  href,
  title = "QUEENS MATCH",
}: {
  href: string;
  title?: string;
}) {
  return (
    <Link className="font-semibold tracking-widest text-ink" href={href}>
      {title}
    </Link>
  );
}

export function FloatingTopBar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sticky top-3 z-50 mx-3 sm:mx-4">
      <div className="mx-auto max-w-6xl rounded-2xl bg-cream-card px-4 py-3 shadow-lg ring-1 ring-ink-soft/10">
        {children}
      </div>
    </div>
  );
}

export function PublicSiteHeader({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <FloatingTopBar>
      <div className="flex items-center justify-between gap-4">
        <QueensMatchMark href="/" />
        <div className="flex items-center gap-3">
          {children}
          <QueenBLogo />
        </div>
      </div>
    </FloatingTopBar>
  );
}
