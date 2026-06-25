"use client";

import { BranchesTable } from "@/components/branches/BranchesTable";

export default function BranchesPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-2xl mx-auto animate-in fade-in-0 duration-300">
      <div>
        <h1 className="text-xl font-bold">Branches</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your shop locations and branches.
        </p>
      </div>

      <BranchesTable />
    </div>
  );
}
