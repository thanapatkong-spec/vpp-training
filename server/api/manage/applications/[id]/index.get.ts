import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { applicationFiles, applications, payments, user } from "../../../../db/schema";

// แอดมิน: รายละเอียดใบสมัคร + รายการเอกสาร
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const db = useDb()!;
  const [app] = await db.select({ app: applications, email: user.email }).from(applications).innerJoin(user, eq(user.id, applications.userId)).where(eq(applications.id, id)).limit(1);
  if (!app) throw createError({ statusCode: 404, message: "ไม่พบใบสมัคร" });
  const files = await db
    .select({ id: applicationFiles.id, kind: applicationFiles.kind, name: applicationFiles.name, contentType: applicationFiles.contentType, size: applicationFiles.size, status: applicationFiles.status, note: applicationFiles.note })
    .from(applicationFiles)
    .where(eq(applicationFiles.applicationId, id));
  const pays = await db
    .select({ id: payments.id, amount: payments.amount, status: payments.status, note: payments.note, transRef: payments.transRef, verifiedBy: payments.verifiedBy, createdAt: payments.createdAt, paidAt: payments.paidAt, hasSlip: payments.slipType })
    .from(payments).where(eq(payments.applicationId, id)).orderBy(desc(payments.createdAt));
  return { ...app.app, email: app.email, files, payments: pays, amount: priceOf(app.app.packageId) };
});
