import { DataLibraryView } from "@/components/data-library/DataLibraryView";
import { AppShell } from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default function DataLibraryPage() {
  return (
    <AppShell>
      <DataLibraryView />
    </AppShell>
  );
}
