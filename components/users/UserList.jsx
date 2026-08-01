"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  Pencil,
  ShieldCheck,
  UserX,
  Users,
} from "lucide-react";
import { useUpdateUserMutation } from "@/hooks/useUsers";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { RowAvatar } from "@/components/ui/row-avatar";
import { InactivateUserDialog } from "./InactivateUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { toast } from "sonner";

const ROLE_STYLE = {
  super_admin: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  shop_admin: "bg-primary/10 text-primary",
  salesman: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

const ROLE_LABEL = {
  super_admin: "Super Admin",
  shop_admin: "Shop Admin",
  salesman: "Salesman",
};

function fullName(user) {
  return (
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username
  );
}

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_STYLE[role] ?? "bg-muted text-muted-foreground"}`}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        active
          ? "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full mr-1.5 ${active ? "bg-green-500" : "bg-red-500"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserActions({ user, canManage, onEdit, onDeactivate }) {
  return (
    <div className="flex gap-1">
      {canManage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(user)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="Edit user"
        >
          <Pencil className="size-4" />
        </Button>
      )}
      {canManage && user.is_active && !user.is_superuser && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeactivate(user)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Inactivate user"
        >
          <UserX className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function UserList({ users }) {
  const { user: currentUser } = useAuth();
  const [userToEdit, setUserToEdit] = useState(null);
  const [editError, setEditError] = useState(null);
  const [userToInactivate, setUserToInactivate] = useState(null);
  const [inactivateError, setInactivateError] = useState(null);
  const [expandedShops, setExpandedShops] = useState({});
  const { mutate: updateUser, isPending } = useUpdateUserMutation();

  const groups = useMemo(() => {
    const superAdmins = users.filter(
      (user) => user.is_superuser || user.effective_role === "super_admin",
    );
    const shops = new Map();
    const assignedUserIds = new Set();

    users
      .filter(
        (user) => !user.is_superuser && user.effective_role !== "super_admin",
      )
      .forEach((user) => {
        (user.memberships ?? []).forEach((membership) => {
          assignedUserIds.add(user.id);
          if (!shops.has(membership.shop_id)) {
            shops.set(membership.shop_id, {
              id: membership.shop_id,
              name: membership.shop_name,
              slug: membership.shop_slug,
              admins: [],
              salesmen: [],
            });
          }
          const shop = shops.get(membership.shop_id);
          if (membership.role === "shop_admin") shop.admins.push(user);
          if (membership.role === "salesman") shop.salesmen.push(user);
        });
      });

    return {
      superAdmins,
      shops: [...shops.values()].sort((a, b) => a.name.localeCompare(b.name)),
      unassigned: users.filter(
        (user) =>
          !user.is_superuser &&
          user.effective_role !== "super_admin" &&
          !assignedUserIds.has(user.id),
      ),
    };
  }, [users]);

  const handleConfirmEdit = (formData) => {
    setEditError(null);
    updateUser(
      { id: userToEdit.id, data: formData },
      {
        onSuccess: () => {
          setUserToEdit(null);
          setEditError(null);
          toast.success("User updated successfully.");
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to update user";
          setEditError(message);
          toast.error(message);
        },
      },
    );
  };

  const handleConfirmInactivate = () => {
    setInactivateError(null);
    updateUser(
      { id: userToInactivate.id, data: { is_active: false } },
      {
        onSuccess: () => {
          setUserToInactivate(null);
          setInactivateError(null);
          toast.success("User inactivated successfully.");
        },
        onError: (error) => {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to inactivate user";
          setInactivateError(message);
          toast.error(message);
        },
      },
    );
  };

  const toggleShop = (shopId) => {
    setExpandedShops((current) => ({ ...current, [shopId]: !current[shopId] }));
  };

  const isSuperAdmin =
    currentUser?.effective_role === "super_admin" || currentUser?.is_superuser;

  const renderUserRow = (user, role, nested = false) => {
    const isCurrentShopAdmin =
      currentUser?.id === user.id &&
      (currentUser?.effective_role === "shop_admin" ||
        currentUser?.role === "shop_admin");

    return (
      <tr
        key={`${nested ? "staff" : "user"}-${user.id}-${role}`}
        className={
          nested
            ? "bg-primary/2.5 hover:bg-primary/5 transition-colors"
            : "hover:bg-muted/50 transition-colors"
        }
      >
        <td className="px-6 py-3">
          <div className="flex items-center gap-3">
            {nested && (
              <GitBranch className="size-4 shrink-0 text-primary/60" />
            )}
            <RowAvatar name={fullName(user)} src={user.avatar_url} />
          </div>
        </td>
        <td className="px-6 py-3">
          <p className="font-semibold text-foreground">{fullName(user)}</p>
          {user.phone && (
            <p className="text-xs text-muted-foreground mt-0.5">{user.phone}</p>
          )}
        </td>
        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
          @{user.username}
        </td>
        <td className="px-6 py-3 text-sm text-muted-foreground">
          {user.email || "—"}
        </td>
        <td className="px-6 py-3">
          <RoleBadge role={role} />
        </td>
        <td className="px-6 py-3">
          <StatusBadge active={user.is_active} />
        </td>
        <td className="px-6 py-3">
          <UserActions
            user={user}
            canManage={!isCurrentShopAdmin}
            onEdit={setUserToEdit}
            onDeactivate={setUserToInactivate}
          />
        </td>
      </tr>
    );
  };

  if (!users?.length) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No users found. Create your first user.
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/50">
              <th className="w-12 px-6 py-4" />
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Username
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Role
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
            {!isSuperAdmin &&
              users.map((user) =>
                renderUserRow(user, user.effective_role || user.role),
              )}

            {isSuperAdmin && groups.superAdmins.length > 0 && (
              <>
                <tr className="bg-violet-500/6">
                  <td
                    colSpan={7}
                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-3.5" /> Platform
                      Administrators
                    </span>
                  </td>
                </tr>
                {groups.superAdmins.map((user) =>
                  renderUserRow(user, "super_admin"),
                )}
              </>
            )}

            {isSuperAdmin &&
              groups.shops.map((shop) => {
                const isExpanded = expandedShops[shop.id] !== false;
                const team = [...shop.admins, ...shop.salesmen];
                return (
                  <Fragment key={`shop-group-${shop.id}`}>
                    <tr
                      key={`shop-${shop.id}`}
                      className="bg-primary/6 hover:bg-primary/9 transition-colors cursor-pointer"
                      onClick={() => toggleShop(shop.id)}
                    >
                      <td colSpan={7} className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                            {isExpanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </span>
                          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Users className="size-3.5" />
                          </span>
                          <div>
                            <p className="font-bold text-foreground">
                              {shop.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              /{shop.slug} · {team.length} team member
                              {team.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {isExpanded &&
                      shop.admins.map((user) =>
                        renderUserRow(user, "shop_admin"),
                      )}
                    {isExpanded &&
                      shop.salesmen.map((user) =>
                        renderUserRow(user, "salesman", true),
                      )}
                    {isExpanded && team.length === 0 && (
                      <tr key={`empty-${shop.id}`}>
                        <td
                          colSpan={7}
                          className="px-6 py-4 text-center text-sm text-muted-foreground"
                        >
                          No active staff assigned to this shop.
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

            {isSuperAdmin && groups.unassigned.length > 0 && (
              <>
                <tr className="bg-amber-500/6">
                  <td
                    colSpan={7}
                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="size-3.5" /> Unassigned Users
                    </span>
                  </td>
                </tr>
                {groups.unassigned.map((user) =>
                  renderUserRow(user, user.effective_role || user.role),
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {userToEdit && (
        <EditUserDialog
          user={userToEdit}
          onClose={() => {
            setUserToEdit(null);
            setEditError(null);
          }}
          isProcessing={isPending}
          error={editError}
          onConfirm={handleConfirmEdit}
          onErrorClose={() => {
            setUserToEdit(null);
            setEditError(null);
          }}
        />
      )}
      {userToInactivate && (
        <InactivateUserDialog
          user={userToInactivate}
          onClose={() => {
            setUserToInactivate(null);
            setInactivateError(null);
          }}
          isProcessing={isPending}
          error={inactivateError}
          onConfirm={handleConfirmInactivate}
          onErrorClose={() => {
            setUserToInactivate(null);
            setInactivateError(null);
          }}
        />
      )}
    </div>
  );
}
