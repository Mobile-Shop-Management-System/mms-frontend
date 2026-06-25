import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import suppliersApi from "@/lib/api/suppliers";

export function useSupplierList(params = {}) {
  return useQuery({
    queryKey: ["suppliers", "list", params],
    queryFn: () => suppliersApi.list(params).then((r) => r.data.data),
  });
}

export function useSupplierDropdown() {
  return useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: () => suppliersApi.list({ page_size: 200 }).then((r) => r.data.data?.results ?? []),
  });
}

export function useCreateSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => suppliersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useUpdateSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => suppliersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}

export function useDeleteSupplierMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => suppliersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
}
