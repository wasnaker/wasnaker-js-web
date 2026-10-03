import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";

export type ProfileTab = {
  key: string;
  label: string;
  order: number;
};

export function useGetProfileTabsService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/v1/profile/tabs`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProfileTab[]>),
    [fetch]
  );
}
