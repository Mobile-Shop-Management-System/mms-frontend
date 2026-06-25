import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import itemsApi from "@/lib/api/items";

export function useItemList(params = {}) {
  return useQuery({
    queryKey: ["items", "list", params],
    queryFn: () => itemsApi.list({ exclude_used: "true", ...params }).then((r) => r.data.data),
  });
}

export function useItemDropdown() {
  return useQuery({
    queryKey: ["items", "all"],
    queryFn: () => itemsApi.list({ page_size: 500, in_stock: "true" }).then((r) => r.data.data?.results ?? []),
  });
}

export function useCreateItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => itemsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useUpdateItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => itemsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useDeleteItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => itemsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useCreateVariantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }) => itemsApi.createVariant(itemId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useUpdateVariantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, variantId, data }) => itemsApi.updateVariant(itemId, variantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useDeleteVariantMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, variantId }) => itemsApi.deleteVariant(itemId, variantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useUploadImageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, formData, onUploadProgress }) =>
      itemsApi.uploadImage(itemId, formData, onUploadProgress ? { onUploadProgress } : {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useDeleteImageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, imageId }) => itemsApi.deleteImage(itemId, imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}
