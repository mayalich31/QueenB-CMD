"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  CHART_INK,
  ChartCard,
  TOPIC_COLORS,
  tooltipStyle,
} from "./chart-card";

export function TopicsOfferedChart({
  data,
}: {
  data: Array<{ topic: string; label: string; count: number }>;
}) {
  const slices = data.filter((row) => row.count > 0);

  return (
    <ChartCard empty={slices.length === 0} title="Topics offered by mentors">
      <ResponsiveContainer height={280} width="100%">
        <PieChart>
          <Pie
            cx="50%"
            cy="42%"
            data={slices}
            dataKey="count"
            innerRadius={62}
            nameKey="label"
            outerRadius={96}
            paddingAngle={2}
            stroke="#F6F4EF"
            strokeWidth={3}
          >
            {slices.map((entry, index) => (
              <Cell fill={TOPIC_COLORS[index % TOPIC_COLORS.length]} key={entry.topic} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            formatter={(value) => (
              <span style={{ color: CHART_INK, fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
