import type { Metadata } from "next";
import { ConcertScheduleView } from "@/components/concerts/ConcertScheduleView";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Concert Schedule | NimbusDaily",
  description: "NimbusDaily concert schedule with monthly The Street Ratchada and Volume Livehouse event listings.",
};

export default function ConcertsPage() {
  return (
    <AppShell>
      <ConcertScheduleView />
    </AppShell>
  );
}
