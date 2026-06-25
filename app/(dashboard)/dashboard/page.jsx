"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SparklineCards } from "@/components/dashboard/sparkline-cards";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";

function getGreeting(hours) {
  if (hours < 12) return "Good morning";
  if (hours < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Good morning");
  const [dateStr, setDateStr]   = useState("");

  useEffect(() => {
    const now = new Date();
    setGreeting(getGreeting(now.getHours()));
    setDateStr(format(now, "EEEE, dd MMMM yyyy"));
  }, []);

  return (
    <div className="animate-in fade-in-0 duration-300 max-w-screen-2xl mx-auto space-y-8">

      {/* Page header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>
            {greeting}, Admin
            {dateStr ? ` — ${dateStr}` : ""}
          </p>
        </div>
        <Link
          href="/dashboard/pos"
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shrink-0")}
        >
          <Plus className="size-3.5" />
          New Sale
        </Link>
      </div>

      {/* Stat cards */}
      <StatsCards />

      {/* Sparkline mini-charts */}
      <SparklineCards />

      {/* Revenue + Top Items charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart />
        <TopProductsChart />
      </div>

      {/* Recent sales */}
      <div>
        <h2 className="text-base font-bold mb-4">Recent Transactions</h2>
        <RecentSales />
      </div>

    </div>
  );
}
