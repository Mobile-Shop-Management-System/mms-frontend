"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserManagement } from "@/components/users/UserManagement";

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const role =
    user?.effective_role ?? (user?.is_superuser ? "super_admin" : user?.role);
  const canManageUsers = role === "super_admin" || role === "shop_admin";

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Only Super Admins and Shop Admins can manage users.
          </p>
          <Button
            onClick={() =>
              router.push(
                role === "super_admin" ? "/dashboard/shops" : "/dashboard",
              )
            }
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 duration-300 space-y-6">
      <UserManagement />
    </div>
  );
}
