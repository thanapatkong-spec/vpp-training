import { and, desc, eq } from "drizzle-orm";
import { applications, payments } from "../../../db/schema";

const MAX = 4 * 1024 * 1024;

// ผู้สมัครอัปโหลดสลิปค่าเรียน → ตรวจอัตโนมัติ (ถ้าเปิดไว้) หรือรอแอดมินตรวจ
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const db = useDb()!;
  const [app] = await db.select().from(applications).where(eq(applications.userId, u.id)).orderBy(desc(applications.createdAt)).limit(1);
  if (!app || app.status !== "approved") throw createError({ statusCode: 409, message: "ชำระเงินได้หลังใบสมัครผ่านการตรวจสอบ" });
  const prev = await db.select({ status: payments.status }).from(payments).where(eq(payments.applicationId, app.id));
  if (prev.some((p) => p.status === "paid")) throw createError({ statusCode: 409, message: "ชำระค่าเรียนเรียบร้อยแล้ว" });
  if (prev.some((p) => p.status === "pending")) throw createError({ statusCode: 409, message: "ส่งสลิปแล้ว กรุณารอทีมงานตรวจสอบ" });

  const slip = ((await readMultipartFormData(event)) ?? []).find((p) => p.name === "slip");
  if (!slip?.data.length) throw createError({ statusCode: 422, message: "กรุณาแนบรูปสลิป" });
  if (slip.data.length > MAX) throw createError({ statusCode: 422, message: "ไฟล์สลิปต้องไม่เกิน 4MB" });
  const d = slip.data;
  const type = d[0] === 0xff && d[1] === 0xd8 ? "image/jpeg" : d.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ? "image/png" : "";
  if (!type) throw createError({ statusCode: 422, message: "สลิปต้องเป็นรูป JPG หรือ PNG (บันทึกภาพสลิปจากแอปธนาคาร)" });

  const amount = priceOf(app.packageId);
  const r = await verifySlip(d, type, amount);
  const base = { applicationId: app.id, amount, slipName: slip.filename || "slip", slipType: type, slipData: d };

  if (r.configured && r.ok) {
    const [dup] = await db.select({ id: payments.id }).from(payments).where(eq(payments.transRef, r.transRef)).limit(1);
    if (dup) throw createError({ statusCode: 409, message: "สลิปนี้ถูกใช้ไปแล้ว" });
    await db.insert(payments).values({ ...base, status: "paid", transRef: r.transRef, verifiedBy: "slip-api", paidAt: new Date() });
    await mailPaid(app, u.email, amount, r.transRef);
    return { status: "paid" };
  }
  if (r.configured && !r.ok) {
    await db.insert(payments).values({ ...base, status: "rejected", note: r.reason, verifiedBy: "slip-api" });
    throw createError({ statusCode: 422, message: `${r.reason} — แนบสลิปใหม่ได้ หรือติดต่อทีมงาน` });
  }
  // ยังไม่เปิดตรวจอัตโนมัติ: รอแอดมินตรวจ
  await db.insert(payments).values({ ...base, status: "pending" });
  await mailSlipNeedsReview(app, u.email, amount);
  return { status: "pending" };
});
