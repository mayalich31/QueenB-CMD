export function ChartCard({
  title,
  subtitle,
  children,
  empty,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-brand/30 bg-cream-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
      {empty ? (
        <p className="mt-8 text-sm text-zinc-600">No data yet</p>
      ) : (
        <div className="mt-4 min-h-[280px]">{children}</div>
      )}
    </div>
  );
}

export const CHART_INK = "#0C1B15";
export const CHART_CARD = "#F6F4EF";
export const CHART_BLUE = "#7CB9FF";
export const CHART_PURPLE = "#D1B3FF";
export const CHART_MINT = "#9EE0C0";
export const CHART_TEAL = "#70C8C3";
export const CHART_YELLOW = "#FEE05B";
export const CHART_ORANGE = "#FFB366";
export const CHART_GRID = "#1D393C22";

export const TOPIC_COLORS = [
  CHART_BLUE,
  CHART_MINT,
  CHART_PURPLE,
  CHART_YELLOW,
  CHART_ORANGE,
  CHART_TEAL,
];

export const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(29, 57, 60, 0.12)",
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(12, 27, 21, 0.08)",
  color: CHART_INK,
};
