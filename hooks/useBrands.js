import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import brandsApi from "@/lib/api/brands";

function normalizeList(raw) {
  const items = Array.isArray(raw) ? raw : (raw?.results ?? []);
  const totalPages = Array.isArray(raw) ? 1 : (raw?.total_pages ?? 1);
  const count = Array.isArray(raw) ? items.length : (raw?.count ?? items.length);
  return { results: items, count, total_pages: totalPages };
}

export function useBrandList(params = {}) {
  return useQuery({
    queryKey: ["brands", "list", params],
    queryFn: () => brandsApi.list(params).then((r) => normalizeList(r.data.data)),
  });
}

export function useBrandDropdown() {
  return useQuery({
    queryKey: ["brands", "all"],
    queryFn: () => brandsApi.list({ page_size: 200 }).then((r) => {
      const raw = r.data.data;
      return Array.isArray(raw) ? raw : (raw?.results ?? []);
    }),
  });
}

export function useCreateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => brandsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useUpdateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => brandsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useDeleteBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => brandsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}
