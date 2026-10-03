"use client";

import { useMemo } from "react";
import { RegionPage, createRegionClient } from "@wasnaker/region-web";
import { API_URL } from "@/services/api/config";
import useFetch from "@/services/api/use-fetch";
import useAuth from "@/services/auth/use-auth";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useLanguage from "@/services/i18n/use-language";

function Regions() {
  const fetch = useFetch();
  const language = useLanguage();
  const { user } = useAuth();
  const client = useMemo(() => {
    if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is required");
    return createRegionClient(API_URL, fetch);
  }, [fetch]);
  return (
    <RegionPage
      key={`${user!.id}:${user!.role?.id}`}
      client={client}
      language={language}
      cacheScope={`${user!.id}:${user!.role?.id}`}
    />
  );
}

export default withPageRequiredAuth(Regions);
