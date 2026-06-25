"use client";

import { useState } from "react";
import { useUpdateUserMutation } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { RowAvatar } from "@/components/ui/row-avatar";
import { InactivateUserDialog } from "./InactivateUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { UserX, Pencil } from "lucide-react";

const ROLE_LABELS = {
  admin: "Admin",
  user: "User",
};

export function UserList({ users }) {
  const [userToEdit, setUserToEdit] = useState(null);
  const [editError, setEditError] = useState(null);
  const [userToInactivate, setUserToInactivate] = useState(null);
  const [inactivateError, setInactivateError] = useState(null);
  const { mutate: updateUser, isPending } = useUpdateUserMutation();

  if (!users || users.length === 0) {
    return (
      <div className="rounded-lg border border-border/40 p-8 text-center">
        <p className="text-muted-foreground">No users found. Create your first user.</p>
      </div>
    );
  }

  const handleConfirmEdit = (formData) => {
    setEditError(null);
    updateUser(
      { id: userToEdit.id, data: formData },
      {
        onSuccess: () => {
          setUserToEdit(null);
          setEditError(null);
        },
        onError: (error) => {
          const errorMsg = error?.response?.data?.message || error?.message || "Failed to update user";
          setEditError(errorMsg);
        },
      }
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
        },
        onError: (error) => {
          const errorMsg = error?.response?.data?.message || error?.message || "Failed to inactivate user";
          setInactivateError(errorMsg);
        },
      }
    );
  };

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
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <RowAvatar name={user.first_name || user.username} />
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-foreground">
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.first_name || user.username}
                  </p>
                  {user.phone && (
                    <p className="text-xs text-muted-foreground mt-0.5">{user.phone}</p>
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                  @{user.username}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {user.email}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.is_active
                        ? "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${user.is_active ? "bg-green-500" : "bg-red-500"}`} />
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUserToEdit(user)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title="Edit user"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {user.is_active ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUserToInactivate(user)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Inactivate user"
                    >
                      <UserX className="size-4" />
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Inactive</span>
                  )}
                </td>
              </tr>
            ))}
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
