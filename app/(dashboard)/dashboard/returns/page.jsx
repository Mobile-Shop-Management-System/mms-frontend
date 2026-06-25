import { ReturnsTable } from "@/components/returns/ReturnsTable";

export const metadata = {
  title: "Returns",
};

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Returns</h1>
        <p className="text-sm text-muted-foreground mt-1">Process refunds and restore inventory stock.</p>
      </div>
      <ReturnsTable />
    </div>
  );
}
