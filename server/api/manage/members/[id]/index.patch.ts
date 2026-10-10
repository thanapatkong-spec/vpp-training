import { eq } from "drizzle-orm";
import { z } from "zod";
import { memberProfiles, user } from "../../../../db/schema";

const Body = z.object({
  name: z.string().trim().min(1, "กรุณาระบุชื่อ").max(200),
  email: z.string().trim().toLowerCase().max(320).optional(),
  phone: z.string().trim().max(40).optional(),
  cohort: z.string().trim().max(60).optional(),
});

// แอดมิน: แก้โปรไฟล์สมาชิก (ชื่อ/อีเมล/เบอร์/รุ่น)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const p = Body.safeParse(await readBody(event));
  if (!p.success) throw createError({ statusCode: 422, message: p.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" });
  const b = p.data;
  const db = useDb()!;
  const [cur] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  if (!cur) throw createError({ statusCode: 404, message: "ไม่พบสมาชิก" });

  const set: Partial<typeof user.$inferInsert> = { name: b.name, updatedAt: new Date() };
  if (b.email && b.email !== cur.email) {
    if (!EMAIL_RE.test(b.email)) throw createError({ statusCode: 422, message: "อีเมลไม่ถูกต้อง" });
    if (isAdminCandidate(cur.email) || isAdminCandidate(b.email)) throw createError({ statusCode: 400, message: "แก้อีเมลของบัญชีแอดมินไม่ได้" });
    const [dup] = await db.select({ id: user.id }).from(user).where(eq(user.email, b.email)).limit(1);
    if (dup) throw createError({ statusCode: 409, message: "อีเมลนี้มีบัญชีอยู่แล้ว" });
    set.email = b.email;
    set.emailVerified = false;
  }
  await db.transaction(async (tx) => {
    await tx.update(user).set(set).where(eq(user.id, id));
    await tx
      .insert(memberProfiles)
      .values({ userId: id, phone: b.phone || null, cohort: b.cohort || null, imported: false })
      .onConflictDoUpdate({ target: memberProfiles.userId, set: { phone: b.phone || null, cohort: b.cohort || null } });
  });
  return { ok: true };
});
