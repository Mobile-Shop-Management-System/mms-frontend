import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import customersApi from "@/lib/api/customers";

export function useCustomerList(params = {}) {
  return useQuery({
    queryKey: ["customers", "list", params],
    queryFn: () => customersApi.list(params).then((r) => r.data.data),
  });
}

export function useCustomerDropdown() {
  return useQuery({
    queryKey: ["customers", "all"],
    queryFn: () =>
      customersApi
        .list({ page_size: 200 })
        .then((r) => r.data.data?.results ?? []),
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => customersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => customersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
}
