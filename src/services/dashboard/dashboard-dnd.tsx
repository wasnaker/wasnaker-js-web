"use client";

import type { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import GripVertical from "lucide-react/dist/esm/icons/grip-vertical";
import { cn } from "@/lib/utils";
import type { DashboardArea } from "@/services/api/services/dashboard";

export const DASHBOARD_COLUMN_PREFIX = "dashboard-column::";

export function getDashboardColumnId(areaKey: string): string {
  return `${DASHBOARD_COLUMN_PREFIX}${areaKey}`;
}

export function isDashboardColumnId(id: string | number): boolean {
  return String(id).startsWith(DASHBOARD_COLUMN_PREFIX);
}

export function getAreaKeyFromDashboardColumnId(id: string | number): string {
  return String(id).slice(DASHBOARD_COLUMN_PREFIX.length);
}

type DashboardAreaDropZoneProps = {
  area: DashboardArea;
  widgetKeys: string[];
  children: ReactNode;
  showDropZone?: boolean;
};

export function DashboardAreaDropZone({
  area,
  widgetKeys,
  children,
  showDropZone = false,
}: DashboardAreaDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: getDashboardColumnId(area.key),
    data: { type: "dashboard-area", area: area.key },
  });

  return (
    <div
      ref={setNodeRef}
      data-dashboard-droppable-area={area.key}
      data-dashboard-area-layout={area.layout}
      className={cn(
        "dashboard-area__widgets grid min-h-24 gap-4 rounded-md transition-colors",
        "dashboard-area__dropzone",
        area.layout === "row" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1",
        widgetKeys.length === 0 &&
          showDropZone &&
          "border border-dashed border-border p-3",
        isOver && "dashboard-area__dropzone--target bg-muted/50"
      )}
    >
      <SortableContext
        id={area.key}
        items={widgetKeys}
        strategy={
          area.layout === "row"
            ? horizontalListSortingStrategy
            : verticalListSortingStrategy
        }
      >
        {children}
      </SortableContext>
    </div>
  );
}

type DashboardSortableWidgetProps = {
  id: string;
  disabled?: boolean;
  children: (props: {
    setActivatorNodeRef: (node: HTMLElement | null) => void;
    dragAttributes: ReturnType<typeof useSortable>["attributes"];
    dragListeners: ReturnType<typeof useSortable>["listeners"];
    isDragging: boolean;
  }) => ReactNode;
};

export function DashboardSortableWidget({
  id,
  disabled,
  children,
}: DashboardSortableWidgetProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      data-dashboard-sortable-widget={id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && "opacity-50")}
    >
      {children({
        setActivatorNodeRef,
        dragAttributes: attributes,
        dragListeners: listeners,
        isDragging,
      })}
    </div>
  );
}

export function DashboardDragHandle({
  label,
  setActivatorNodeRef,
  dragAttributes,
  dragListeners,
}: {
  label: string;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  dragAttributes: ReturnType<typeof useSortable>["attributes"];
  dragListeners: ReturnType<typeof useSortable>["listeners"];
}) {
  return (
    <button
      ref={setActivatorNodeRef}
      type="button"
      className="dashboard-widget__drag-handle inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={label}
      {...dragAttributes}
      {...dragListeners}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  );
}
