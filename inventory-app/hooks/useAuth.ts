import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/AuthService";
import { useAuthStore } from "../store/authStore";
import { LoginInput } from "../types/auth";

export function useLogin() {
  const { setSession } = useAuthStore();

  return useMutation({
    mutationKey: ["login"],
    mutationFn: async (input: LoginInput) => {
      const data = await authService.signIn(input);
      setSession(data.session);
      return data;
    },
  });
}

export function useLogout() {
  const { clearSession } = useAuthStore();

  return useMutation({
    mutationKey: ["logout"],
    mutationFn: async () => {
      await authService.signOut();
      clearSession();
    },
  });
}