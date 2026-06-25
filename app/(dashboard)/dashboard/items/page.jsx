import { ItemsTable } from "@/components/items/ItemsTable";

export const metadata = { title: "Items" };

export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Items</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your inventory items.</p>
      </div>
      <ItemsTable />
    </div>
  );
}
