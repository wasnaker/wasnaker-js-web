import { Badge } from "@/components/ui/badge";

export default function CorePortingProgressWidget() {
  return (
    <div className="dashboard-widget__body dashboard-widget__body--porting-progress space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Core only</Badge>
        <Badge variant="outline">Dashboard infrastructure</Badge>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Perfex-compatible layout areas are active.</p>
        <p>Business widgets stay with their future modules.</p>
      </div>
    </div>
  );
}
