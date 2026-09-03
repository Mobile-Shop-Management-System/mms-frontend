import { CustomersTable } from "@/components/customers/CustomersTable";

export const metadata = { title: "Customers" };

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage customer profiles for your shop.
        </p>
      </div>
      <CustomersTable />
    </div>
  );
}
