"use client";

import { VariantsTable } from "@/components/products/VariantsTable";

export default function VariantsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-2xl mx-auto animate-in fade-in-0 duration-300">
      <div>
        <h1 className="text-xl font-bold">Variants</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage storage, RAM, and color variants for each product.
        </p>
      </div>

      <VariantsTable />
    </div>
  );
}
