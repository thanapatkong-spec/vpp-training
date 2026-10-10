import { eq } from "drizzle-orm";
import { user } from "../../../../db/schema";

// แอดมิน: สร้างลิงก์เปิดใช้งานบัญชีให้สมาชิกคนเดียว (ส่งให้ทาง LINE/อีเมลเอง)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const db = useDb()!;
  const [u] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.id, id)).limit(1);
  if (!u) throw createError({ statusCode: 404, message: "ไม่พบสมาชิก" });
  if (isAdminCandidate(u.email)) throw createError({ statusCode: 400, message: "บัญชีแอดมินไม่ใช้ลิงก์เปิดใช้งาน" });
  const r = await createActivationLink(event, db, id);
  return { url: r.url, expiresAt: r.expiresAt };
});
