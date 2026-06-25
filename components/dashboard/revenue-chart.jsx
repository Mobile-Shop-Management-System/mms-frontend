"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/useDashboard";

function fmtMoney(n) {
  return "PKR " + Number(n ?? 0).toLocaleString("en-PK");
}

function addMovingAvg(data) {
  return data.map((d, i) => {
    if (i < 2) return { ...d, average: null };
    const slice = data.slice(Math.max(0, i - 2), i + 1);
    const avg = slice.reduce((s, x) => s + x.revenue, 0) / slice.length;
    return { ...d, average: Math.round(avg) };
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card shadow-lg p-3 text-xs space-y-1 min-w-32">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span className="text-muted-foreground">{p.dataKey === "revenue" ? "Revenue" : "3D Avg"}</span>
          <span className="font-semibold">{fmtMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart() {
  const { data, isLoading } = useDashboard();
  const raw   = data?.daily_revenue ?? [];
  const chart = addMovingAvg(raw);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue — Last 7 Days</CardTitle>
        <CardDescription>Daily sales revenue with 3-day moving average</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(v) => v === 0 ? "0" : `${Math.round(v / 1000)}k`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                  opacity={0.85}
                />
                <Line
                  dataKey="average"
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 2"
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
