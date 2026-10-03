import type {
  DashboardPreference,
  DashboardRegistry,
} from "@/services/api/services/dashboard";

export type DashboardMoveDirection = "up" | "down" | "left" | "right";

export type DashboardWidgetLocation = {
  area: string;
  index: number;
};

export function updateDashboardWidgetVisibility(
  preferences: DashboardPreference,
  widgetKey: string,
  visible: boolean
): DashboardPreference {
  const visibleWidgets = new Set(preferences.visibleWidgets);

  if (visible) {
    visibleWidgets.add(widgetKey);
  } else {
    visibleWidgets.delete(widgetKey);
  }

  return {
    ...preferences,
    visibleWidgets: [...visibleWidgets],
  };
}

export function moveDashboardWidget(
  preferences: DashboardPreference,
  widgetKey: string,
  direction: DashboardMoveDirection
): DashboardPreference {
  const layout = preferences.layout.map((area) => ({
    area: area.area,
    widgets: [...area.widgets],
  }));
  const sourceAreaIndex = layout.findIndex((area) =>
    area.widgets.includes(widgetKey)
  );

  if (sourceAreaIndex < 0) return preferences;

  const sourceArea = layout[sourceAreaIndex];
  const sourceWidgetIndex = sourceArea.widgets.indexOf(widgetKey);

  if (direction === "up" || direction === "down") {
    const targetWidgetIndex =
      direction === "up" ? sourceWidgetIndex - 1 : sourceWidgetIndex + 1;

    if (
      targetWidgetIndex < 0 ||
      targetWidgetIndex >= sourceArea.widgets.length
    ) {
      return preferences;
    }

    const nextWidgets = [...sourceArea.widgets];
    nextWidgets[sourceWidgetIndex] = nextWidgets[targetWidgetIndex];
    nextWidgets[targetWidgetIndex] = widgetKey;
    layout[sourceAreaIndex] = { ...sourceArea, widgets: nextWidgets };

    return { ...preferences, layout };
  }

  const targetAreaIndex =
    direction === "left" ? sourceAreaIndex - 1 : sourceAreaIndex + 1;

  if (targetAreaIndex < 0 || targetAreaIndex >= layout.length) {
    return preferences;
  }

  sourceArea.widgets.splice(sourceWidgetIndex, 1);
  layout[targetAreaIndex].widgets.push(widgetKey);

  return { ...preferences, layout };
}

export function locateDashboardWidget(
  preferences: DashboardPreference,
  widgetKey: string
): DashboardWidgetLocation | null {
  for (const area of preferences.layout) {
    const index = area.widgets.indexOf(widgetKey);

    if (index >= 0) {
      return { area: area.area, index };
    }
  }

  return null;
}

export function moveDashboardWidgetToArea(
  preferences: DashboardPreference,
  widgetKey: string,
  from: DashboardWidgetLocation,
  to: DashboardWidgetLocation
): DashboardPreference {
  if (from.area === to.area && from.index === to.index) {
    return preferences;
  }

  const layout = preferences.layout.map((area) => ({
    area: area.area,
    widgets: [...area.widgets],
  }));
  const sourceArea = layout.find((area) => area.area === from.area);
  const targetArea = layout.find((area) => area.area === to.area);

  if (!sourceArea || !targetArea) return preferences;

  const [removed] = sourceArea.widgets.splice(from.index, 1);

  if (removed !== widgetKey) return preferences;

  const targetIndex =
    from.area === to.area && from.index < to.index ? to.index - 1 : to.index;

  targetArea.widgets.splice(
    Math.min(Math.max(targetIndex, 0), targetArea.widgets.length),
    0,
    widgetKey
  );

  return { ...preferences, layout };
}

export function mergeDashboardPreference(
  registry: DashboardRegistry,
  preferences: DashboardPreference
): DashboardRegistry {
  return {
    ...registry,
    preferences,
  };
}
