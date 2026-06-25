"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useTransferList,
  useApproveTransferMutation,
  useReceiveTransferMutation,
} from "@/hooks/useInventory";

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  pending:   "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  approved:  "bg-primary/10 text-primary border-primary/20",
  received:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

function Pill({ label, styles }) {
  return (
    <span className={cn("inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize", styles)}>
      {label}
    </span>
  );
}

function TableSkeleton() {
  return Array.from({ length: PAGE_SIZE }).map((_, i) => (
    <tr key={i} className="border-b border-border/40">
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-12 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-40 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-28 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-10 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded-lg" /></td>
      <td className="px-4 py-3.5"><Skeleton className="h-7 w-20 rounded-lg" /></td>
    </tr>
  ));
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const range = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      {range().map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="size-7 flex items-center justify-center text-xs text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "size-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors",
              p === page
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background hover:bg-muted text-muted-foreground"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="size-7 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

export function TransfersTable() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const params = {
    page,
    page_size: PAGE_SIZE,
    ...(statusFilter && { status: statusFilter }),
  };

  const { data, isLoading } = useTransferList(params);
  const rows = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalCount = data?.count ?? 0;

  const { mutate: approve, isPending: approving, variables: approvingId } = useApproveTransferMutation();
  const { mutate: receive, isPending: receiving, variables: receivingId } = useReceiveTransferMutation();

  const start = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
        <p className="text-sm font-medium flex-1">Stock Transfers</p>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              {["ID", "From → To", "Product", "Qty", "Status", "Date", "Actions"].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No transfers found.
                </td>
              </tr>
            ) : (
              rows.map((transfer) => (
                <tr
                  key={transfer.id}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                    #{transfer.id}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                      <span className="font-medium">
                        {transfer.from_branch_name ?? transfer.from_branch ?? "—"}
                      </span>
                      <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-medium">
                        {transfer.to_branch_name ?? transfer.to_branch ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 max-w-40 truncate">
                    {transfer.product_name ?? transfer.product ?? "—"}
                  </td>
                  <td className="px-4 py-3.5 font-bold tabular-nums">
                    {transfer.quantity ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <Pill
                      label={transfer.status ?? "—"}
                      styles={STATUS_STYLES[transfer.status] ?? "bg-muted text-muted-foreground border-border"}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap text-xs">
                    {transfer.created_at
                      ? new Date(transfer.created_at).toLocaleDateString("en-PK", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {transfer.status === "pending" && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => approve(transfer.id)}
                          disabled={approving && approvingId === transfer.id}
                        >
                          {approving && approvingId === transfer.id ? "…" : "Approve"}
                        </Button>
                      )}
                      {transfer.status === "approved" && (
                        <Button
                          size="xs"
                          onClick={() => receive(transfer.id)}
                          disabled={receiving && receivingId === transfer.id}
                        >
                          {receiving && receivingId === transfer.id ? "…" : "Receive"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-t border-border/60">
        {isLoading ? (
          <Skeleton className="h-4 w-44 rounded-lg" />
        ) : (
          <p className="text-xs text-muted-foreground">
            {totalCount === 0
              ? "No transfers found"
              : `Showing ${start}–${end} of ${totalCount} transfers`}
          </p>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
