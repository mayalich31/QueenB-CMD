"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MEETING_STATUS_LABELS } from "@/lib/constants/meeting-statuses";
import { MeetingStatus } from "@/lib/generated/prisma/enums";

import {
  CHART_BLUE,
  CHART_GRID,
  CHART_INK,
  CHART_MINT,
  CHART_ORANGE,
  CHART_PURPLE,
  CHART_TEAL,
  CHART_YELLOW,
  ChartCard,
  tooltipStyle,
} from "./chart-card";

const STATUS_FILL: Record<MeetingStatus, string> = {
  [MeetingStatus.WAITING_FOR_MENTOR_TIMES]: CHART_PURPLE,
  [MeetingStatus.WAITING_FOR_MENTEE_SELECTION]: CHART_BLUE,
  [MeetingStatus.SCHEDULED]: CHART_TEAL,
  [MeetingStatus.ATTENDANCE_CONFIRMED]: CHART_MINT,
  [MeetingStatus.COMPLETED]: "#5AA8A3",
  [MeetingStatus.NOT_COMPLETED]: CHART_ORANGE,
  [MeetingStatus.CANCELLED]: CHART_YELLOW,
};

const STACK_ORDER = Object.values(MeetingStatus);

export function MeetingsByWeekdayChart({
  data,
}: {
  data: Array<{ day: string; label: string } & Record<MeetingStatus, number>>;
}) {
  const empty = data.every((row) => STACK_ORDER.every((status) => row[status] === 0));

  return (
    <ChartCard empty={empty} subtitle="Last 7 days" title="Meetings by status">
      <ResponsiveContainer height={280} width="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={CHART_INK} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} stroke={CHART_INK} tick={{ fontSize: 11 }} width={32} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend
            formatter={(value) => (
              <span style={{ color: CHART_INK, fontSize: 12 }}>{value}</span>
            )}
          />
          {STACK_ORDER.map((status, index) => (
            <Bar
              dataKey={status}
              fill={STATUS_FILL[status]}
              key={status}
              name={MEETING_STATUS_LABELS[status]}
              radius={index === STACK_ORDER.length - 1 ? [8, 8, 0, 0] : 0}
              stackId="meetings"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
