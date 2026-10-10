import { eq } from "drizzle-orm";
import { applicationFiles, applications } from "../../../db/schema";

// เปิดเอกสารใบสมัคร: เจ้าของใบสมัครหรือแอดมินเท่านั้น
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const id = getRouterParam(event, "id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });
  const [row] = await useDb()!
    .select({ userId: applications.userId, kind: applicationFiles.kind, type: applicationFiles.contentType, data: applicationFiles.data })
    .from(applicationFiles)
    .innerJoin(applications, eq(applications.id, applicationFiles.applicationId))
    .where(eq(applicationFiles.id, id))
    .limit(1);
  if (!row || (row.userId !== u.id && !u.isAdmin)) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });
  const ext = row.type === "application/pdf" ? "pdf" : row.type === "image/png" ? "png" : "jpg";
  setHeader(event, "Content-Type", row.type);
  setHeader(event, "Content-Disposition", `inline; filename="${row.kind}-${id.slice(0, 6)}.${ext}"`);
  setHeader(event, "Cache-Control", "private, no-store");
  setHeader(event, "X-Content-Type-Options", "nosniff");
  return row.data;
});
