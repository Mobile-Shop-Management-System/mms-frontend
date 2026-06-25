"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Search, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  useBranchList, useCreateBranchMutation, useUpdateBranchMutation, useDeleteBranchMutation,
} from "@/hooks/useBranches";

const PAGE_SIZE = 10;

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = totalPages <= 7 ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : page <= 4 ? [1, 2, 3, 4, 5, "…", totalPages]
    : page >= totalPages - 3 ? [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    : [1, "…", page - 1, page, page + 1, "…", totalPages];
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(p => Math.max(1, p - 1))} disabled={page === 1}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="size-3.5" />
      </button>
      {pages.map((p, i) => p === "…"
        ? <span key={`e${i}`} className="size-7 flex items-center justify-center text-xs text-muted-foreground">…</span>
        : <button key={p} onClick={() => onPageChange(p)}
            className={cn("size-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors",
              p === page ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-muted text-muted-foreground")}>
            {p}
          </button>
      )}
      <button onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

function Field({ label, className, error, ...props }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <input {...props} className={cn(
        "w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors",
        error ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-ring/50"
      )} />
      {error && <p className="text-xs text-destructive">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

const EMPTY = { name: "", city: "", address: "", phone: "", manager: "" };

function BranchDialog({ open, onOpenChange, record }) {
  const isEdit = Boolean(record);
  const { mutate: create, isPending: creating } = useCreateBranchMutation();
  const { mutate: update, isPending: updating } = useUpdateBranchMutation();
  const isPending = creating || updating;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(record ? {
      name: record.name ?? "",
      city: record.city ?? "",
      address: record.address ?? "",
      phone: record.phone ?? "",
      manager: record.manager ?? "",
    } : EMPTY);
    setErrors({});
  }, [record, open]);

  const set = (e) => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setErrors(p => ({ ...p, [e.target.name]: undefined })); };
  const close = (v) => { if (!v) { setForm(EMPTY); setErrors({}); } onOpenChange(v); };

  const submit = (e) => {
    e.preventDefault();
    setErrors({});
    const opts = {
      onSuccess: () => { toast.success(isEdit ? "Branch updated." : "Branch added."); close(false); },
      onError: (err) => {
        const e = err?.response?.data?.errors;
        if (e) setErrors(e);
        else toast.error(err?.response?.data?.message ?? "Something went wrong.");
      },
    };
    isEdit ? update({ id: record.id, data: form }, opts) : create(form, opts);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Branch" : "Add Branch"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update branch details." : "Add a new shop or office location."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Branch Name *" name="name" value={form.name} onChange={set} required placeholder="e.g. Main Branch" error={errors.name} />
            <Field label="City *" name="city" value={form.city} onChange={set} required placeholder="e.g. Lahore" error={errors.city} />
            <Field label="Phone" name="phone" value={form.phone} onChange={set} placeholder="+92 300 1234567" error={errors.phone} />
            <Field label="Manager" name="manager" value={form.manager} onChange={set} placeholder="Manager name" error={errors.manager} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">Address</label>
            <textarea name="address" value={form.address} onChange={set} rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              placeholder="Street address…" />
            {errors.address && <p className="text-xs text-destructive">{Array.isArray(errors.address) ? errors.address[0] : errors.address}</p>}
          </div>
          <DialogFooter className="pt-1">
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Branch"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ record, onClose }) {
  const { mutate, isPending } = useDeleteBranchMutation();
  const confirm = () => mutate(record.id, {
    onSuccess: () => { toast.success("Branch deleted."); onClose(); },
    onError: (err) => { toast.error(err?.response?.data?.message ?? "Failed to delete."); onClose(); },
  });
  return (
    <Dialog open={Boolean(record)} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Branch</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold text-foreground">"{record?.name}"</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={isPending}>{isPending ? "Deleting…" : "Delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BranchesTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const params = { page, page_size: PAGE_SIZE, ...(search && { search }) };
  const { data, isLoading } = useBranchList(params);
  const rows = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalCount = data?.count ?? 0;
  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  return (
    <>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg border border-border bg-background flex-1 max-w-xs">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input placeholder="Search branches…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground" />
          </div>
          <Button size="sm" className="ml-auto" onClick={() => setDialogOpen(true)}>
            <Plus className="size-3.5" /> Add Branch
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {["Branch", "City", "Phone", "Manager", "Status", ""].map((col, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {[32, 20, 24, 24, 14, 7].map((w, j) => (
                      <td key={j} className="px-4 py-3.5"><Skeleton className={`h-4 w-${w} rounded-lg`} /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                        <MapPin className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No branches yet. Add your first branch.</p>
                    </div>
                  </td>
                </tr>
              ) : rows.map(branch => (
                <tr key={branch.id} className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium">{branch.name}</p>
                    {branch.address && <p className="text-xs text-muted-foreground truncate max-w-48">{branch.address}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{branch.city || "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{branch.phone || "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{branch.manager || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                      branch.is_active
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border")}>
                      {branch.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted data-popup-open:bg-muted transition-colors">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => setEditRecord(branch)}>
                          <Pencil className="size-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteRecord(branch)}>
                          <Trash2 className="size-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-border/60">
          {isLoading ? <Skeleton className="h-4 w-40 rounded-lg" /> : (
            <p className="text-xs text-muted-foreground">
              {totalCount === 0 ? "No branches" : `Showing ${start}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} branches`}
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <BranchDialog open={dialogOpen} onOpenChange={setDialogOpen} record={null} />
      <BranchDialog open={Boolean(editRecord)} onOpenChange={v => { if (!v) setEditRecord(null); }} record={editRecord} />
      <DeleteDialog record={deleteRecord} onClose={() => setDeleteRecord(null)} />
    </>
  );
}
