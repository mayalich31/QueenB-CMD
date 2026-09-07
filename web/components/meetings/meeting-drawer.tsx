"use client";

import { useRouter } from "next/navigation";

export function MeetingDrawer({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close meeting"
        className="absolute inset-0 bg-zinc-950/40"
        type="button"
        onClick={() => router.back()}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-xl">
        <button
          className="mb-4 self-end text-sm text-zinc-600 hover:underline"
          type="button"
          onClick={() => router.back()}
        >
          Close
        </button>
        {children}
      </aside>
    </div>
  );
}
