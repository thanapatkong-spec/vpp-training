import { desc, eq } from "drizzle-orm";
import { memberProfiles, user } from "../../../db/schema";

// แอดมิน: รายชื่อสมาชิกที่นำเข้า
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  return useDb()!
    .select({ id: user.id, name: user.name, email: user.email, phone: memberProfiles.phone, cohort: memberProfiles.cohort, importedAt: memberProfiles.importedAt })
    .from(memberProfiles)
    .innerJoin(user, eq(user.id, memberProfiles.userId))
    .orderBy(desc(memberProfiles.importedAt), user.name);
});
