import { and, eq, notExists } from "drizzle-orm";
import { account, memberProfiles, user } from "../../../db/schema";

// แอดมิน: สร้างลิงก์เปิดใช้งานให้สมาชิกที่นำเข้าและยังไม่เปิดใช้งาน (ทั้งหมด หรือเฉพาะรุ่น) ไว้ส่งทีเดียว
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { cohort } = ((await readBody<{ cohort?: string }>(event)) || {}) as { cohort?: string };
  const db = useDb()!;
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, phone: memberProfiles.phone, cohort: memberProfiles.cohort })
    .from(user)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, user.id))
    .where(and(eq(memberProfiles.imported, true), notExists(db.select({ x: account.id }).from(account).where(eq(account.userId, user.id))), cohort ? eq(memberProfiles.cohort, cohort) : undefined))
    .orderBy(memberProfiles.cohort, user.name);
  const out = [];
  for (const r of rows) {
    if (isAdminCandidate(r.email)) continue;
    const l = await createActivationLink(event, db, r.id);
    out.push({ name: r.name, cohort: r.cohort, phone: r.phone, email: isPlaceholderEmail(r.email) ? "" : r.email, url: l.url });
  }
  return out;
});
