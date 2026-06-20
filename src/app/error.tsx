"use client";

import { ErrorState } from "@/components/ui/ErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <ErrorState
        title="Something went wrong"
        description={error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"}
        requestId={error.digest ?? null}
        onRetry={reset}
      />
    </main>
  );
}
