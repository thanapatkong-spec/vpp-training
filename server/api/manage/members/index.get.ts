import { desc, eq, sql } from "drizzle-orm";
import { certificates, memberProfiles, user } from "../../../db/schema";

// แอดมิน: รายชื่อสมาชิกทั้งหมด (สมัครเอง + นำเข้า) พร้อมจำนวนใบประกาศ
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const rows = await useDb()!
    .select({
      id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt,
      phone: memberProfiles.phone, cohort: memberProfiles.cohort, imported: sql<boolean>`${memberProfiles.userId} is not null`,
      certCount: sql<number>`(select count(*)::int from ${certificates} where ${certificates.userId} = ${user.id})`,
    })
    .from(user)
    .leftJoin(memberProfiles, eq(memberProfiles.userId, user.id))
    .orderBy(desc(user.createdAt), user.name);
  return rows.map((r) => ({ ...r, admin: isAdminCandidate(r.email) }));
});
