import { eq } from "drizzle-orm";
import { z } from "zod";
import { applications, user } from "../../../../db/schema";

const Body = z.object({ result: z.enum(["passed", "failed", "pending"]), note: z.string().trim().max(1000).optional() });

// แอดมิน: บันทึกผลตรวจคุณสมบัติจากสัตวแพทยสภา (ใบสมัครที่เอกสารผ่านแล้ว)
// passed = เปิดให้ชำระค่าเรียน + อีเมลแจ้งให้ชำระภายใน 7 วัน · failed = แจ้งผู้สมัคร · pending = ยกเลิกผล (กลับเป็นรอผล)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const p = Body.safeParse(await readBody(event));
  if (!p.success) throw createError({ statusCode: 422, message: "ข้อมูลไม่ถูกต้อง" });
  const db = useDb()!;
  const [row] = await db.select({ app: applications, email: user.email }).from(applications).innerJoin(user, eq(user.id, applications.userId)).where(eq(applications.id, id)).limit(1);
  if (!row) throw createError({ statusCode: 404, message: "ไม่พบใบสมัคร" });
  if (row.app.status !== "approved") throw createError({ statusCode: 409, message: "บันทึกผลตรวจคุณสมบัติได้หลังเอกสารผ่านการตรวจสอบ" });
  const result = p.data.result === "pending" ? null : p.data.result;
  await db.update(applications).set({ councilCheck: result, councilNote: p.data.note || null, councilCheckedAt: result ? new Date() : null, updatedAt: new Date() }).where(eq(applications.id, id));
  if (result && result !== row.app.councilCheck) {
    const amount = (await tuitionDue(event, row.app.cohortId, row.app.packageId)).total;
    background(mailCouncilChecked(row.app, row.email, result === "passed", amount, p.data.note));
  }
  return { ok: true };
});
