"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CHART_BLUE,
  CHART_GRID,
  CHART_INK,
  CHART_PURPLE,
  ChartCard,
  tooltipStyle,
} from "./chart-card";

export function UserGrowthChart({
  data,
}: {
  data: Array<{ day: string; label: string; mentors: number; mentees: number }>;
}) {
  const empty = data.every((row) => row.mentors === 0 && row.mentees === 0);

  return (
    <ChartCard empty={empty} subtitle="Last 7 days" title="User growth">
      <ResponsiveContainer height={280} width="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={CHART_INK} tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} stroke={CHART_INK} tick={{ fontSize: 11 }} width={32} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Line
            activeDot={{ r: 5 }}
            dataKey="mentees"
            dot={{ r: 3 }}
            name="Mentees"
            stroke={CHART_BLUE}
            strokeWidth={2.5}
            type="monotone"
          />
          <Line
            activeDot={{ r: 5 }}
            dataKey="mentors"
            dot={{ r: 3 }}
            name="Mentors"
            stroke={CHART_PURPLE}
            strokeWidth={2.5}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
