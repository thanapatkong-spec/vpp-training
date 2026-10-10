import { eq } from "drizzle-orm";
import { certFiles, certificates } from "../../../db/schema";

// แอดมิน: ลบใบประกาศ (กรณีอัปโหลดผิด) ลบไฟล์ PDF ด้วย
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb()!;
  const [c] = await db.select({ fileId: certificates.fileId }).from(certificates).where(eq(certificates.id, getRouterParam(event, "id")!)).limit(1);
  if (!c) throw createError({ statusCode: 404, message: "ไม่พบใบประกาศ" });
  await db.delete(certFiles).where(eq(certFiles.id, c.fileId)); // cascade ลบแถวใบประกาศด้วย
  return { ok: true };
});
