import { eq } from "drizzle-orm";
import { user } from "../../db/schema";

// สาธารณะ: ตรวจลิงก์เปิดใช้งาน แสดงชื่อ/อีเมลแบบปิดบังบางส่วน
export default defineEventHandler(async (event) => {
  const db = useDb();
  if (!db) throw createError({ statusCode: 503, message: "ระบบสมาชิกยังไม่พร้อม" });
  const t = await findActivationToken(db, String(getQuery(event).token || ""));
  if (!t) throw createError({ statusCode: 404, message: "ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาติดต่อแอดมินเพื่อขอลิงก์ใหม่" });
  const [u] = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, t.userId)).limit(1);
  if (!u) throw createError({ statusCode: 404, message: "ไม่พบบัญชี" });
  const needsEmail = isPlaceholderEmail(u.email);
  const [local = "", domain = ""] = u.email.split("@");
  return { name: u.name, needsEmail, maskedEmail: needsEmail ? "" : `${local.slice(0, 2)}***@${domain}` };
});
