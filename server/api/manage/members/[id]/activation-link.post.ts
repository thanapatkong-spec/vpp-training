import { eq } from "drizzle-orm";
import { user } from "../../../../db/schema";

// แอดมิน: สร้างลิงก์เปิดใช้งานบัญชีให้สมาชิกคนเดียว — send: true = ส่งลิงก์ไปที่อีเมลของบัญชีด้วย
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const { send } = ((await readBody<{ send?: boolean }>(event).catch(() => null)) || {}) as { send?: boolean };
  const db = useDb()!;
  const [u] = await db.select({ id: user.id, name: user.name, email: user.email }).from(user).where(eq(user.id, id)).limit(1);
  if (!u) throw createError({ statusCode: 404, message: "ไม่พบสมาชิก" });
  if (isAdminCandidate(u.email)) throw createError({ statusCode: 400, message: "บัญชีแอดมินไม่ใช้ลิงก์เปิดใช้งาน" });
  if (send && isPlaceholderEmail(u.email)) throw createError({ statusCode: 422, message: "สมาชิกนี้ยังไม่มีอีเมล กรุณาใส่อีเมลแล้วบันทึกก่อน" });
  if (send && !mailerEnabled()) throw createError({ statusCode: 503, message: "ยังไม่ได้ตั้งค่าอีเมลผู้ส่ง (SMTP_USER/SMTP_PASS)" });
  const r = await createActivationLink(event, db, id);
  const sent = send ? await mailActivation(u.name, u.email, r.url, r.expiresAt) : false;
  if (send && !sent) throw createError({ statusCode: 502, message: "ส่งอีเมลไม่สำเร็จ ลองใหม่ หรือคัดลอกลิงก์ส่งเอง", data: { url: r.url } });
  return { url: r.url, expiresAt: r.expiresAt, sentTo: sent ? u.email : null };
});
