import { SuppliersTable } from "@/components/suppliers/SuppliersTable";

export const metadata = { title: "Suppliers" };

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your suppliers.</p>
      </div>
      <SuppliersTable />
    </div>
  );
}
