import type { ContentLanguage } from "./translation";

export type ExecutionLogStatus = "success" | "failed";

export interface ExecutionLog {
  id: string;
  taskId: string;
  taskName: string;
  status: ExecutionLogStatus;
  originalContent: string;
  translatedContent: string;
  language: ContentLanguage;
  telegramSent: boolean;
  startedAt: string;
  finishedAt: string;
  error?: string;
}
