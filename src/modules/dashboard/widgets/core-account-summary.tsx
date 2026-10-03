import { Badge } from "@/components/ui/badge";
import type { DashboardWidgetPanelProps } from "@/services/dashboard/dashboard-panel.registry";

export default function CoreAccountSummaryWidget({
  currentUser,
  renderWidgetHooks,
}: DashboardWidgetPanelProps) {
  const fullName =
    `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim() ||
    currentUser?.email ||
    "Current user";

  return (
    <div className="dashboard-widget__body dashboard-widget__body--account-summary space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="truncate text-2xl font-semibold">{fullName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {currentUser?.email}
          </p>
        </div>
        <Badge variant="secondary">
          {currentUser?.role?.name ?? "Workspace"}
        </Badge>
      </div>
      {renderWidgetHooks("core.account-summary", "after-account-summary")}
    </div>
  );
}
