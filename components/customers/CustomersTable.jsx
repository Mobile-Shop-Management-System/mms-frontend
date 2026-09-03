"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RowAvatar } from "@/components/ui/row-avatar";
import {
  useCreateCustomerMutation,
  useCustomerList,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} from "@/hooks/useCustomers";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  phone: "",
  address: "",
  city: "",
  notes: "",
};

function CustomerDialog({ open, onOpenChange, record }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const create = useCreateCustomerMutation();
  const update = useUpdateCustomerMutation();
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setForm(record ? { ...EMPTY_FORM, ...record } : EMPTY_FORM);
      setErrors({});
    }
  }, [open, record]);

  const set = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = (event) => {
    event.preventDefault();
    const options = {
      onSuccess: () => {
        toast.success(editing ? "Customer updated." : "Customer added.");
        onOpenChange(false);
      },
      onError: (error) => {
        const fieldErrors = error?.response?.data?.errors;
        if (fieldErrors) setErrors(fieldErrors);
        else
          toast.error(
            error?.response?.data?.message ?? "Could not save customer.",
          );
      },
    };
    if (editing) update.mutate({ id: record.id, data: form }, options);
    else create.mutate(form, options);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the customer profile."
              : "Save customer details for future sales."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          {["first_name", "last_name", "phone", "city"].map((name) => (
            <div key={name} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {name === "first_name"
                  ? "First name *"
                  : name.replace("_", " ")}
              </label>
              <input
                name={name}
                value={form[name]}
                onChange={set}
                required={name === "first_name" || name === "phone"}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              {errors[name] && (
                <p className="text-xs text-destructive">
                  {errors[name][0] ?? errors[name]}
                </p>
              )}
            </div>
          ))}
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={set}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={set}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <DialogFooter className="col-span-2 pt-1">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CustomersTable() {
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null);
  const { data, isLoading } = useCustomerList({
    page_size: 100,
    ...(search && { search }),
  });
  const remove = useDeleteCustomerMutation();
  const rows = data?.results ?? [];

  const deleteCustomer = (customer) => {
    if (!window.confirm(`Delete ${customer.full_name}?`)) return;
    remove.mutate(customer.id, {
      onSuccess: () => toast.success("Customer deleted."),
      onError: (error) =>
        toast.error(
          error?.response?.data?.message ?? "Could not delete customer.",
        ),
    });
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex h-8 min-w-0 max-w-xs flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or phone..."
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            />
          </div>
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => setDialog("add")}
          >
            <Plus className="size-3.5" /> Add Customer
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["Customer", "Phone", "City", "Purchases", "Actions"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-border/40">
                    <td colSpan={5} className="px-4 py-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-16 text-center text-sm text-muted-foreground"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                rows.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <RowAvatar name={customer.full_name} />
                        <span className="font-medium">
                          {customer.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {customer.phone}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {customer.city || "-"}
                    </td>
                    <td className="px-4 py-3.5 font-medium tabular-nums">
                      PKR{" "}
                      {Number(customer.total_purchases ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          aria-label={`Edit ${customer.full_name}`}
                          onClick={() => setDialog(customer)}
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          aria-label={`Delete ${customer.full_name}`}
                          onClick={() => deleteCustomer(customer)}
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CustomerDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        record={dialog === "add" ? null : dialog}
      />
    </>
  );
}
