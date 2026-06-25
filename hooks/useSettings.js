import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import settingsApi from "@/lib/api/settings";

export function useShopSettings() {
  return useQuery({
    queryKey: ["settings", "shop"],
    queryFn: () => settingsApi.getShopSettings().then((r) => r.data),
  });
}

export function useUpdateShopSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => settingsApi.updateShopSettings(data),
    onSuccess: (response) => {
      qc.setQueryData(["settings", "shop"], response.data);
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
