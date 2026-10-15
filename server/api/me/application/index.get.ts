import { and, desc, eq } from "drizzle-orm";
import { billPaymentPayload, promptPayPayload } from "#shared/promptpay";
import { applicationFiles, applications, payments } from "../../../db/schema";

// ใบสมัครของฉัน (?cohort=รหัสรุ่น = ใบล่าสุดของรุ่นนั้น, ไม่ระบุ = ใบล่าสุด) + เอกสาร + การชำระเงิน (ไม่ส่งเนื้อไฟล์)
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const db = useDb()!;
  const cohort = String(getQuery(event).cohort || "");
  const [app] = await db.select().from(applications).where(and(eq(applications.userId, u.id), cohort ? eq(applications.cohortId, cohort) : undefined)).orderBy(desc(applications.createdAt)).limit(1);
  if (!app) return null;
  const [files, allPays, due, site, fee] = await Promise.all([
    db.select({ id: applicationFiles.id, kind: applicationFiles.kind, name: applicationFiles.name, status: applicationFiles.status, note: applicationFiles.note })
      .from(applicationFiles)
      .where(eq(applicationFiles.applicationId, app.id)),
    db.select({ id: payments.id, kind: payments.kind, amount: payments.amount, status: payments.status, note: payments.note, transRef: payments.transRef, createdAt: payments.createdAt, paidAt: payments.paidAt })
      .from(payments)
      .where(eq(payments.applicationId, app.id))
      .orderBy(desc(payments.createdAt)),
    tuitionDue(event, app.cohortId, app.packageId),
    getSiteSettings(),
    councilFee(),
  ]);
  const pays = allPays.filter((p) => p.kind !== "council");
  const cPays = allPays.filter((p) => p.kind === "council");
  const amount = due.total; // ยอดโอนรวม VAT
  // เปิดให้ชำระค่าเรียนหลังผ่านการตรวจคุณสมบัติจากสัตวแพทยสภา
  const canPay = app.status === "approved" && app.councilCheck === "passed";
  const qr = canPay ? await paymentQr(amount) : null;
  return {
    ...app,
    nationalId: undefined,
    files,
    payment: {
      amount,
      base: due.base,
      vat: due.vat,
      vatRate: due.rate,
      open: canPay,
      paid: pays.some((p) => p.status === "paid"),
      pending: pays.some((p) => p.status === "pending"),
      history: pays,
      promptpay: qr,
      autoCheck: slipCheckEnabled(),
    },
    // ค่าตรวจสอบคุณสมบัติ (ให้สัตวแพทยสภา) — แยกจากค่าเรียน ส่งหลักฐานได้ทุกเมื่อหลังส่งใบสมัคร
    council: {
      amount: cPays.find((p) => p.status === "paid")?.amount ?? fee,
      paid: cPays.some((p) => p.status === "paid"),
      pending: cPays.some((p) => p.status === "pending"),
      history: cPays,
      info: site.councilPayInfo,
      payin: site.councilPayinFile || null,
    },
  };
});

// ช่องทางรับเงินค่าเรียน (ตั้งค่าเว็บไซต์ > บัญชีรับเงิน): ใส่เลขพร้อมเพย์ = พร้อมเพย์ทั่วไป / ไม่ใส่ = QR ชำระบิลของบริษัท
async function paymentQr(amount: number) {
  const s = await getSiteSettings();
  const ppId = process.env.PROMPTPAY_ID || s.payPromptpayId;
  if (ppId) return { payload: promptPayPayload(ppId, amount), name: s.payName, bank: s.payBank };
  return {
    payload: billPaymentPayload({ billerId: s.payBillerId, ref1: s.payRef1, ref2: s.payRef2, terminal: s.payTerminal, amount }),
    name: s.payName,
    bank: s.payBank,
  };
}
