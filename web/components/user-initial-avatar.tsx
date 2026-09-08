function initialFromName(name: string) {
  const letter = name.trim().charAt(0);
  return letter ? letter.toUpperCase() : "?";
}

export function UserInitialAvatar({ name }: { name: string }) {
  const initial = initialFromName(name);

  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-deep text-sm font-semibold text-white"
      title={name}
    >
      {initial}
    </span>
  );
}
