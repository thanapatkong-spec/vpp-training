import { eq } from "drizzle-orm";
import { certFiles, certificates, user } from "../../../../db/schema";

// แอดมิน: แนบไฟล์/ใบประกาศให้สมาชิกโดยตรง (multipart: file, title, certNo?, issuedOn?)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const a = await readAttachment(event);
  if (!a.fields.title) throw createError({ statusCode: 422, message: "กรุณาใส่ชื่อไฟล์ที่แสดง" });

  const db = useDb()!;
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
  if (!u) throw createError({ statusCode: 404, message: "ไม่พบสมาชิก" });
  await db.transaction(async (tx) => {
    const [stored] = await tx.insert(certFiles).values({ name: a.name, contentType: a.contentType, size: a.data.length, data: a.data }).returning({ id: certFiles.id });
    if (!stored) throw createError({ statusCode: 500, message: "บันทึกไฟล์ไม่สำเร็จ" });
    await tx.insert(certificates).values({ userId: id, title: a.fields.title, certNo: a.fields.certNo || null, issuedOn: a.fields.issuedOn || null, fileId: stored.id });
  });
  return { ok: true };
});
