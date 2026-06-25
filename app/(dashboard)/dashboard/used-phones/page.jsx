import { UsedPhonesTable } from "@/components/used-phones/UsedPhonesTable";

export const metadata = { title: "Buy Used Phone" };

export default function UsedPhonesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buy Used Phone</h1>
        <p className="text-muted-foreground text-sm mt-1">Record used phone purchases from customers.</p>
      </div>
      <UsedPhonesTable />
    </div>
  );
}
