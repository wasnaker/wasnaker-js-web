"use client";

import { createElement, useMemo, useState, type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Rows3 from "lucide-react/dist/esm/icons/rows-3";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useAuth from "@/services/auth/use-auth";
import {
  DashboardHook,
  DashboardPreference,
  DashboardRegistry,
  DashboardWidget,
  useGetDashboardRegistryService,
  usePatchDashboardPreferencesService,
  useResetDashboardPreferencesService,
} from "@/services/api/services/dashboard";
import {
  getAreaSpanClass,
  getDashboardHookPanel,
  getDashboardWidgetPanel,
} from "@/services/dashboard/dashboard-panel.registry";
import {
  DashboardMoveDirection,
  locateDashboardWidget,
  mergeDashboardPreference,
  moveDashboardWidget,
  moveDashboardWidgetToArea,
  updateDashboardWidgetVisibility,
} from "@/services/dashboard/dashboard-layout";
import {
  DashboardAreaDropZone,
  DashboardDragHandle,
  DashboardSortableWidget,
  getAreaKeyFromDashboardColumnId,
  isDashboardColumnId,
} from "@/services/dashboard/dashboard-dnd";
import { cn } from "@/lib/utils";
import "@/modules/dashboard-contributions";

const dashboardRegistryQueryKey = ["dashboard", "registry"];

const dashboardCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const widgetHits = pointerHits.filter((hit) => !isDashboardColumnId(hit.id));

  if (widgetHits.length > 0) return widgetHits;

  const columnHits = pointerHits.filter((hit) => isDashboardColumnId(hit.id));

  if (columnHits.length > 0) return columnHits;

  const rectangleHits = rectIntersection(args);

  return rectangleHits.length > 0 ? rectangleHits : closestCenter(args);
};

type IconButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function IconButton({ label, disabled, onClick, children }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function UnavailableWidget({ widget }: { widget: DashboardWidget }) {
  return (
    <div className="dashboard-widget__unavailable rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      Widget panel unavailable: {widget.key}
    </div>
  );
}

function DashboardHookSlot({
  hooks,
  registry,
  currentUser,
  slot,
  widgetKey,
}: {
  hooks: DashboardHook[];
  registry: DashboardRegistry;
  currentUser: ReturnType<typeof useAuth>["user"];
  slot: string;
  widgetKey?: string;
}) {
  const scopedHooks = hooks.filter(
    (hook) => hook.slot === slot && (hook.widgetKey ?? undefined) === widgetKey
  );

  if (!scopedHooks.length) return null;

  return (
    <div
      className={cn(
        "dashboard-hook-slot space-y-3",
        `dashboard-hook-slot--${slot}`
      )}
    >
      {scopedHooks.map((hook) => {
        const HookPanel = getDashboardHookPanel(hook.key);

        return (
          <div key={hook.key} className="dashboard-hook-slot__item">
            {HookPanel ? (
              createElement(HookPanel, {
                hook,
                registry,
                currentUser,
              })
            ) : (
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                Hook panel unavailable: {hook.key}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DashboardWidgetCard({
  widget,
  registry,
  preferences,
  currentUser,
  isSaving,
  dragHandle,
  isDragging,
  onMove,
  onVisibilityChange,
}: {
  widget: DashboardWidget;
  registry: DashboardRegistry;
  preferences: DashboardPreference;
  currentUser: ReturnType<typeof useAuth>["user"];
  isSaving: boolean;
  dragHandle: ReactNode;
  isDragging: boolean;
  onMove: (widgetKey: string, direction: DashboardMoveDirection) => void;
  onVisibilityChange: (widgetKey: string, visible: boolean) => void;
}) {
  const Panel = getDashboardWidgetPanel(widget.key);
  const currentAreaIndex = preferences.layout.findIndex((area) =>
    area.widgets.includes(widget.key)
  );
  const currentArea = preferences.layout[currentAreaIndex];
  const widgetIndex = currentArea?.widgets.indexOf(widget.key) ?? -1;

  return (
    <article
      className={cn(
        "dashboard-widget rounded-md border bg-background shadow-xs",
        isDragging && "dashboard-widget--dragging opacity-50"
      )}
    >
      <header className="dashboard-widget__header flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className="dashboard-widget__drag shrink-0 pt-0.5">
            {dragHandle}
          </div>
          <div className="min-w-0">
            <h2 className="dashboard-widget__title truncate text-sm font-semibold">
              {widget.label}
            </h2>
            {widget.description ? (
              <p className="dashboard-widget__description truncate text-xs text-muted-foreground">
                {widget.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="dashboard-widget__actions flex shrink-0 items-center gap-1">
          <IconButton
            label="Move up"
            disabled={isSaving || widgetIndex <= 0}
            onClick={() => onMove(widget.key, "up")}
          >
            <ArrowUp />
          </IconButton>
          <IconButton
            label="Move down"
            disabled={
              isSaving ||
              !currentArea ||
              widgetIndex < 0 ||
              widgetIndex >= currentArea.widgets.length - 1
            }
            onClick={() => onMove(widget.key, "down")}
          >
            <ArrowDown />
          </IconButton>
          <IconButton
            label="Move to previous area"
            disabled={isSaving || currentAreaIndex <= 0}
            onClick={() => onMove(widget.key, "left")}
          >
            <ArrowLeft />
          </IconButton>
          <IconButton
            label="Move to next area"
            disabled={
              isSaving ||
              currentAreaIndex < 0 ||
              currentAreaIndex >= preferences.layout.length - 1
            }
            onClick={() => onMove(widget.key, "right")}
          >
            <ArrowRight />
          </IconButton>
          <IconButton
            label="Hide widget"
            disabled={isSaving}
            onClick={() => onVisibilityChange(widget.key, false)}
          >
            <EyeOff />
          </IconButton>
        </div>
      </header>
      <div className="dashboard-widget__content p-4">
        {Panel ? (
          createElement(Panel, {
            widget,
            registry,
            currentUser,
            renderWidgetHooks: (widgetKey, slot) => (
              <DashboardHookSlot
                hooks={registry.hooks}
                registry={registry}
                currentUser={currentUser}
                slot={slot}
                widgetKey={widgetKey}
              />
            ),
          })
        ) : (
          <UnavailableWidget widget={widget} />
        )}
      </div>
    </article>
  );
}

function AdminPanel() {
  const { t } = useTranslation("admin-panel-home");
  const { user } = useAuth();
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [preview, setPreview] = useState(false);
  const queryClient = useQueryClient();
  const getDashboardRegistry = useGetDashboardRegistryService();
  const patchDashboardPreferences = usePatchDashboardPreferencesService();
  const resetDashboardPreferences = useResetDashboardPreferencesService();

  const dashboardRegistryQuery = useQuery({
    queryKey: dashboardRegistryQueryKey,
    queryFn: async () => {
      const { status, data } = await getDashboardRegistry();
      if (status !== HTTP_CODES_ENUM.OK) throw new Error("dashboardLoadFailed");
      return data;
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (preferences: DashboardPreference) => {
      const { status, data } = await patchDashboardPreferences(preferences);
      if (status !== HTTP_CODES_ENUM.OK) throw new Error("dashboardSaveFailed");
      return data;
    },
    onSuccess: (preferences) => {
      queryClient.setQueryData<DashboardRegistry>(
        dashboardRegistryQueryKey,
        (current) =>
          current ? mergeDashboardPreference(current, preferences) : current
      );
    },
  });

  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      const { status, data } = await resetDashboardPreferences();
      if (status !== HTTP_CODES_ENUM.OK)
        throw new Error("dashboardResetFailed");
      return data;
    },
    onSuccess: (preferences) => {
      queryClient.setQueryData<DashboardRegistry>(
        dashboardRegistryQueryKey,
        (current) =>
          current ? mergeDashboardPreference(current, preferences) : current
      );
    },
  });

  const registry = dashboardRegistryQuery.data;
  const preferences = registry?.preferences;
  const visibleWidgets = useMemo(
    () => new Set(preferences?.visibleWidgets ?? []),
    [preferences?.visibleWidgets]
  );
  const widgetsByKey = useMemo(
    () => new Map(registry?.widgets.map((widget) => [widget.key, widget])),
    [registry?.widgets]
  );
  const isSaving =
    savePreferencesMutation.isPending || resetPreferencesMutation.isPending;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );
  const activeWidget = activeWidgetId
    ? widgetsByKey.get(activeWidgetId)
    : undefined;

  const persistPreference = (nextPreference: DashboardPreference) => {
    queryClient.setQueryData<DashboardRegistry>(
      dashboardRegistryQueryKey,
      (current) =>
        current ? mergeDashboardPreference(current, nextPreference) : current
    );
    savePreferencesMutation.mutate(nextPreference);
  };

  const handleMove = (widgetKey: string, direction: DashboardMoveDirection) => {
    if (!preferences) return;
    persistPreference(moveDashboardWidget(preferences, widgetKey, direction));
  };

  const handleVisibilityChange = (widgetKey: string, visible: boolean) => {
    if (!preferences) return;
    persistPreference(
      updateDashboardWidgetVisibility(preferences, widgetKey, visible)
    );
  };

  const announceMove = (
    widgetKey: string,
    fromArea: string,
    toArea: string,
    toIndex: number
  ) => {
    const widget = widgetsByKey.get(widgetKey);
    const area = registry?.areas.find((item) => item.key === toArea);

    setAnnouncement(
      `${widget?.label ?? widgetKey} moved to ${
        area?.label ?? toArea
      }, position ${toIndex + 1}${fromArea !== toArea ? "." : "."}`
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveWidgetId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveWidgetId(null);

    if (!preferences || !event.over || event.active.id === event.over.id) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    const from = locateDashboardWidget(preferences, activeId);

    if (!from) return;

    const overArea = isDashboardColumnId(overId)
      ? getAreaKeyFromDashboardColumnId(overId)
      : null;
    const to = overArea
      ? {
          area: overArea,
          index:
            preferences.layout.find((area) => area.area === overArea)?.widgets
              .length ?? 0,
        }
      : locateDashboardWidget(preferences, overId);

    if (!to) return;

    const nextPreference = moveDashboardWidgetToArea(
      preferences,
      activeId,
      from,
      to
    );

    if (nextPreference !== preferences) {
      persistPreference(nextPreference);
      announceMove(activeId, from.area, to.area, to.index);
    }
  };

  return (
    <div className="dashboard-page mx-auto w-full max-w-7xl px-4 py-8">
      <header className="dashboard-page__header mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="dashboard-page__title text-3xl font-semibold">
            {t("title")}
          </h1>
          <p className="dashboard-page__description mt-2 text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <TooltipProvider>
          <div className="dashboard-page__toolbar flex items-center gap-2">
            {/* Dropdown Visibility Widget */}
            <details className="dashboard-toolbar__actions group relative">
              <summary className="dashboard-toolbar__summary inline-flex cursor-pointer list-none items-center rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
                {t("widgets")}{" "}
                <span className="text-muted-foreground">
                  ({visibleWidgets.size}/{registry?.widgets.length})
                </span>
              </summary>
              <div className="dashboard-toolbar__panel absolute end-0 top-full z-50 mt-1 min-w-56 max-h-80 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg">
                <ul className="dashboard-toolbar__panel-list space-y-0.5">
                  {registry?.widgets.map((widget) => (
                    <li key={widget.key}>
                      <label className="dashboard-toolbar__panel-item flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 transition-colors hover:bg-muted">
                        <input
                          type="checkbox"
                          className="size-3.5 accent-primary"
                          checked={visibleWidgets.has(widget.key)}
                          onChange={() =>
                            handleVisibilityChange(
                              widget.key,
                              !visibleWidgets.has(widget.key)
                            )
                          }
                          data-testid={`toolbar-visibility-${widget.key}`}
                        />
                        <span className="truncate">{widget.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            {/* Tombol Show Widget Areas */}
            <IconButton
              label={
                preview ? t("toolbar_hide_areas") : t("toolbar_show_areas")
              }
              disabled={isSaving}
              onClick={() => setPreview((p) => !p)}
            >
              <Rows3 />
            </IconButton>

            {/* Tombol Reset */}
            <IconButton
              label="Reset dashboard"
              disabled={!registry || isSaving}
              onClick={() => resetPreferencesMutation.mutate()}
            >
              {resetPreferencesMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <RotateCcw />
              )}
            </IconButton>
          </div>
        </TooltipProvider>
      </header>

      {dashboardRegistryQuery.isPending ? (
        <div className="dashboard-page__loading flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t("loading")}
        </div>
      ) : dashboardRegistryQuery.isError || !registry || !preferences ? (
        <div className="dashboard-page__error rounded-md border border-destructive/30 p-4 text-sm text-destructive">
          <p>{t("loadError")}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => dashboardRegistryQuery.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      ) : (
        <TooltipProvider>
          <DashboardHookSlot
            hooks={registry.hooks}
            registry={registry}
            currentUser={user}
            slot="before-dashboard-content"
          />
          <DndContext
            sensors={sensors}
            collisionDetection={dashboardCollision}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveWidgetId(null)}
          >
            <div className="dashboard-page__layout grid grid-cols-1 gap-4 lg:grid-cols-12">
              {preferences.layout.map((layoutArea) => {
                const area = registry.areas.find(
                  (registeredArea) => registeredArea.key === layoutArea.area
                );

                if (!area) return null;

                const areaWidgets = layoutArea.widgets
                  .map((widgetKey) => widgetsByKey.get(widgetKey))
                  .filter((widget): widget is DashboardWidget =>
                    Boolean(widget)
                  )
                  .filter((widget) => visibleWidgets.has(widget.key));

                return (
                  <section
                    key={area.key}
                    className={cn(
                      "dashboard-area min-w-0 space-y-3",
                      `dashboard-area--${area.key}`,
                      getAreaSpanClass(area)
                    )}
                  >
                    <DashboardAreaDropZone
                      area={area}
                      widgetKeys={areaWidgets.map((widget) => widget.key)}
                      showDropZone={preview}
                    >
                      {areaWidgets.map((widget) => (
                        <DashboardSortableWidget
                          key={widget.key}
                          id={widget.key}
                          disabled={isSaving}
                        >
                          {({
                            setActivatorNodeRef,
                            dragAttributes,
                            dragListeners,
                            isDragging,
                          }) => (
                            <DashboardWidgetCard
                              widget={widget}
                              registry={registry}
                              preferences={preferences}
                              currentUser={user}
                              isSaving={isSaving}
                              isDragging={isDragging}
                              dragHandle={
                                <DashboardDragHandle
                                  label={`Drag ${widget.label}`}
                                  setActivatorNodeRef={setActivatorNodeRef}
                                  dragAttributes={dragAttributes}
                                  dragListeners={dragListeners}
                                />
                              }
                              onMove={handleMove}
                              onVisibilityChange={handleVisibilityChange}
                            />
                          )}
                        </DashboardSortableWidget>
                      ))}
                    </DashboardAreaDropZone>
                    {area.key === "top-12" ? (
                      <DashboardHookSlot
                        hooks={registry.hooks}
                        registry={registry}
                        currentUser={user}
                        slot="after-dashboard-top"
                      />
                    ) : null}
                    {area.key === "right-4" ? (
                      <DashboardHookSlot
                        hooks={registry.hooks}
                        registry={registry}
                        currentUser={user}
                        slot="after-dashboard-half"
                      />
                    ) : null}
                  </section>
                );
              })}
            </div>
            <DragOverlay>
              {activeWidget ? (
                <div className="dashboard-widget dashboard-widget--overlay rounded-md border bg-background px-4 py-3 text-sm font-semibold shadow-lg">
                  {activeWidget.label}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <div aria-live="polite" className="dashboard-page__announcer sr-only">
            {announcement}
          </div>

          <DashboardHookSlot
            hooks={registry.hooks}
            registry={registry}
            currentUser={user}
            slot="after-dashboard-content"
          />
        </TooltipProvider>
      )}
    </div>
  );
}

export default withPageRequiredAuth(AdminPanel, { roles: [RoleEnum.ADMIN] });
