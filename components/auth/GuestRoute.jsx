"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

function AuthSkeleton() {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:block w-[55%] bg-muted" />

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md space-y-5">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-lg" />
          <div className="space-y-4 pt-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg mt-2" />
        </div>
      </div>
    </div>
  );
}

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) return <AuthSkeleton />;
  if (user) return null;

  return children;
}
