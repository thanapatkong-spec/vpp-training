import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { memberProfiles, user } from "../../../db/schema";

const Body = z.object({
  dryRun: z.boolean().default(true),
  rows: z
    .array(z.object({ name: z.string().trim().max(200), email: z.string().trim().max(320), phone: z.string().trim().max(40).optional(), cohort: z.string().trim().max(60).optional() }))
    .max(2000),
});

// แอดมิน: นำเข้าสมาชิกจากรายชื่อ (ชื่อ/อีเมล/เบอร์/รุ่น) สร้างบัญชีที่ยังไม่มีรหัสผ่าน
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const parsed = Body.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 422, message: "ข้อมูลไม่ถูกต้อง" });
  const { rows, dryRun } = parsed.data;
  const db = useDb()!;

  const skipped: { name: string; reason: string }[] = [];
  const seen = new Set<string>();
  const clean: { name: string; email: string; phone: string | null; cohort: string | null }[] = [];
  let noEmail = 0;
  for (const r of rows) {
    const raw = r.email.toLowerCase();
    if (!r.name) { skipped.push({ name: r.email || "(ไม่มีชื่อ)", reason: "ไม่มีชื่อ" }); continue; }
    if (!raw) {
      // ไม่มีอีเมล: สร้างบัญชีที่ยังไม่มีอีเมลจริง (แอดมินเติมอีเมลทีหลังได้) ข้ามถ้ามีชื่อ+รุ่นนี้อยู่แล้ว
      const [dup] = await db.select({ id: user.id }).from(user).innerJoin(memberProfiles, eq(memberProfiles.userId, user.id))
        .where(and(eq(user.name, r.name), eq(memberProfiles.cohort, r.cohort || ""))).limit(1);
      if (dup) skipped.push({ name: r.name, reason: "มีชื่อนี้ในรุ่นเดียวกันอยู่แล้ว" });
      else { noEmail++; clean.push({ name: r.name, email: newPlaceholderEmail(), phone: r.phone || null, cohort: r.cohort || null }); }
      continue;
    }
    const email = raw;
    if (!EMAIL_RE.test(email)) skipped.push({ name: r.name, reason: "อีเมลไม่ถูกต้อง" });
    else if (seen.has(email)) skipped.push({ name: r.name, reason: "อีเมลซ้ำในไฟล์" });
    else {
      seen.add(email);
      clean.push({ name: r.name, email, phone: r.phone || null, cohort: r.cohort || null });
    }
  }
  const existing = clean.length ? await db.select({ email: user.email }).from(user).where(inArray(user.email, clean.map((c) => c.email))) : [];
  const have = new Set(existing.map((e) => e.email));
  const toCreate = clean.filter((c) => {
    if (have.has(c.email)) {
      skipped.push({ name: c.name, reason: "มีบัญชีอยู่แล้ว" });
      return false;
    }
    return true;
  });

  if (!dryRun && toCreate.length) {
    await db.transaction(async (tx) => {
      for (const c of toCreate) {
        const id = randomUUID().replace(/-/g, "");
        await tx.insert(user).values({ id, name: c.name, email: c.email, emailVerified: false });
        await tx.insert(memberProfiles).values({ userId: id, phone: c.phone, cohort: c.cohort });
      }
    });
  }
  return { dryRun, create: toCreate.length, noEmail, skipped };
});
