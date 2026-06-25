import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import returnsApi from "@/lib/api/returns";

export function useReturnList(params = {}) {
  return useQuery({
    queryKey: ["returns", "list", params],
    queryFn: () => returnsApi.list(params).then((r) => r.data.data),
  });
}

export function useReturnDetail(id) {
  return useQuery({
    queryKey: ["returns", "detail", id],
    queryFn: () => returnsApi.get(id).then((r) => r.data.data),
    enabled: Boolean(id),
  });
}

export function useCreateReturnMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => returnsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["returns"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["used-phones"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
