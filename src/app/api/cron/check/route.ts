import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  const startedAt = new Date();

  // TODO: ใส่งาน scheduled jobs ของ DailyHub ตรงนี้
  // ตัวอย่าง:
  // await checkNews();
  // await checkEmailMonitor();
  // await checkSaleMonitor();
  // await sendTelegramDigest();
  // await updateDashboardResults();

  return NextResponse.json({
    ok: true,
    message: "DailyHub cron job executed successfully",
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
  });
}
