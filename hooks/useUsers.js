import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import auth from "@/lib/api/auth";

export function useUsersList(params = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => auth.listUsers(params).then((r) => r.data.data.results || []),
  });
}

export function useUserDetail(id) {
  return useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => auth.getUser(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => auth.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => auth.updateUser(id, data),
    onSuccess: (res, { id }) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", "detail", id] });
    },
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => auth.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Delete user error:", error);
    },
  });
}
