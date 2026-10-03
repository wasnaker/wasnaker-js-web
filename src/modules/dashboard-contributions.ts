import { registerDashboardWidgetPanel } from "@/services/dashboard/dashboard-panel.registry";
import CoreAccountSummaryWidget from "./dashboard/widgets/core-account-summary";
import CorePlatformStatusWidget from "./dashboard/widgets/core-platform-status";
import CorePortingProgressWidget from "./dashboard/widgets/core-porting-progress";

registerDashboardWidgetPanel("core.account-summary", CoreAccountSummaryWidget);
registerDashboardWidgetPanel("core.platform-status", CorePlatformStatusWidget);
registerDashboardWidgetPanel(
  "core.porting-progress",
  CorePortingProgressWidget
);
