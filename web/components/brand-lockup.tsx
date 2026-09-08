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
    <Link className="font-semibold tracking-widest text-brand-deep" href={href}>
      {title}
    </Link>
  );
}

export function PublicSiteHeader({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-brand/40 bg-cream-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
        <QueensMatchMark href="/" />
        <div className="flex items-center gap-3">
          {children}
          <QueenBLogo />
        </div>
      </div>
    </header>
  );
}
