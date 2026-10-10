import { eq } from "drizzle-orm";
import { z } from "zod";
import { applications, payments, user } from "../../../db/schema";

const Body = z.object({ action: z.enum(["approve", "reject"]), note: z.string().trim().max(300).optional(), ref: z.string().trim().max(80).optional() });

// แอดมิน: ยืนยัน/ปฏิเสธการชำระด้วยมือ (ตรวจสลิปเอง หรือรับเงินนอกระบบ)
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const p = Body.safeParse(await readBody(event));
  if (!p.success) throw createError({ statusCode: 422, message: "ข้อมูลไม่ถูกต้อง" });
  const db = useDb()!;
  const [row] = await db.select({ pay: payments, app: applications, email: user.email }).from(payments)
    .innerJoin(applications, eq(applications.id, payments.applicationId)).innerJoin(user, eq(user.id, applications.userId))
    .where(eq(payments.id, getRouterParam(event, "id")!)).limit(1);
  if (!row) throw createError({ statusCode: 404, message: "ไม่พบรายการชำระ" });
  if (p.data.action === "approve") {
    const ref = p.data.ref || row.pay.transRef || `ADMIN-${row.pay.id.slice(0, 8).toUpperCase()}`;
    await db.update(payments).set({ status: "paid", paidAt: new Date(), verifiedBy: admin.email, note: p.data.note || row.pay.note, transRef: row.pay.transRef || p.data.ref || null }).where(eq(payments.id, row.pay.id));
    await mailPaid(row.app, row.email, row.pay.amount, ref);
  } else {
    await db.update(payments).set({ status: "rejected", verifiedBy: admin.email, note: p.data.note || "ทีมงานตรวจสลิปแล้วไม่ผ่าน" }).where(eq(payments.id, row.pay.id));
    await sendMail({ to: row.email, subject: "สลิปค่าเรียนไม่ผ่านการตรวจสอบ · VPP", html: `<p>สลิปที่ส่งมาไม่ผ่านการตรวจสอบ${p.data.note ? `: ${p.data.note.replace(/[<>&]/g, "")}` : ""}</p><p>กรุณาแนบสลิปใหม่ในหน้าใบสมัคร หรือตอบกลับอีเมลนี้</p>`, text: `สลิปที่ส่งมาไม่ผ่านการตรวจสอบ${p.data.note ? `: ${p.data.note}` : ""}\nกรุณาแนบสลิปใหม่ในหน้าใบสมัคร หรือตอบกลับอีเมลนี้` });
  }
  return { ok: true };
});
