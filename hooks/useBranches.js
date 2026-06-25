import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import branchesApi from "@/lib/api/branches";

export function useBranchList(params = {}) {
  return useQuery({
    queryKey: ["branches", "list", params],
    queryFn: () => branchesApi.list(params).then((r) => r.data.data),
  });
}

export function useBranchDropdown() {
  return useQuery({
    queryKey: ["branches", "all"],
    queryFn: () => branchesApi.list({ page_size: 200 }).then((r) => r.data.data?.results ?? []),
  });
}

export function useCreateBranchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => branchesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
  });
}

export function useUpdateBranchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => branchesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["branches"] }); },
  });
}

export function useDeleteBranchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => branchesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["branches"] }); },
  });
}
