import { eq } from "drizzle-orm";
import { applications, payments } from "../../../db/schema";

// เปิดรูปสลิป: เจ้าของหรือแอดมิน
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const id = getRouterParam(event, "id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });
  const [row] = await useDb()!
    .select({ userId: applications.userId, type: payments.slipType, data: payments.slipData })
    .from(payments)
    .innerJoin(applications, eq(applications.id, payments.applicationId))
    .where(eq(payments.id, id))
    .limit(1);
  if (!row || !row.data || (row.userId !== u.id && !u.isAdmin)) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });
  setHeader(event, "Content-Type", row.type || "image/jpeg");
  setHeader(event, "Cache-Control", "private, no-store");
  setHeader(event, "X-Content-Type-Options", "nosniff");
  return row.data;
});
