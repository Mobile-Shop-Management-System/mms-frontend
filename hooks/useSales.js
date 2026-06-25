import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import salesApi from "@/lib/api/sales";

export function useSaleList(params = {}) {
  return useQuery({
    queryKey: ["sales", "list", params],
    queryFn: () => salesApi.list(params).then((r) => r.data.data),
  });
}

export function useSaleByInvoice(invoiceNumber) {
  return useQuery({
    queryKey: ["sales", "lookup", invoiceNumber],
    queryFn: () =>
      salesApi
        .list({ search: invoiceNumber, page_size: 5 })
        .then((r) => (r.data.data?.results ?? [])[0] ?? null),
    enabled: Boolean(invoiceNumber),
    staleTime: 0,
  });
}

export function useSaleDetail(id) {
  return useQuery({
    queryKey: ["sales", "detail", id],
    queryFn: () => salesApi.get(id).then((r) => r.data.data),
    enabled: Boolean(id),
  });
}

export function useCreateSaleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => salesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
