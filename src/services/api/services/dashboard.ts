import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";

export type DashboardArea = {
  key: string;
  label: string;
  order: number;
  span: number;
  layout: "stack" | "row";
};

export type DashboardWidget = {
  key: string;
  label: string;
  area: string;
  order: number;
  module: string;
  description?: string;
};

export type DashboardHook = {
  key: string;
  slot: string;
  order: number;
  module: string;
  widgetKey?: string;
};

export type DashboardLayoutArea = {
  area: string;
  widgets: string[];
};

export type DashboardPreference = {
  version: number;
  layout: DashboardLayoutArea[];
  visibleWidgets: string[];
};

export type DashboardRegistry = {
  areas: DashboardArea[];
  widgets: DashboardWidget[];
  hooks: DashboardHook[];
  preferences: DashboardPreference;
};

export function useGetDashboardRegistryService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/dashboard/registry`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<DashboardRegistry>),
    [fetch]
  );
}

export function usePatchDashboardPreferencesService() {
  const fetch = useFetch();

  return useCallback(
    (preferences: DashboardPreference, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/dashboard/preferences`, {
        method: "PATCH",
        body: JSON.stringify(preferences),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<DashboardPreference>),
    [fetch]
  );
}

export function useResetDashboardPreferencesService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/dashboard/preferences/reset`, {
        method: "POST",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<DashboardPreference>),
    [fetch]
  );
}
