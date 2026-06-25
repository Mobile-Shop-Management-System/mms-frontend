import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import usedPhonesApi from "@/lib/api/used-phones";

export function useUsedPhoneList(params = {}) {
  return useQuery({
    queryKey: ["used-phones", "list", params],
    queryFn: () => usedPhonesApi.list(params).then((r) => r.data.data),
  });
}

export function useCreateUsedPhoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => usedPhonesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["used-phones"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useUpdateUsedPhoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => usedPhonesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["used-phones"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useDeleteUsedPhoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => usedPhonesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["used-phones"] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
