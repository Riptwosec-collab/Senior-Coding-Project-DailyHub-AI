import { DashboardControlView } from "@/components/dashboard/DashboardControlView";
import { RunBatchControls } from "@/components/dashboard/RunBatchControls";
import { AppShell } from "@/components/layout/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <DashboardControlView />
        <RunBatchControls />
      </div>
    </AppShell>
  );
}
