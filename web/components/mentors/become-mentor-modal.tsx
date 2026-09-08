"use client";

import { useEffect, useId, useState } from "react";

import { MentorProfileForm } from "@/components/mentors/mentor-profile-form";

export function BecomeMentorModal() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        className="rounded-lg bg-brand-deep px-4 py-2 text-sm font-medium text-white hover:bg-brand"
        onClick={() => setOpen(true)}
        type="button"
      >
        Become a Mentor
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            aria-label="Close become a mentor form"
            className="absolute inset-0 bg-zinc-950/40"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative z-10 w-full max-w-2xl rounded-2xl border border-ink-soft/15 bg-cream-card p-6 shadow-xl"
            role="dialog"
          >
            <button
              aria-label="Close"
              className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-brand/30"
              onClick={() => setOpen(false)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="pl-10 text-xl font-semibold" id={titleId}>
              Become a mentor
            </h2>
            <p className="mt-2 pl-10 text-sm text-zinc-600">
              Tell mentees about your background, topics, meeting length, and
              capacity.
            </p>
            <MentorProfileForm profile={null} variant="modal" />
          </div>
        </div>
      ) : null}
    </>
  );
}
