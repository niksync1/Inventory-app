import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/AuthService";
import { userRepository } from "../repositories/UserRepository";
import { useAuthStore } from "../store/authStore";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => authService.getCurrentUserProfile(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["profile", "update-name"],
    mutationFn: async (name: string) => {
      const user = useAuthStore.getState().user;

      if (!user) {
        throw new Error("Not authenticated");
      }

      await userRepository.updateProfile(user.id, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
