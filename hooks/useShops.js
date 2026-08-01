import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import shopsApi from "@/lib/api/shops";

export function useShops(options = {}) {
  return useQuery({
    queryKey: ["shops"],
    queryFn: () => shopsApi.list().then((response) => response.data.data ?? []),
    enabled: options.enabled ?? true,
  });
}

export function useCreateShopMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => shopsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shops"] }),
  });
}
