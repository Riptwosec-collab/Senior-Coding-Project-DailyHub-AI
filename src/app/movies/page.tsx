import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { MovieScheduleView } from "@/components/movies/MovieScheduleView";

export const metadata: Metadata = {
  title: "Thai Cinema + Netflix Watchlist | NimbusDaily",
  description: "NimbusDaily monthly Thai cinema, Netflix, and series watchlist with platform filters.",
};

export default function MoviesPage() {
  return (
    <AppShell>
      <MovieScheduleView />
    </AppShell>
  );
}
