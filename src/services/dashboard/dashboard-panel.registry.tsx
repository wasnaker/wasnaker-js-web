import type { ComponentType, ReactNode } from "react";
import type {
  DashboardArea,
  DashboardHook,
  DashboardRegistry,
  DashboardWidget,
} from "@/services/api/services/dashboard";
import type { User } from "@/services/api/types/user";

export type DashboardWidgetPanelProps = {
  widget: DashboardWidget;
  registry: DashboardRegistry;
  currentUser?: User | null;
  renderWidgetHooks: (widgetKey: string, slot: string) => ReactNode;
};

export type DashboardHookPanelProps = {
  hook: DashboardHook;
  registry: DashboardRegistry;
  currentUser?: User | null;
};

const widgetPanels = new Map<
  string,
  ComponentType<DashboardWidgetPanelProps>
>();
const hookPanels = new Map<string, ComponentType<DashboardHookPanelProps>>();

function assertDashboardKey(key: string, type: string): string {
  const normalizedKey = key.trim();

  if (!/^[a-z0-9][a-z0-9_.-]*$/.test(normalizedKey)) {
    throw new Error(`Dashboard ${type} panels require a slug key`);
  }

  return normalizedKey;
}

export function registerDashboardWidgetPanel(
  key: string,
  panel: ComponentType<DashboardWidgetPanelProps>
): void {
  widgetPanels.set(assertDashboardKey(key, "widget"), panel);
}

export function getDashboardWidgetPanel(
  key: string
): ComponentType<DashboardWidgetPanelProps> | undefined {
  return widgetPanels.get(key);
}

export function registerDashboardHookPanel(
  key: string,
  panel: ComponentType<DashboardHookPanelProps>
): void {
  hookPanels.set(assertDashboardKey(key, "hook"), panel);
}

export function getDashboardHookPanel(
  key: string
): ComponentType<DashboardHookPanelProps> | undefined {
  return hookPanels.get(key);
}

export function getAreaSpanClass(area: DashboardArea): string {
  const spans: Record<number, string> = {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
    7: "lg:col-span-7",
    8: "lg:col-span-8",
    9: "lg:col-span-9",
    10: "lg:col-span-10",
    11: "lg:col-span-11",
    12: "lg:col-span-12",
  };

  return spans[area.span] ?? "lg:col-span-12";
}
