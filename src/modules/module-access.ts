"use client";

import { useQuery } from "@tanstack/react-query";
import type { ModuleRegistryResponse } from "@wasnaker/region-contract";
import { API_URL } from "@/services/api/config";
import useFetch from "@/services/api/use-fetch";
import useAuth from "@/services/auth/use-auth";

export function useInstalledModuleAccess() {
  const fetch = useFetch();
  const { user } = useAuth();
  return useQuery({
    queryKey: ["installed-modules", user?.id, user?.role?.id],
    enabled: !!user,
    queryFn: async ({ signal }): Promise<ModuleRegistryResponse> => {
      if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is required");
      const response = await fetch(`${API_URL}/v1/modules`, { signal });
      if (!response.ok) throw new Error("moduleRegistryUnavailable");
      return response.json();
    },
    retry: false,
    refetchOnMount: "always",
  });
}
