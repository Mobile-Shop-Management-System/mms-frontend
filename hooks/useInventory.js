import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import inventory from "@/lib/api/inventory";

export function useImeiList(params = {}) {
  return useQuery({
    queryKey: ["inventory", "imei", params],
    queryFn: () => inventory.listImei(params).then((r) => r.data.data),
  });
}

export function useAccessoryStockList(params = {}) {
  return useQuery({
    queryKey: ["inventory", "accessory-stock", params],
    queryFn: () => inventory.listAccessoryStock(params).then((r) => r.data.data),
  });
}

export function useTransferList(params = {}) {
  return useQuery({
    queryKey: ["inventory", "transfers", params],
    queryFn: () => inventory.listTransfers(params).then((r) => r.data.data),
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: () => inventory.getLowStock().then((r) => r.data.data),
  });
}

export function useCreateImeiMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => inventory.createImei(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "imei"] }),
  });
}

export function useUpdateImeiMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => inventory.updateImei(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "imei"] }),
  });
}

export function useDeleteImeiMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => inventory.removeImei(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "imei"] }),
  });
}

export function useApproveTransferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pk) => inventory.approveTransfer(pk),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "transfers"] }),
  });
}

export function useReceiveTransferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pk) => inventory.receiveTransfer(pk),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "transfers"] }),
  });
}
