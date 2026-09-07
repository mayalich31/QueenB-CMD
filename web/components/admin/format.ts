export function formatUtcDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function formatUtcDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
