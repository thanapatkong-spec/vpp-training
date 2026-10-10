import { eq } from "drizzle-orm";
import { memberProfiles, user } from "../../../../db/schema";

// แอดมิน: ลบสมาชิกที่นำเข้า (เฉพาะบัญชีที่มีข้อมูลนำเข้า และไม่ใช่อีเมลแอดมิน)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id") || "";
  const db = useDb()!;
  const [row] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .innerJoin(memberProfiles, eq(memberProfiles.userId, user.id))
    .where(eq(user.id, id))
    .limit(1);
  if (!row) throw createError({ statusCode: 404, message: "ไม่พบสมาชิก" });
  if (isAdminCandidate(row.email)) throw createError({ statusCode: 400, message: "ลบบัญชีแอดมินไม่ได้" });
  await db.delete(user).where(eq(user.id, id));
  return { ok: true };
});
