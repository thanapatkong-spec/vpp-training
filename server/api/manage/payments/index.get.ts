import { and, desc, eq, notExists, or } from "drizzle-orm";
import { cohortPrice } from "#shared/cohorts";
import { applications, payments, user } from "../../../db/schema";

// แอดมิน: รายการชำระเงินทั้งหมด (ไม่ส่งรูปสลิป) + ผู้ผ่านการตรวจสอบที่ยังไม่ชำระ
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const db = useDb()!;
  const who = { applicationId: applications.id, prefix: applications.prefix, firstName: applications.firstName, lastName: applications.lastName, phone: applications.phone, cohortId: applications.cohortId, packageId: applications.packageId, email: user.email };
  const [rows, unpaid, cohorts] = await Promise.all([
    db.select({ ...who, id: payments.id, amount: payments.amount, status: payments.status, transRef: payments.transRef, verifiedBy: payments.verifiedBy, note: payments.note, hasSlip: payments.slipType, createdAt: payments.createdAt, paidAt: payments.paidAt })
      .from(payments).innerJoin(applications, eq(applications.id, payments.applicationId)).innerJoin(user, eq(user.id, applications.userId))
      .orderBy(desc(payments.createdAt)),
    db.select({ ...who, approvedAt: applications.updatedAt })
      .from(applications).innerJoin(user, eq(user.id, applications.userId))
      .where(and(eq(applications.status, "approved"), notExists(db.select({ x: payments.id }).from(payments).where(and(eq(payments.applicationId, applications.id), or(eq(payments.status, "paid"), eq(payments.status, "pending")))))))
      .orderBy(desc(applications.updatedAt)),
    getCohorts(event),
  ]);
  const price = (c: string, p: string) => cohortPrice(cohorts.find((x) => x.id === c), p);
  return { payments: rows, unpaid: unpaid.map((u) => ({ ...u, amount: price(u.cohortId, u.packageId) })) };
});
