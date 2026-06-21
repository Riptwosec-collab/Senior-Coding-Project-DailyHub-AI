"use client";

import { useState, type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <LanguageProvider>
      <ToastProvider>
        <div className="min-h-screen overflow-hidden bg-[#050816] text-slate-100">
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute right-[-8%] top-[12%] h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="absolute bottom-[-18%] left-[28%] h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_36%),linear-gradient(180deg,rgba(15,23,42,0.12),rgba(2,6,23,0.92))]" />
          </div>

          <div className="flex min-h-screen">
            <Sidebar />

            {isSidebarOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                <button
                  aria-label="Close navigation menu"
                  className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                  onClick={() => setIsSidebarOpen(false)}
                  type="button"
                />
                <div className="relative h-full w-[min(20rem,86vw)]">
                  <Sidebar mobile onNavigate={() => setIsSidebarOpen(false)} />
                </div>
              </div>
            )}

            <main className="min-w-0 flex-1 lg:pl-72">
              <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
              <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </LanguageProvider>
  );
}
