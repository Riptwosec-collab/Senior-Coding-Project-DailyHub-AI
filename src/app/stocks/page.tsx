import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { StocksHubView } from "@/components/stocks/StocksHubView";

export const metadata: Metadata = {
  title: "Stocks Hub | NimbusDaily",
  description: "NimbusDaily educational stock, ETF, crypto, and portfolio research dashboard.",
};

export default function StocksPage() {
  return (
    <AppShell>
      <StocksHubView />
    </AppShell>
  );
}
