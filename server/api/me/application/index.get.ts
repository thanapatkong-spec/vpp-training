import { desc, eq } from "drizzle-orm";
import { applicationFiles, applications } from "../../../db/schema";

// ใบสมัครล่าสุดของฉัน + รายการเอกสาร (ไม่ส่งเนื้อไฟล์)
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const db = useDb()!;
  const [app] = await db.select().from(applications).where(eq(applications.userId, u.id)).orderBy(desc(applications.createdAt)).limit(1);
  if (!app) return null;
  const files = await db
    .select({ id: applicationFiles.id, kind: applicationFiles.kind, name: applicationFiles.name, status: applicationFiles.status, note: applicationFiles.note })
    .from(applicationFiles)
    .where(eq(applicationFiles.applicationId, app.id));
  return { ...app, files };
});
