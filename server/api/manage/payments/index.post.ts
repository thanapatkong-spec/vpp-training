import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { applications, payments, user } from "../../../db/schema";

const Body = z.object({ applicationId: z.string().uuid(), ref: z.string().trim().max(80).optional(), note: z.string().trim().max(300).optional() });

// แอดมิน: บันทึกรับชำระนอกระบบ (โอนตรง/เงินสด) สำหรับใบสมัครที่ผ่านการตรวจสอบแล้ว
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const p = Body.safeParse(await readBody(event));
  if (!p.success) throw createError({ statusCode: 422, message: "ข้อมูลไม่ถูกต้อง" });
  const db = useDb()!;
  const [row] = await db.select({ app: applications, email: user.email }).from(applications).innerJoin(user, eq(user.id, applications.userId)).where(eq(applications.id, p.data.applicationId)).limit(1);
  if (!row || row.app.status !== "approved") throw createError({ statusCode: 409, message: "ใบสมัครนี้ยังไม่ผ่านการตรวจสอบ" });
  const [dup] = await db.select({ id: payments.id }).from(payments).where(and(eq(payments.applicationId, row.app.id), or(eq(payments.status, "paid"), eq(payments.status, "pending")))).limit(1);
  if (dup) throw createError({ statusCode: 409, message: "มีรายการชำระของใบสมัครนี้อยู่แล้ว" });
  if (p.data.ref) {
    const [used] = await db.select({ id: payments.id }).from(payments).where(eq(payments.transRef, p.data.ref)).limit(1);
    if (used) throw createError({ statusCode: 409, message: "เลขอ้างอิงนี้ถูกใช้ไปแล้ว" });
  }
  const amount = await priceOf(event, row.app.cohortId, row.app.packageId);
  const [ins] = await db.insert(payments).values({ applicationId: row.app.id, amount, status: "paid", transRef: p.data.ref || null, verifiedBy: admin.email, note: p.data.note || "บันทึกรับชำระโดยแอดมิน", paidAt: new Date() }).returning({ id: payments.id });
  background(mailPaid(row.app, row.email, amount, p.data.ref || `ADMIN-${ins!.id.slice(0, 8).toUpperCase()}`));
  return { ok: true };
});
