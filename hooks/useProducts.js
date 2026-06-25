import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import productsApi from "@/lib/api/products";

// ─── Paginated lists ──────────────────────────────────────────────────────────

export function useProductList(params = {}) {
  return useQuery({
    queryKey: ["products", "list", params],
    queryFn: () => productsApi.list(params).then((r) => r.data.data),
  });
}

export function useProductDetail(id) {
  return useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => productsApi.get(id).then((r) => r.data.data),
    enabled: Boolean(id),
  });
}

export function useVariantList(params = {}) {
  return useQuery({
    queryKey: ["products", "variants", "list", params],
    queryFn: () => productsApi.listVariants(params).then((r) => r.data.data),
  });
}

export function useBrandList(params = {}) {
  return useQuery({
    queryKey: ["products", "brands", "list", params],
    queryFn: async () => {
      const raw = await productsApi.listBrands(params).then((r) => r.data.data);
      // Backend returns a flat array (no pagination) for brands
      const items = Array.isArray(raw) ? raw : (raw?.results ?? []);
      return { results: items, count: items.length, total_pages: 1 };
    },
  });
}

export function useCategoryList(params = {}) {
  return useQuery({
    queryKey: ["products", "categories", "list", params],
    queryFn: async () => {
      const raw = await productsApi.listCategories(params).then((r) => r.data.data);
      // Backend returns a flat array (no pagination) for categories
      const items = Array.isArray(raw) ? raw : (raw?.results ?? []);
      return { results: items, count: items.length, total_pages: 1 };
    },
  });
}

// ─── Dropdown helpers (full unpaginated arrays) ───────────────────────────────

export function useBrandDropdown() {
  return useQuery({
    queryKey: ["products", "brands", "all"],
    queryFn: () => productsApi.listBrands({ page_size: 200 }).then((r) => {
      const raw = r.data.data;
      return Array.isArray(raw) ? raw : (raw?.results ?? []);
    }),
  });
}

export function useCategoryDropdown() {
  return useQuery({
    queryKey: ["products", "categories", "all"],
    queryFn: () => productsApi.listCategories({ page_size: 200 }).then((r) => {
      const raw = r.data.data;
      return Array.isArray(raw) ? raw : (raw?.results ?? []);
    }),
  });
}

export function useProductDropdown() {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsApi.list({ page_size: 200, is_active: true }).then((r) => r.data.data?.results ?? []),
  });
}

export function useVariantDropdown(productId) {
  return useQuery({
    queryKey: ["products", "variants", "dropdown", productId],
    queryFn: () =>
      productsApi.listVariants({ product: productId, page_size: 200 }).then((r) => r.data.data?.results ?? []),
    enabled: Boolean(productId),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => productsApi.createBrand(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", "brands"] }); },
  });
}

export function useUpdateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.updateBrand(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", "brands"] }); },
  });
}

export function useDeleteBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => productsApi.removeBrand(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", "brands"] }); },
  });
}

export function useCreateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => productsApi.createCategory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", "categories"] }); },
  });
}

export function useUpdateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.updateCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", "categories"] }); },
  });
}

export function useDeleteCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => productsApi.removeCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", "categories"] }); },
  });
}

export function useCreateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => productsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", "list"] });
      qc.invalidateQueries({ queryKey: ["products", "all"] });
    },
  });
}

export function useUpdateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", "list"] });
      qc.invalidateQueries({ queryKey: ["products", "all"] });
      qc.invalidateQueries({ queryKey: ["products", "detail"] });
    },
  });
}

export function useDeleteProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products", "list"] });
      qc.invalidateQueries({ queryKey: ["products", "all"] });
    },
  });
}

export function useCreateVariantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }) => productsApi.createVariant(productId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", "variants"] }); },
  });
}

export function useUpdateVariantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.updateVariant(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", "variants"] }); },
  });
}

export function useDeleteVariantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => productsApi.removeVariant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products", "variants"] }); },
  });
}
