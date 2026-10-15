import { and, desc, eq, inArray, notExists, or, sql } from "drizzle-orm";
import { cohortPrice, withVat } from "#shared/cohorts";
import { applications, payments, user } from "../../../db/schema";

// แอดมิน: รายการชำระเงินทั้งหมด (ไม่ส่งรูปสลิป) + ผู้ที่ยังไม่ชำระ
// ค่าเรียน: ใบสมัครที่ผ่านการตรวจสอบ · ค่าตรวจสอบคุณสมบัติ (kind=council): ใบสมัครที่ส่งแล้วทุกใบ (ยกเว้นไม่ผ่าน)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb()!;
  const who = { applicationId: applications.id, prefix: applications.prefix, firstName: applications.firstName, lastName: applications.lastName, phone: applications.phone, cohortId: applications.cohortId, packageId: applications.packageId, email: user.email };
  const none = (kind: string) => notExists(db.select({ x: payments.id }).from(payments).where(and(eq(payments.applicationId, applications.id), eq(payments.kind, kind), or(eq(payments.status, "paid"), eq(payments.status, "pending")))));
  const [rows, unpaid, councilUnpaid, cohorts, fee] = await Promise.all([
    db.select({ ...who, id: payments.id, kind: payments.kind, amount: payments.amount, status: payments.status, transRef: payments.transRef, verifiedBy: payments.verifiedBy, note: payments.note, hasSlip: payments.slipType, createdAt: payments.createdAt, paidAt: payments.paidAt })
      .from(payments).innerJoin(applications, eq(applications.id, payments.applicationId)).innerJoin(user, eq(user.id, applications.userId))
      .orderBy(desc(payments.createdAt)),
    db.select({ ...who, approvedAt: sql<string>`coalesce(${applications.councilCheckedAt}, ${applications.updatedAt})` })
      .from(applications).innerJoin(user, eq(user.id, applications.userId))
      .where(and(eq(applications.status, "approved"), eq(applications.councilCheck, "passed"), none("tuition")))
      .orderBy(desc(applications.updatedAt)),
    db.select({ ...who, approvedAt: applications.createdAt })
      .from(applications).innerJoin(user, eq(user.id, applications.userId))
      .where(and(inArray(applications.status, ["submitted", "needs_changes", "approved"]), none("council")))
      .orderBy(desc(applications.createdAt)),
    getCohorts(event),
    councilFee(),
  ]);
  const rate = await vatRate();
  const price = (c: string, p: string) => withVat(cohortPrice(cohorts.find((x) => x.id === c), p), rate).total; // ยอดโอนรวม VAT
  return {
    payments: rows,
    unpaid: unpaid.map((u) => ({ ...u, kind: "tuition", amount: price(u.cohortId, u.packageId) })),
    councilUnpaid: councilUnpaid.map((u) => ({ ...u, kind: "council", amount: fee })),
  };
});
