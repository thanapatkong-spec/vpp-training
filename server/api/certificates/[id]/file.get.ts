import { eq } from "drizzle-orm";
import { certFiles, certificates } from "../../../db/schema";

// ดาวน์โหลดใบประกาศ: เจ้าของใบหรือแอดมินเท่านั้น
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const id = getRouterParam(event, "id")!;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });

  const [row] = await useDb()!
    .select({ userId: certificates.userId, certNo: certificates.certNo, name: certFiles.name, type: certFiles.contentType, data: certFiles.data })
    .from(certificates)
    .innerJoin(certFiles, eq(certFiles.id, certificates.fileId))
    .where(eq(certificates.id, id))
    .limit(1);
  if (!row || (row.userId !== u.id && !u.isAdmin)) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });

  setHeader(event, "Content-Type", row.type);
  setHeader(event, "Content-Disposition", `attachment; filename="certificate-${id.slice(0, 8)}.pdf"`);
  setHeader(event, "Cache-Control", "private, no-store");
  return row.data;
});
