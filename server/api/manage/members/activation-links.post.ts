import { and, eq, notExists } from "drizzle-orm";
import { account, memberProfiles, user } from "../../../db/schema";

// แอดมิน: สร้างลิงก์เปิดใช้งานให้สมาชิกที่นำเข้าและยังไม่เปิดใช้งาน (ทั้งหมด หรือเฉพาะรุ่น)
// send: true = ส่งลิงก์ทางอีเมลให้ทุกคนที่มีอีเมล (คนที่ไม่มีอีเมลยังได้ลิงก์ในผลลัพธ์ไว้ส่งทาง LINE)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { cohort, send } = ((await readBody<{ cohort?: string; send?: boolean }>(event)) || {}) as { cohort?: string; send?: boolean };
  if (send && !mailerEnabled()) throw createError({ statusCode: 503, message: "ยังไม่ได้ตั้งค่าอีเมลผู้ส่ง (SMTP_USER/SMTP_PASS)" });
  const db = useDb()!;
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, phone: memberProfiles.phone, cohort: memberProfiles.cohort })
    .from(user)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, user.id))
    .where(and(eq(memberProfiles.imported, true), notExists(db.select({ x: account.id }).from(account).where(eq(account.userId, user.id))), cohort ? eq(memberProfiles.cohort, cohort) : undefined))
    .orderBy(memberProfiles.cohort, user.name);
  return inBatches(rows.filter((r) => !isAdminCandidate(r.email)), 3, async (r) => {
    const l = await createActivationLink(event, db, r.id);
    const email = isPlaceholderEmail(r.email) ? "" : r.email;
    const sent = send && email ? await mailActivation(r.name, email, l.url, l.expiresAt) : false;
    return { name: r.name, cohort: r.cohort, phone: r.phone, email, url: l.url, sent };
  });
});
