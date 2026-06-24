"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, toErrorMessage } from "@/lib/api-client";
import type { ScheduledTask } from "@/types/scheduled-task";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const BATCH_SIZE = 3;
const TASK_DELAY_MS = 1500;
const BATCH_DELAY_MS = 3000;

type RunNowResponse = {
  taskRun?: {
    status?: string;
    telegramStatus?: string | null;
  };
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitBatches(tasks: ScheduledTask[]) {
  const batches: ScheduledTask[][] = [];
  for (let index = 0; index < tasks.length; index += BATCH_SIZE) batches.push(tasks.slice(index, index + BATCH_SIZE));
  return batches;
}

function shortTaskName(task: ScheduledTask) {
  if (task.type === "Sale Monitor") return "สินค้าใหม่/น่าสนใจทั่วโลก";
  if (task.type === "World Cup Recap") return "Football Recap";
  return task.name;
}

function sentStatus(status?: string | null) {
  return status === "sent" || Boolean(status?.startsWith("mock_sent"));
}

export function RunBatchControls() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("พร้อมรันแบบแบ่งชุด");

  async function loadTasks() {
    const data = await apiRequest<ScheduledTask[]>("/api/scheduled-tasks");
    setTasks(data);
  }

  useEffect(() => {
    void loadTasks().catch((error) => setMessage(toErrorMessage(error)));
  }, []);

  const batches = useMemo(() => splitBatches(tasks), [tasks]);

  async function runBatch(group: ScheduledTask[], batchIndex: number, key: string) {
    setLoading(key);
    let sent = 0;
    let failed = 0;
    setMessage(`กำลังรันชุดที่ ${batchIndex + 1}...`);

    for (const [index, task] of group.entries()) {
      try {
        const result = await apiRequest<RunNowResponse>(`/api/scheduled-tasks/${task.id}/run-now`, { method: "POST" });
        if (sentStatus(result.taskRun?.telegramStatus)) sent += 1;
        if (result.taskRun?.status === "failed" || result.taskRun?.telegramStatus?.includes("failed")) failed += 1;
      } catch {
        failed += 1;
      }
      if (index < group.length - 1) await delay(TASK_DELAY_MS);
    }

    setMessage(`ชุดที่ ${batchIndex + 1} เสร็จแล้ว: ส่ง ${sent}/${group.length}, ผิดพลาด ${failed}`);
    setLoading(null);
    await loadTasks();
    return { sent, failed, count: group.length };
  }

  async function runAllBatches() {
    setLoading("all");
    let sent = 0;
    let failed = 0;
    let count = 0;

    for (const [batchIndex, group] of batches.entries()) {
      const result = await runBatch(group, batchIndex, "all");
      sent += result.sent;
      failed += result.failed;
      count += result.count;
      if (batchIndex < batches.length - 1) await delay(BATCH_DELAY_MS);
    }

    setMessage(`รันครบแล้ว: ส่ง ${sent}/${count}, ผิดพลาด ${failed}`);
    setLoading(null);
  }

  return (
    <Card className="relative overflow-hidden border-emerald-300/20 bg-emerald-300/[0.05] p-5 sm:p-6">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="relative space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="green">⚡ Batch Runner</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">ส่งทีละ 3 หัวข้อ</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              ใช้ปุ่มนี้แทน Run All Now เดิม เพื่อลดโอกาส timeout/limit และช่วยให้ข้อความส่งครบกว่า
            </p>
          </div>
          <Button disabled={Boolean(loading)} onClick={() => void runAllBatches()} type="button">
            {loading === "all" ? "กำลังรัน..." : "🚀 Run All แบบชุดละ 3"}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {batches.map((group, index) => (
            <Button key={index} disabled={Boolean(loading)} onClick={() => void runBatch(group, index, `batch-${index}`)} type="button" variant="secondary">
              {loading === `batch-${index}` ? "กำลังรัน..." : `▶ รันชุดที่ ${index + 1} · ${group.length} หัวข้อ`}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {batches.map((group, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs leading-5 text-slate-300">
              <p className="font-black text-cyan-100">ชุดที่ {index + 1}</p>
              <p className="mt-2 line-clamp-3">{group.map(shortTaskName).join(" / ")}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300">{message}</div>
      </div>
    </Card>
  );
}
