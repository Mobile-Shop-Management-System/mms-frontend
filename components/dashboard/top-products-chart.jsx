"use client";

import {
  BarChart,
  Bar,
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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <div className="rounded-xl border bg-card shadow-lg p-3 text-xs space-y-1 min-w-36">
      <p className="font-semibold text-foreground truncate max-w-40">{label}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Units Sold</span>
        <span className="font-semibold">{item?.total_sold ?? 0}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Revenue</span>
        <span className="font-semibold">{fmtMoney(item?.total_revenue)}</span>
      </div>
    </div>
  );
}

function truncate(str, n = 18) {
  return str && str.length > n ? str.slice(0, n) + "…" : str;
}

export function TopProductsChart() {
  const { data, isLoading } = useDashboard();

  const items = (data?.top_items ?? []).map((t) => ({
    ...t,
    name: truncate(t.item_name ?? "Unknown"),
  }));

  const maxSold = Math.max(...items.map((t) => t.total_sold), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Items</CardTitle>
        <CardDescription>By units sold (all time)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : items.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            No sales data yet.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={items}
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis
                  type="number"
                  domain={[0, maxSold + 1]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="total_sold"
                  fill="var(--color-primary)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
