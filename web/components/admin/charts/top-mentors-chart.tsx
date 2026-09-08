"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CHART_BLUE,
  CHART_GRID,
  CHART_INK,
  ChartCard,
  tooltipStyle,
} from "./chart-card";

export function TopMentorsChart({
  data,
}: {
  data: Array<{ userId: string; username: string; completedCount: number }>;
}) {
  const router = useRouter();

  return (
    <ChartCard empty={data.length === 0} title="Most active mentors">
      <ResponsiveContainer height={280} width="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 24 }}>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
          <XAxis
            dataKey="username"
            interval={0}
            stroke={CHART_INK}
            tick={{ fontSize: 11 }}
          />
          <YAxis allowDecimals={false} stroke={CHART_INK} tick={{ fontSize: 11 }} width={32} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            cursor="pointer"
            dataKey="completedCount"
            fill={CHART_BLUE}
            name="Completed"
            onClick={(item) => {
              const userId = (item as { payload?: { userId?: string } }).payload
                ?.userId;
              if (userId) {
                router.push(`/admin/users/${userId}`);
              }
            }}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
