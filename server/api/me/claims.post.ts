import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { certClaims } from "../../db/schema";

const schema = z.object({
  fullName: z.string({ message: "กรุณากรอกชื่อ-นามสกุล" }).trim().min(2, "กรุณากรอกชื่อ-นามสกุล").max(120),
  cohort: z.string({ message: "กรุณาระบุรุ่น" }).trim().min(1, "กรุณาระบุรุ่น").max(60),
  completedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง").optional().or(z.literal("")),
  note: z.string().trim().max(500).optional(),
});

// สมาชิกยื่นคำขอว่า "เคยเรียน" เพื่อให้แอดมินตรวจและอนุมัติ
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const parsed = schema.safeParse(await readBody(event));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    throw createError({ statusCode: 422, message: "ข้อมูลไม่ครบถ้วน", data: { fieldErrors } });
  }
  const db = useDb()!;
  const [pending] = await db.select({ n: count() }).from(certClaims).where(and(eq(certClaims.userId, u.id), eq(certClaims.status, "pending")));
  if ((pending?.n ?? 0) >= 3) throw createError({ statusCode: 429, message: "มีคำขอที่รอตรวจครบ 3 รายการแล้ว กรุณารอแอดมินตรวจสอบก่อน" });

  const d = parsed.data;
  const [row] = await db
    .insert(certClaims)
    .values({ userId: u.id, fullName: d.fullName, cohort: d.cohort, completedOn: d.completedOn || null, note: d.note || null })
    .returning();
  return row;
});
