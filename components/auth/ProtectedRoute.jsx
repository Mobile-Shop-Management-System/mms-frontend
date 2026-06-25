"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="w-67.5 shrink-0 border-r p-4 flex flex-col gap-4">
        <Skeleton className="h-9 w-full rounded-xl" />
        <div className="space-y-1.5 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
        <div className="mt-auto">
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>

      {/* Main area skeleton */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <div className="h-14 border-b px-6 flex items-center justify-between shrink-0">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Page content */}
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) return <DashboardSkeleton />;
  if (!user) return null;

  return children;
}
