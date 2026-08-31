"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function DailyBookingsChart({ data }: { data: { date: string; count: number }[] }) {
  const chartData = data.map((d) => ({
    label: new Date(d.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
    count: d.count,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} interval={1} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "#eef2ff" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}