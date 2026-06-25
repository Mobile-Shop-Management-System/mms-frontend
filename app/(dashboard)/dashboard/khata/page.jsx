import { KhataManager } from "@/components/khata/KhataManager";

export const metadata = { title: "Khata - Credit Ledger" };

export default function KhataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Khata - Credit Ledger</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage customer credit and payment records.</p>
      </div>
      <KhataManager />
    </div>
  );
}
