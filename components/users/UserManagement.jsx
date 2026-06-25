"use client";

import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { useUsersList } from "@/hooks/useUsers";
import { UserList } from "./UserList";
import { CreateUserDialog } from "./CreateUserDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UserManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: users, isLoading } = useUsersList();

  // Filter users by search query (username, email, or name)
  const filteredUsers = useMemo(() => {
    if (!users || !searchQuery.trim()) return users || [];

    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return (
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        fullName.includes(query)
      );
    });
  }, [users, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage system users. Admin controls access to all features.
        </p>
      </div>

      {/* Search and Add Section */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card border border-border/40 rounded-xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            placeholder="Search by name, email, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-background"
          />
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2 whitespace-nowrap"
        >
          <Plus className="size-4" />
          Add User
        </Button>
      </div>

      {/* Stats Section */}
      {!isLoading && users && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border/40 rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Users</p>
            <p className="text-2xl font-bold mt-2">{users.length}</p>
          </div>
          <div className="bg-card border border-border/40 rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Users</p>
            <p className="text-2xl font-bold mt-2 text-green-500">
              {users.filter((u) => u.is_active).length}
            </p>
          </div>
          <div className="bg-card border border-border/40 rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inactive Users</p>
            <p className="text-2xl font-bold mt-2 text-red-500">
              {users.filter((u) => !u.is_active).length}
            </p>
          </div>
        </div>
      )}

      {/* Users Table Section */}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <UserList users={filteredUsers} />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Search className="size-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No users found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? `No users match "${searchQuery}". Try a different search.`
                : "Create your first user to get started."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4 gap-2"
                size="sm"
              >
                <Plus className="size-4" />
                Create User
              </Button>
            )}
          </div>
        )}
      </div>

      {showCreateDialog && (
        <CreateUserDialog onClose={() => setShowCreateDialog(false)} />
      )}
    </div>
  );
}
