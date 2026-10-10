import { desc, eq } from "drizzle-orm";
import { promptPayPayload } from "#shared/promptpay";
import { applicationFiles, applications, payments } from "../../../db/schema";

// ใบสมัครล่าสุดของฉัน + เอกสาร + การชำระเงิน (ไม่ส่งเนื้อไฟล์)
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const db = useDb()!;
  const [app] = await db.select().from(applications).where(eq(applications.userId, u.id)).orderBy(desc(applications.createdAt)).limit(1);
  if (!app) return null;
  const files = await db
    .select({ id: applicationFiles.id, kind: applicationFiles.kind, name: applicationFiles.name, status: applicationFiles.status, note: applicationFiles.note })
    .from(applicationFiles)
    .where(eq(applicationFiles.applicationId, app.id));
  const pays = await db
    .select({ id: payments.id, amount: payments.amount, status: payments.status, note: payments.note, transRef: payments.transRef, createdAt: payments.createdAt, paidAt: payments.paidAt })
    .from(payments)
    .where(eq(payments.applicationId, app.id))
    .orderBy(desc(payments.createdAt));
  const amount = priceOf(app.packageId);
  const ppId = process.env.PROMPTPAY_ID || "";
  return {
    ...app,
    nationalId: undefined,
    files,
    payment: {
      amount,
      paid: pays.some((p) => p.status === "paid"),
      pending: pays.some((p) => p.status === "pending"),
      history: pays,
      promptpay: app.status === "approved" && ppId ? { payload: promptPayPayload(ppId, amount), name: process.env.PROMPTPAY_NAME || "บริษัท ดร.จอห์นเพ็ท จำกัด" } : null,
      autoCheck: slipCheckEnabled(),
    },
  };
});
