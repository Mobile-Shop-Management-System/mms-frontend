import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import categoriesApi from "@/lib/api/categories";

function normalizeList(raw) {
  const items = Array.isArray(raw) ? raw : (raw?.results ?? []);
  const totalPages = Array.isArray(raw) ? 1 : (raw?.total_pages ?? 1);
  const count = Array.isArray(raw) ? items.length : (raw?.count ?? items.length);
  return { results: items, count, total_pages: totalPages };
}

export function useCategoryList(params = {}) {
  return useQuery({
    queryKey: ["categories", "list", params],
    queryFn: () => categoriesApi.list(params).then((r) => normalizeList(r.data.data)),
  });
}

export function useCategoryDropdown() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => categoriesApi.list({ page_size: 200 }).then((r) => {
      const raw = r.data.data;
      return Array.isArray(raw) ? raw : (raw?.results ?? []);
    }),
  });
}

export function useCreateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => categoriesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => categoriesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => categoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
