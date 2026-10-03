import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";

export type SettingValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export type Setting = {
  id: number;
  name: string;
  value: SettingValue;
  group: string | null;
  type: string | null;
  autoload: boolean;
  encrypted: boolean;
  readonly: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SettingUpdate = Pick<
  Setting,
  "name" | "value" | "group" | "type" | "autoload" | "encrypted" | "readonly"
>;

export type SettingsUpdateResponse = {
  updated: number;
  settings: Setting[];
};

export type SettingsTab = {
  key: string;
  label: string;
  order: number;
};

export function useGetSettingsService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/settings`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Setting[]>),
    [fetch]
  );
}

export function usePatchSettingsService() {
  const fetch = useFetch();

  return useCallback(
    (settings: SettingUpdate[], requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/settings`, {
        method: "PATCH",
        body: JSON.stringify({ settings }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SettingsUpdateResponse>),
    [fetch]
  );
}

export function useGetSettingsTabsService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/settings/tabs`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SettingsTab[]>),
    [fetch]
  );
}
