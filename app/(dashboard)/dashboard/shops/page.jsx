"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Eye,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCreateShopMutation, useShops } from "@/hooks/useShops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RowAvatar } from "@/components/ui/row-avatar";
import { CreateShopDialog } from "@/components/shops/CreateShopDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ShopsPage() {
  const { user } = useAuth();
  const { data: shops = [], isLoading } = useShops();
  const { mutate: createShop, isPending } = useCreateShopMutation();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return shops;
    const query = search.toLowerCase();
    return shops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(query) ||
        shop.slug.toLowerCase().includes(query) ||
        (shop.admin?.username ?? "").toLowerCase().includes(query),
    );
  }, [shops, search]);

  const activeCount = shops.filter((shop) => shop.is_active).length;
  const memberCount = shops.reduce(
    (total, shop) => total + (shop.member_count ?? 0),
    0,
  );

  if (user?.effective_role !== "super_admin") return null;

  const handleCreate = (form, { onError }) => {
    createShop(form, {
      onSuccess: () => {
        toast.success("Shop created successfully.");
        setShowDialog(false);
      },
      onError: (error) => {
        const data = error?.response?.data;
        const detail =
          data?.errors && typeof data.errors === "object"
            ? Object.values(data.errors).flat()[0]
            : null;
        onError(detail ?? data?.message ?? "Unable to create the shop.");
      },
    });
  };

  return (
    <div className="animate-in fade-in-0 duration-300 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Shop Management</h1>
        <p className="text-muted-foreground">
          Create shops and assign their administrator. Each shop keeps its own
          inventory, sales and staff.
        </p>
      </div>

      {/* Search + action */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card border border-border/40 rounded-xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            placeholder="Search by shop name, identifier, or admin..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10 h-10 bg-background border-2 border-muted"
          />
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="gap-2 whitespace-nowrap"
        >
          <Plus className="size-4" />
          Add Shop
        </Button>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-lg border border-blue-500/30 bg-linear-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-md shadow-blue-500/20">
            <Building2 className="absolute -right-2 -top-2 size-16 text-white/15" />
            <div className="relative">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
                <Building2 className="size-4" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/75">
                Total Shops
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums">
                {shops.length}
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-emerald-500/30 bg-linear-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="absolute -right-2 -top-2 size-16 text-white/15" />
            <div className="relative">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
                <CheckCircle2 className="size-4" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/75">
                Active
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums">
                {activeCount}
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-violet-500/30 bg-linear-to-br from-violet-500 to-fuchsia-600 p-4 text-white shadow-md shadow-violet-500/20">
            <Users className="absolute -right-2 -top-2 size-16 text-white/15" />
            <div className="relative">
              <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
                <Users className="size-4" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/75">
                Team Members
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums">
                {memberCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="size-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {search ? "No shops found" : "No shops created yet"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {search
                ? `No shops match "${search}". Try a different search.`
                : "Create your first shop to start onboarding a business."}
            </p>
            {!search && (
              <Button
                onClick={() => setShowDialog(true)}
                className="mt-4 gap-2"
                size="sm"
              >
                <Plus className="size-4" />
                Create Shop
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/50">
                  <th className="w-12 px-6 py-4" />
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Shop
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Identifier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Shop Admin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Members
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((shop) => (
                  <tr
                    key={shop.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <RowAvatar name={shop.name} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">
                        {shop.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {shop.admin ? "Managed workspace" : "Awaiting admin"}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      /{shop.slug}
                    </td>
                    <td className="px-6 py-4">
                      {shop.admin ? (
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {shop.admin.first_name || shop.admin.last_name
                                ? `${shop.admin.first_name} ${shop.admin.last_name}`.trim()
                                : shop.admin.username}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              @{shop.admin.username}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Users className="size-3.5" />
                        {shop.member_count ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          shop.is_active
                            ? "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mr-1.5 ${
                            shop.is_active ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        {shop.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedShop(shop)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title={`View ${shop.name} details`}
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">View shop details</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDialog && (
        <CreateShopDialog
          onClose={() => setShowDialog(false)}
          onSubmit={handleCreate}
          isProcessing={isPending}
        />
      )}

      <Dialog
        open={Boolean(selectedShop)}
        onOpenChange={(open) => !open && setSelectedShop(null)}
      >
        <DialogContent className="sm:max-w-lg">
          {selectedShop && (
            <>
              <DialogHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <DialogTitle>{selectedShop.name}</DialogTitle>
                <DialogDescription>
                  Shop workspace details and assigned administrator.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Shop identifier
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium">
                    /{selectedShop.slug}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedShop.is_active
                      ? "Active workspace"
                      : "Inactive workspace"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Team members
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {selectedShop.member_count ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Created
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {selectedShop.created_at
                      ? new Date(selectedShop.created_at).toLocaleDateString()
                      : "Not available"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <RowAvatar
                    name={
                      selectedShop.admin?.first_name ||
                      selectedShop.admin?.username ||
                      "Unassigned"
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Shop Admin
                    </p>
                    <p className="truncate font-semibold">
                      {selectedShop.admin
                        ? [
                            selectedShop.admin.first_name,
                            selectedShop.admin.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ") || selectedShop.admin.username
                        : "No administrator assigned"}
                    </p>
                    {selectedShop.admin?.email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {selectedShop.admin.email}
                      </p>
                    )}
                    {selectedShop.admin?.username && (
                      <p className="text-xs text-muted-foreground">
                        @{selectedShop.admin.username}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter showCloseButton />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
