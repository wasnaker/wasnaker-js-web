import { Badge } from "@/components/ui/badge";
import type { DashboardWidgetPanelProps } from "@/services/dashboard/dashboard-panel.registry";

export default function CorePlatformStatusWidget({
  registry,
}: DashboardWidgetPanelProps) {
  return (
    <div className="dashboard-widget__body dashboard-widget__body--platform-status grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
      <div className="dashboard-stat rounded-md border p-3">
        <p className="text-xs text-muted-foreground">Areas</p>
        <p className="text-2xl font-semibold">{registry.areas.length}</p>
      </div>
      <div className="dashboard-stat rounded-md border p-3">
        <p className="text-xs text-muted-foreground">Widgets</p>
        <p className="text-2xl font-semibold">{registry.widgets.length}</p>
      </div>
      <div className="dashboard-stat rounded-md border p-3">
        <p className="text-xs text-muted-foreground">Hooks</p>
        <div className="mt-1">
          <Badge variant="outline">{registry.hooks.length}</Badge>
        </div>
      </div>
    </div>
  );
}
