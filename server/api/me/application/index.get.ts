import { desc, eq } from "drizzle-orm";
import { billPaymentPayload, promptPayPayload } from "#shared/promptpay";
import { applicationFiles, applications, payments } from "../../../db/schema";

// ใบสมัครล่าสุดของฉัน + เอกสาร + การชำระเงิน (ไม่ส่งเนื้อไฟล์)
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const db = useDb()!;
  const [app] = await db.select().from(applications).where(eq(applications.userId, u.id)).orderBy(desc(applications.createdAt)).limit(1);
  if (!app) return null;
  const [files, pays, amount] = await Promise.all([
    db.select({ id: applicationFiles.id, kind: applicationFiles.kind, name: applicationFiles.name, status: applicationFiles.status, note: applicationFiles.note })
      .from(applicationFiles)
      .where(eq(applicationFiles.applicationId, app.id)),
    db.select({ id: payments.id, amount: payments.amount, status: payments.status, note: payments.note, transRef: payments.transRef, createdAt: payments.createdAt, paidAt: payments.paidAt })
      .from(payments)
      .where(eq(payments.applicationId, app.id))
      .orderBy(desc(payments.createdAt)),
    priceOf(event, app.cohortId, app.packageId),
  ]);
  const qr = paymentQr(amount);
  return {
    ...app,
    nationalId: undefined,
    files,
    payment: {
      amount,
      paid: pays.some((p) => p.status === "paid"),
      pending: pays.some((p) => p.status === "pending"),
      history: pays,
      promptpay: app.status === "approved" ? qr : null,
      autoCheck: slipCheckEnabled(),
    },
  };
});

// ช่องทางรับเงินค่าเรียน: ตั้ง PROMPTPAY_ID = พร้อมเพย์ทั่วไป / ไม่ตั้ง = QR ชำระบิลของบริษัท (SCB, ค่าเดียวกับ QR ที่ธนาคารออกให้)
function paymentQr(amount: number) {
  const ppId = process.env.PROMPTPAY_ID || "";
  if (ppId) return { payload: promptPayPayload(ppId, amount), name: process.env.PROMPTPAY_NAME || "บริษัท ดร.จอห์นเพ็ท จำกัด", bank: process.env.PAY_BANK_INFO || "" };
  return {
    payload: billPaymentPayload({
      billerId: process.env.PROMPTPAY_BILLER_ID || "010556801728901",
      ref1: process.env.PROMPTPAY_REF1 || "REF001",
      ref2: process.env.PROMPTPAY_REF2 ?? "0",
      terminal: process.env.PROMPTPAY_TERMINAL ?? "IFB0948252545",
      amount,
    }),
    name: process.env.PROMPTPAY_NAME || "Dr.John Pet Co., Ltd.",
    bank: process.env.PAY_BANK_INFO ?? "ธนาคารไทยพาณิชย์ (SCB) 038-485804-4",
  };
}
