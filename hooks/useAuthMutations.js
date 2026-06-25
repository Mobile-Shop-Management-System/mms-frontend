import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export function useLoginMutation() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: login,
  });
}

export function useRegisterMutation() {
  const { register } = useAuth();
  return useMutation({
    mutationFn: register,
  });
}

export function useLogoutMutation() {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: logout,
  });
}
