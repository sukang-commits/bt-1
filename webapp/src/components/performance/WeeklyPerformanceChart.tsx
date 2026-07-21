"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeeklyPerformanceSummary } from "@/lib/performance/weekly";

export function WeeklyPerformanceChart({ data }: { data: WeeklyPerformanceSummary[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.map((d) => ({ name: d.dayLabel, 수행도: d.rate }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
          <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="수행도" fill="#ca8a04" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
