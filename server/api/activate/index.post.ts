import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { account, claimTokens, user } from "../../db/schema";

const Body = z.object({
  token: z.string().max(100),
  password: z.string().min(8, "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร").max(128),
  email: z.string().trim().toLowerCase().max(320).optional(),
  consent: z.literal(true, { message: "กรุณายอมรับนโยบายความเป็นส่วนตัว" }),
});

// สาธารณะ: เจ้าของบัญชีใช้ลิงก์เปิดใช้งาน ตั้งรหัสผ่าน (และอีเมลถ้ายังไม่มี) แล้วเข้าสู่ระบบด้วยอีเมล+รหัสผ่านได้
export default defineEventHandler(async (event) => {
  const db = useDb();
  if (!db) throw createError({ statusCode: 503, message: "ระบบสมาชิกยังไม่พร้อม" });
  const p = Body.safeParse(await readBody(event));
  if (!p.success) throw createError({ statusCode: 422, message: p.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" });
  const b = p.data;
  const t = await findActivationToken(db, b.token);
  if (!t) throw createError({ statusCode: 404, message: "ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาติดต่อแอดมินเพื่อขอลิงก์ใหม่" });
  const [u] = await db.select().from(user).where(eq(user.id, t.userId)).limit(1);
  if (!u || isAdminCandidate(u.email)) throw createError({ statusCode: 404, message: "ไม่พบบัญชี" });

  const set: Partial<typeof user.$inferInsert> = { updatedAt: new Date() };
  if (isPlaceholderEmail(u.email)) {
    if (!b.email || !EMAIL_RE.test(b.email)) throw createError({ statusCode: 422, message: "กรุณาระบุอีเมลที่ใช้เข้าสู่ระบบ" });
    if (isAdminCandidate(b.email)) throw createError({ statusCode: 422, message: "ใช้อีเมลนี้ไม่ได้" });
    const [dup] = await db.select({ id: user.id }).from(user).where(eq(user.email, b.email)).limit(1);
    if (dup) throw createError({ statusCode: 409, message: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาใช้อีเมลอื่น หรือติดต่อแอดมิน" });
    set.email = b.email;
  } else {
    set.emailVerified = true; // อีเมลที่แอดมินบันทึกไว้ + ลิงก์ส่งถึงตัวบุคคล
  }
  const hash = await (await useAuth().$context).password.hash(b.password);

  await db.transaction(async (tx) => {
    await tx.update(claimTokens).set({ usedAt: new Date() }).where(eq(claimTokens.id, t.id));
    await tx.update(user).set(set).where(eq(user.id, u.id));
    await tx.delete(account).where(eq(account.userId, u.id)); // เริ่มใหม่ (กรณีเคยมีบัญชีเชื่อมไว้)
    await tx.insert(account).values({ id: randomUUID().replace(/-/g, ""), accountId: u.id, providerId: "credential", userId: u.id, password: hash });
  });
  return { ok: true };
});
