import { SalesTable } from "@/components/sales/SalesTable";

export const metadata = { title: "Sales History" };

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
        <p className="text-muted-foreground text-sm mt-1">View all completed sales.</p>
      </div>
      <SalesTable />
    </div>
  );
}
