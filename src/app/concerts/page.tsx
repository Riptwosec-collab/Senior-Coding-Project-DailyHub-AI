import type { Metadata } from "next";
import { ConcertScheduleView } from "@/components/concerts/ConcertScheduleView";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Concert & Festival Guide | NimbusDaily",
  description: "NimbusDaily monthly Thailand concert and festival guide with indoor hall and outdoor open-air event listings.",
};

export default function ConcertsPage() {
  return (
    <AppShell>
      <ConcertScheduleView />
    </AppShell>
  );
}
