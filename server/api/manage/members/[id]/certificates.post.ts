import { eq } from "drizzle-orm";
import { certFiles, certificates, user } from "../../../../db/schema";

const MAX = 4 * 1024 * 1024;

// แอดมิน: ออกใบประกาศให้สมาชิกโดยตรง (multipart: file, title?, certNo?, issuedOn?)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const parts = (await readMultipartFormData(event)) ?? [];
  const f: Record<string, string> = {};
  let file: (typeof parts)[number] | undefined;
  for (const p of parts) {
    if (p.name === "file") file = p;
    else if (p.name) f[p.name] = p.data.toString("utf8").trim();
  }
  if (!file || !file.data.length) throw createError({ statusCode: 422, message: "กรุณาแนบไฟล์ PDF ใบประกาศ" });
  if (file.data.length > MAX) throw createError({ statusCode: 422, message: "ไฟล์ต้องไม่เกิน 4MB" });
  if (file.data.subarray(0, 5).toString("latin1") !== "%PDF-") throw createError({ statusCode: 422, message: "ไฟล์ต้องเป็น PDF" });
  if (f.issuedOn && !/^\d{4}-\d{2}-\d{2}$/.test(f.issuedOn)) throw createError({ statusCode: 422, message: "วันที่ออกใบไม่ถูกต้อง" });

  const db = useDb()!;
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
  if (!u) throw createError({ statusCode: 404, message: "ไม่พบสมาชิก" });
  await db.transaction(async (tx) => {
    const [stored] = await tx
      .insert(certFiles)
      .values({ name: file!.filename || "certificate.pdf", contentType: "application/pdf", size: file!.data.length, data: file!.data })
      .returning({ id: certFiles.id });
    if (!stored) throw createError({ statusCode: 500, message: "บันทึกไฟล์ไม่สำเร็จ" });
    await tx.insert(certificates).values({
      userId: id,
      title: f.title || "ประกาศนียบัตรผู้ช่วยสัตวแพทย์ด้านการพยาบาลสัตว์",
      certNo: f.certNo || null,
      issuedOn: f.issuedOn || null,
      fileId: stored.id,
    });
  });
  return { ok: true };
});
