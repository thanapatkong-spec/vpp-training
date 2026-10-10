import { eq } from "drizzle-orm";
import { z } from "zod";
import { memberProfiles, user } from "../../db/schema";

const Body = z.object({ name: z.string().trim().min(1, "กรุณาระบุชื่อ").max(200), phone: z.string().trim().max(40).optional() });

// สมาชิกแก้โปรไฟล์ของตัวเอง (ชื่อ/เบอร์โทร) อีเมลและรุ่นแก้ผ่านแอดมิน
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const p = Body.safeParse(await readBody(event));
  if (!p.success) throw createError({ statusCode: 422, message: p.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" });
  const db = useDb()!;
  await db.transaction(async (tx) => {
    await tx.update(user).set({ name: p.data.name, updatedAt: new Date() }).where(eq(user.id, u.id));
    await tx
      .insert(memberProfiles)
      .values({ userId: u.id, phone: p.data.phone || null, imported: false })
      .onConflictDoUpdate({ target: memberProfiles.userId, set: { phone: p.data.phone || null } });
  });
  return { ok: true };
});
