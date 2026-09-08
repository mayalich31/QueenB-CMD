"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CHART_GRID,
  CHART_INK,
  CHART_ORANGE,
  CHART_PURPLE,
  CHART_TEAL,
  ChartCard,
  tooltipStyle,
} from "./chart-card";

type RequestResponses = {
  counts: { accepted: number; declined: number; expired: number; pending: number };
  percents: { accepted: number; declined: number; expired: number };
};

export function RequestResponseChart({ data }: { data: RequestResponses }) {
  const rows = [
    {
      key: "accepted",
      name: "Accepted",
      count: data.counts.accepted,
      percent: data.percents.accepted,
      fill: CHART_TEAL,
    },
    {
      key: "declined",
      name: "Declined",
      count: data.counts.declined,
      percent: data.percents.declined,
      fill: CHART_PURPLE,
    },
    {
      key: "expired",
      name: "Timed out",
      count: data.counts.expired,
      percent: data.percents.expired,
      fill: CHART_ORANGE,
    },
  ];
  const empty = rows.every((row) => row.count === 0);

  return (
    <ChartCard
      empty={empty}
      subtitle={
        data.counts.pending > 0
          ? `${data.counts.pending} still waiting for a mentor response`
          : "Accepted vs declined or timed out"
      }
      title="Request response rate"
    >
      <p className="mb-2 text-sm text-zinc-600">
        <span className="text-2xl font-semibold text-ink">{data.percents.accepted}%</span>
        {" "}accepted
      </p>
      <ResponsiveContainer height={220} width="100%">
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke={CHART_INK} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} stroke={CHART_INK} tick={{ fontSize: 11 }} width={32} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, _name, item) => {
              const percent = (item?.payload as { percent?: number } | undefined)?.percent;
              return [`${value} (${percent ?? 0}%)`, "Requests"];
            }}
          />
          <Bar dataKey="count" name="Requests" radius={[8, 8, 0, 0]}>
            {rows.map((row) => (
              <Cell fill={row.fill} key={row.key} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
