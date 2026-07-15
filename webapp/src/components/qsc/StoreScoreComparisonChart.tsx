"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StoreTotalScoreRow } from "@/lib/qsc/queries";

export function StoreScoreComparisonChart({ rows }: { rows: StoreTotalScoreRow[] }) {
  const data = rows.map((r) => ({
    name: r.storeName,
    QSC: r.qscTotal ?? 0,
    월달성률: r.monthlyAchievementRate ?? 0,
    총합점수: r.totalScore ?? 0,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={11} interval={0} angle={-30} textAnchor="end" height={60} />
          <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
          <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="QSC" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          <Bar dataKey="월달성률" fill="#fbbf24" radius={[4, 4, 0, 0]} />
          <Bar dataKey="총합점수" fill="#ca8a04" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
