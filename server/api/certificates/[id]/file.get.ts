import { eq } from "drizzle-orm";
import { certFiles, certificates } from "../../../db/schema";

// ดาวน์โหลดใบประกาศ: เจ้าของใบหรือแอดมินเท่านั้น
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const id = getRouterParam(event, "id")!;
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });

  const [row] = await useDb()!
    .select({ userId: certificates.userId, title: certificates.title, certNo: certificates.certNo, name: certFiles.name, type: certFiles.contentType, data: certFiles.data })
    .from(certificates)
    .innerJoin(certFiles, eq(certFiles.id, certificates.fileId))
    .where(eq(certificates.id, id))
    .limit(1);
  if (!row || (row.userId !== u.id && !u.isAdmin)) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });

  setHeader(event, "Content-Type", row.type);
  const ext = row.type === "application/pdf" ? "pdf" : row.type === "image/png" ? "png" : "jpg";
  // ชื่อไฟล์ตอนดาวน์โหลดเป็น ASCII เพื่อให้ทุกเบราว์เซอร์ตั้งชื่อถูก (ชื่อภาษาไทยแสดงในหน้าบัญชี)
  const slug = (row.title || "").normalize("NFKD").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  setHeader(event, "Content-Disposition", `attachment; filename="${slug ? `${slug}-${id.slice(0, 4)}` : `certificate-${id.slice(0, 8)}`}.${ext}"`);
  setHeader(event, "Cache-Control", "private, no-store");
  return row.data;
});
