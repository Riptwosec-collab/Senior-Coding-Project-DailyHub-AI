import { DashboardControlView } from "@/components/dashboard/DashboardControlView";
import { AppShell } from "@/components/layout/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardControlView />
    </AppShell>
  );
}
