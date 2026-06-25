import { CategoriesTable } from "@/components/categories/CategoriesTable";

export const metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage item categories.</p>
      </div>
      <CategoriesTable />
    </div>
  );
}
