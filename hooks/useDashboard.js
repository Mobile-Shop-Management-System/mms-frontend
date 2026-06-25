import { useQuery } from "@tanstack/react-query";
import dashboardApi from "@/lib/api/dashboard";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get().then((r) => r.data.data),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
