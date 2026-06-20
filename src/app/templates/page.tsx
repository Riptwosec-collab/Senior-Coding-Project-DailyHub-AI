import { AppShell } from "@/components/layout/AppShell";
import { TaskTemplatesView } from "@/components/templates/TaskTemplatesView";

export default function TemplatesPage() {
  return (
    <AppShell>
      <TaskTemplatesView />
    </AppShell>
  );
}
