import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  tier: string;
  trailsCompleted: number;
  speciesIdentified: number;
  conservationDonated: number;
  equipmentTracked: number;
  memberSince: string;
}

async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
}
