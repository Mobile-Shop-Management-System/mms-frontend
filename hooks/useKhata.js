import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import khataApi from "@/lib/api/khata";

export function useKhataList(params = {}) {
  return useQuery({
    queryKey: ["khata", "list", params],
    queryFn: () => khataApi.list(params).then((r) => r.data),
  });
}

export function useKhataDetail(id) {
  return useQuery({
    queryKey: ["khata", "detail", id],
    queryFn: () => khataApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePendingKhata() {
  return useQuery({
    queryKey: ["khata", "pending"],
    queryFn: () => khataApi.getPending().then((r) => r.data),
  });
}

export function usePaidKhata() {
  return useQuery({
    queryKey: ["khata", "paid"],
    queryFn: () => khataApi.getPaid().then((r) => r.data),
  });
}

export function useAddKhataPaymentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => khataApi.addPayment(id, data),
    onSuccess: (response) => {
      // Invalidate all khata-related queries
      qc.invalidateQueries({ queryKey: ["khata"] });
      // Invalidate all sales-related queries to reflect updated payment status
      qc.invalidateQueries({ queryKey: ["sales"] });
      // Invalidate dashboard to refresh revenue metrics
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
