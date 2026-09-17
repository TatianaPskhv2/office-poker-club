"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

export function GamesByMonthChart({
  data,
}: {
  data: { month: string; games: number }[];
}) {
  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={42}>
          <CartesianGrid vertical={false} stroke="color-mix(in oklch, var(--border) 80%, transparent)" />
          <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "color-mix(in oklch, var(--primary) 10%, transparent)" }} />
          <Bar dataKey="games" name="Игры" fill="var(--primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RatingLineChart({
  data,
  dataKey = "rating",
  name = "Рейтинг",
}: {
  data: Array<Record<string, string | number>>;
  dataKey?: string;
  name?: string;
}) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke="color-mix(in oklch, var(--border) 80%, transparent)" />
          <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey={dataKey} name={name} stroke="var(--gold)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ResultsBarChart({
  data,
}: {
  data: { date: string; result: number }[];
}) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={16}>
          <CartesianGrid vertical={false} stroke="color-mix(in oklch, var(--border) 80%, transparent)" />
          <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="result" name="Результат" fill="var(--primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
