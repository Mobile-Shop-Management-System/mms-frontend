import { BrandsTable } from "@/components/brands/BrandsTable";

export const metadata = { title: "Brands" };

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage phone brands.</p>
      </div>
      <BrandsTable />
    </div>
  );
}
