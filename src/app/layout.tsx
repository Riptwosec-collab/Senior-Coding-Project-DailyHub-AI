import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nimbus Daily",
  description: "Scheduled GPT automation dashboard with AI, Telegram, and full data library integrations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="nimbus-depth-space">{children}</body>
    </html>
  );
}
