"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TabsWorkspace } from "@wasnaker/core-web";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Save from "lucide-react/dist/esm/icons/save";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSnackbar } from "@/hooks/use-snackbar";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  Setting,
  SettingUpdate,
  useGetSettingsService,
  useGetSettingsTabsService,
  usePatchSettingsService,
} from "@/services/api/services/settings";
import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { getSettingsTabPanel } from "@/services/settings/settings-tab-panel.registry";
import "@/modules/settings-tab-contributions";

type DraftValue = string | boolean;

const settingsQueryKey = ["settings"];
const settingsTabsQueryKey = ["settings", "tabs"];

function getInitialValue(setting: Setting): DraftValue {
  if (setting.encrypted) return "";
  if (typeof setting.value === "boolean") return setting.value;
  if (typeof setting.value === "object" && setting.value !== null) {
    return JSON.stringify(setting.value, null, 2);
  }
  return setting.value === null ? "" : String(setting.value);
}

function getFieldLabel(name: string): string {
  return name
    .split(".")
    .at(-1)!
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function valueFromDraft(setting: Setting, value: DraftValue) {
  if (setting.encrypted) return String(value);
  if (setting.type === "number") {
    if (String(value).trim() === "") throw new Error("invalidNumber");
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error("invalidNumber");
    return parsed;
  }
  if (setting.type === "boolean") return Boolean(value);
  if (
    setting.type === "json" ||
    setting.type === "array" ||
    setting.type === "object"
  ) {
    try {
      return JSON.parse(String(value));
    } catch {
      throw new Error("invalidJson");
    }
  }
  return String(value);
}

function SettingsPage() {
  const { t } = useTranslation("admin-panel-settings");
  const fetchSettings = useGetSettingsService();
  const fetchSettingsTabs = useGetSettingsTabsService();
  const patchSettings = usePatchSettingsService();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTabKey, setActiveTabKey] = useState("general");
  const [drafts, setDrafts] = useState<Record<string, DraftValue>>({});

  const settingsQuery = useQuery({
    queryKey: settingsQueryKey,
    queryFn: async ({ signal }) => {
      const { status, data } = await fetchSettings({ signal });
      if (status !== HTTP_CODES_ENUM.OK) throw new Error("settingsLoadFailed");
      return data;
    },
  });

  const settingsTabsQuery = useQuery({
    queryKey: settingsTabsQueryKey,
    queryFn: async ({ signal }) => {
      const { status, data } = await fetchSettingsTabs({ signal });
      if (status !== HTTP_CODES_ENUM.OK)
        throw new Error("settingsTabsLoadFailed");
      return data;
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setDrafts((current) => {
      const next = { ...current };
      for (const setting of settingsQuery.data) {
        if (!(setting.name in next))
          next[setting.name] = getInitialValue(setting);
      }
      return next;
    });
  }, [settingsQuery.data]);

  const tabs = settingsTabsQuery.data ?? [];
  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0];

  const visibleSettings = useMemo(
    () =>
      (settingsQuery.data ?? []).filter(
        (setting) => setting.group === activeTab?.key
      ),
    [settingsQuery.data, activeTab]
  );

  const changedSettings = visibleSettings.filter((setting) => {
    const draft = drafts[setting.name] ?? getInitialValue(setting);
    return (
      !setting.readonly &&
      draft !== getInitialValue(setting) &&
      !(setting.encrypted && draft === "")
    );
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: SettingUpdate[]) => {
      const { status, data } = await patchSettings(updates);
      if (status !== HTTP_CODES_ENUM.OK) throw new Error("settingsSaveFailed");
      return data;
    },
    onSuccess: async (response) => {
      queryClient.setQueryData<Setting[]>(settingsQueryKey, (current) =>
        current?.map(
          (setting) =>
            response.settings.find(
              (updated) => updated.name === setting.name
            ) ?? setting
        )
      );
      setDrafts((current) => {
        const next = { ...current };
        for (const setting of response.settings) {
          next[setting.name] = getInitialValue(setting);
        }
        return next;
      });
      enqueueSnackbar(t("messages.saved"), { variant: "success" });
    },
    onError: () =>
      enqueueSnackbar(t("messages.saveFailed"), { variant: "error" }),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const updates = changedSettings.map((setting) => ({
        name: setting.name,
        value: valueFromDraft(
          setting,
          drafts[setting.name] ?? getInitialValue(setting)
        ),
        group: setting.group,
        type: setting.type,
        autoload: setting.autoload,
        encrypted: setting.encrypted,
        readonly: setting.readonly,
      }));
      if (updates.length) updateMutation.mutate(updates);
    } catch (error) {
      const key = error instanceof Error ? error.message : "invalidJson";
      enqueueSnackbar(t(`messages.${key}`), { variant: "error" });
    }
  };

  return (
    <div className="settings-page mx-auto w-full max-w-5xl px-4 py-8">
      <header className="settings-page__header mb-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </header>

      {settingsQuery.isPending || settingsTabsQuery.isPending ? (
        <div className="flex min-h-52 items-center justify-center text-muted-foreground">
          <Loader2
            className="size-5 animate-spin"
            aria-label={t("states.loading")}
          />
        </div>
      ) : settingsQuery.isError || settingsTabsQuery.isError ? (
        <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-sm">
          <p role="alert">{t("states.loadFailed")}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              settingsQuery.refetch();
              settingsTabsQuery.refetch();
            }}
          >
            {t("actions.retry")}
          </Button>
        </div>
      ) : (
        <TabsWorkspace
          tabs={tabs}
          value={activeTabKey}
          onValueChange={setActiveTabKey}
          navigationLabel={t("groups.label")}
          classPrefix="settings-page"
          getLabel={(tab) =>
            t(`groups.${tab.key}`, { defaultValue: tab.label })
          }
          renderPanel={(tab) => {
            const Panel = getSettingsTabPanel(tab.key);
            if (Panel) return <Panel />;
            return (
              <form className="settings-page__form" onSubmit={handleSubmit}>
                {visibleSettings.length ? (
                  <div className="settings-page__fields divide-y">
                    {visibleSettings.map((setting) => {
                      const draft =
                        drafts[setting.name] ?? getInitialValue(setting);
                      const fieldLabel = t(`fields.${setting.name}`, {
                        defaultValue: getFieldLabel(setting.name),
                      });

                      return (
                        <div
                          key={setting.id}
                          className="settings-page__field grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)] sm:items-center"
                        >
                          <div className="min-w-0">
                            <label
                              className="text-sm font-medium"
                              htmlFor={`setting-${setting.id}`}
                            >
                              {fieldLabel}
                            </label>
                            {setting.encrypted && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("hints.secret")}
                              </p>
                            )}
                            {setting.readonly && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("hints.readonly")}
                              </p>
                            )}
                          </div>

                          {setting.type === "boolean" ? (
                            <Switch
                              id={`setting-${setting.id}`}
                              checked={Boolean(draft)}
                              disabled={
                                setting.readonly || updateMutation.isPending
                              }
                              onCheckedChange={(checked) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [setting.name]: checked,
                                }))
                              }
                              aria-label={fieldLabel}
                            />
                          ) : setting.type === "json" ||
                            setting.type === "array" ||
                            setting.type === "object" ? (
                            <Textarea
                              id={`setting-${setting.id}`}
                              rows={4}
                              value={String(draft)}
                              disabled={
                                setting.readonly || updateMutation.isPending
                              }
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [setting.name]: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            <Input
                              id={`setting-${setting.id}`}
                              type={
                                setting.encrypted
                                  ? "password"
                                  : setting.type === "number"
                                    ? "number"
                                    : setting.name.endsWith("fromEmail")
                                      ? "email"
                                      : setting.name.endsWith("defaultUrl")
                                        ? "url"
                                        : "text"
                              }
                              inputMode={
                                setting.type === "number"
                                  ? "decimal"
                                  : undefined
                              }
                              autoComplete={
                                setting.encrypted ? "new-password" : "off"
                              }
                              placeholder={
                                setting.encrypted
                                  ? t("placeholders.secret")
                                  : undefined
                              }
                              value={String(draft)}
                              disabled={
                                setting.readonly || updateMutation.isPending
                              }
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [setting.name]: event.target.value,
                                }))
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-10 text-sm text-muted-foreground">
                    {t("states.empty")}
                  </p>
                )}

                {visibleSettings.length > 0 && (
                  <div className="flex justify-end border-t pt-4">
                    <Button
                      type="submit"
                      disabled={
                        !changedSettings.length || updateMutation.isPending
                      }
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Save />
                      )}
                      {t("actions.save")}
                    </Button>
                  </div>
                )}
              </form>
            );
          }}
        />
      )}
    </div>
  );
}

export default withPageRequiredAuth(SettingsPage, { roles: [RoleEnum.ADMIN] });
