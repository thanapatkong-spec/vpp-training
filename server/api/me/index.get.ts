import { eq } from "drizzle-orm";
import { memberProfiles } from "../../db/schema";

// ข้อมูลผู้ใช้ปัจจุบัน + สถานะแอดมิน + โปรไฟล์
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const [prof] = await useDb()!.select({ phone: memberProfiles.phone, cohort: memberProfiles.cohort }).from(memberProfiles).where(eq(memberProfiles.userId, u.id)).limit(1);
  return { id: u.id, name: u.name, email: u.email, emailVerified: u.emailVerified, isAdmin: u.isAdmin, adminCandidate: isAdminCandidate(u.email), phone: prof?.phone ?? "", cohort: prof?.cohort ?? "" };
});
