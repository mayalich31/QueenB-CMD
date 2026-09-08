import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicSiteHeader } from "@/components/brand-lockup";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function CommunityIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-brand-deep"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-10 w-10 text-brand-deep"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
      />
    </svg>
  );
}

function CalendarGearIcon() {
  return (
    <span className="relative inline-flex h-10 w-10 text-brand-deep">
      <svg
        aria-hidden="true"
        className="h-10 w-10"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-cream-card p-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a7.723 7.723 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    </span>
  );
}

const CARDS = [
  {
    title: "About Us",
    body: "Queens Match is a community-driven mentorship application designed to connect mentors and mentees in the tech community.",
    icon: CommunityIcon,
  },
  {
    title: "Our Goal",
    body: "This project aims to bridge the gap between professionals and aspiring developers, creating a collaborative and inclusive environment.",
    icon: TargetIcon,
  },
  {
    title: "How It Works",
    body: "Users can search for mentors, apply to become mentors, and schedule mentorship sessions.",
    icon: CalendarGearIcon,
  },
] as const;

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col bg-cream text-zinc-950">
      <PublicSiteHeader>
        <nav className="flex items-center gap-3" aria-label="Account">
          <Link
            className="rounded-lg border border-brand/60 bg-cream-card px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-brand/30"
            href="/login"
          >
            Sign In
          </Link>
          <Link
            className="rounded-lg bg-brand-deep px-5 py-2.5 text-sm font-medium text-white hover:bg-brand"
            href="/register"
          >
            Sign Up
          </Link>
        </nav>
      </PublicSiteHeader>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-12 sm:py-16">
        <h1 className="whitespace-nowrap text-center text-[clamp(0.8rem,calc((100vw-2.5rem)/26),3rem)] font-semibold tracking-tight text-zinc-950">
          Empowering women in tech, building future leaders
        </h1>
        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <li key={card.title}>
                <article className="flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border border-brand/30 bg-cream-card p-8 text-center shadow-sm sm:aspect-square sm:min-h-0">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/40">
                    <Icon />
                  </span>
                  <h2 className="mt-6 text-xl font-semibold tracking-tight">
                    {card.title}
                  </h2>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-600 sm:text-base">
                    {card.body}
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
