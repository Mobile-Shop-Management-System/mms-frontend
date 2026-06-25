"use client";

import { ProductsTable } from "@/components/products/ProductsTable";

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-2xl mx-auto animate-in fade-in-0 duration-300">
      <div>
        <h1 className="text-xl font-bold">Products</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your product catalog.
        </p>
      </div>

      <ProductsTable />
    </div>
  );
}
