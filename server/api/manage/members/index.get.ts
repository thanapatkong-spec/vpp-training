import { desc, eq, sql } from "drizzle-orm";
import { account, certificates, memberProfiles, user } from "../../../db/schema";

// แอดมิน: รายชื่อสมาชิกทั้งหมด (สมัครเอง + นำเข้า) พร้อมจำนวนใบประกาศ
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const rows = await useDb()!
    .select({
      id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt,
      phone: memberProfiles.phone, cohort: memberProfiles.cohort, imported: sql<boolean>`coalesce(${memberProfiles.imported}, false)`,
      activated: sql<boolean>`exists (select 1 from ${account} where ${account.userId} = ${user.id})`,
      certCount: sql<number>`(select count(*)::int from ${certificates} where ${certificates.userId} = ${user.id})`,
    })
    .from(user)
    .leftJoin(memberProfiles, eq(memberProfiles.userId, user.id))
    .orderBy(desc(user.createdAt), user.name);
  return rows.map((r) => ({ ...r, placeholder: isPlaceholderEmail(r.email), admin: isAdminCandidate(r.email) }));
});
