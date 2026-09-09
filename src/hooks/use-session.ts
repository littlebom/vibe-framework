"use client";
import { useSession } from "next-auth/react";

export function useAppSession() {
  const { data, status, update } = useSession();
  const authenticated = status === "authenticated" && !!data?.user?.id;
  return {
    status, update,
    isLoading: status === "loading",
    isAuthenticated: authenticated,
    user: authenticated ? data!.user : null,
    tenantId: authenticated ? data!.tenantId : null,
    roles: data?.roles ?? [],
    permissions: data?.permissions ?? [],
    isSuperAdmin: data?.isSuperAdmin ?? false,
    mustChangePassword: data?.mustChangePassword ?? false,
  };
}
