import { and, desc, eq } from "drizzle-orm";
import { applications, payments } from "../../../db/schema";

const MAX = 4 * 1024 * 1024;

// ผู้สมัครอัปโหลดสลิป: kind=tuition ค่าเรียน (หลังใบสมัครผ่าน → ตรวจอัตโนมัติถ้าเปิดไว้ หรือรอแอดมินตรวจ)
// kind=council ค่าตรวจสอบคุณสมบัติให้สัตวแพทยสภา (ส่งได้ทุกเมื่อหลังส่งใบสมัคร ก่อน/พร้อม/หลังค่าเรียน → แอดมินตรวจ)
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const db = useDb()!;
  const parts = (await readMultipartFormData(event)) ?? [];
  const cohort = parts.find((p) => p.name === "cohort")?.data.toString("utf8") || "";
  const kind = parts.find((p) => p.name === "kind")?.data.toString("utf8") === "council" ? "council" : "tuition";
  const [app] = await db.select().from(applications).where(and(eq(applications.userId, u.id), cohort ? eq(applications.cohortId, cohort) : undefined)).orderBy(desc(applications.createdAt)).limit(1);
  if (kind === "council") return council(app, parts, u.email);
  if (!app || app.status !== "approved") throw createError({ statusCode: 409, message: "ชำระเงินได้หลังใบสมัครผ่านการตรวจสอบ" });
  const prev = await db.select({ status: payments.status }).from(payments).where(and(eq(payments.applicationId, app.id), eq(payments.kind, "tuition")));
  if (prev.some((p) => p.status === "paid")) throw createError({ statusCode: 409, message: "ชำระค่าเรียนเรียบร้อยแล้ว" });
  if (prev.some((p) => p.status === "pending")) throw createError({ statusCode: 409, message: "ส่งสลิปแล้ว กรุณารอทีมงานตรวจสอบ" });

  const slip = parts.find((p) => p.name === "slip");
  if (!slip?.data.length) throw createError({ statusCode: 422, message: "กรุณาแนบรูปสลิป" });
  if (slip.data.length > MAX) throw createError({ statusCode: 422, message: "ไฟล์สลิปต้องไม่เกิน 4MB" });
  const d = slip.data;
  const type = d[0] === 0xff && d[1] === 0xd8 ? "image/jpeg" : d.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ? "image/png" : "";
  if (!type) throw createError({ statusCode: 422, message: "สลิปต้องเป็นรูป JPG หรือ PNG (บันทึกภาพสลิปจากแอปธนาคาร)" });

  const amount = await priceOf(event, app.cohortId, app.packageId);
  const r = await verifySlip(d, type, amount);
  const base = { applicationId: app.id, amount, slipName: slip.filename || "slip", slipType: type, slipData: d };

  if (r.configured && r.ok) {
    const [dup] = await db.select({ id: payments.id }).from(payments).where(eq(payments.transRef, r.transRef)).limit(1);
    if (dup) throw createError({ statusCode: 409, message: "สลิปนี้ถูกใช้ไปแล้ว" });
    await db.insert(payments).values({ ...base, status: "paid", transRef: r.transRef, verifiedBy: "slip-api", paidAt: new Date() });
    background(mailPaid(app, u.email, amount, r.transRef));
    return { status: "paid" };
  }
  if (r.configured && !r.ok) {
    await db.insert(payments).values({ ...base, status: "rejected", note: r.reason, verifiedBy: "slip-api" });
    throw createError({ statusCode: 422, message: `${r.reason} — แนบสลิปใหม่ได้ หรือติดต่อทีมงาน` });
  }
  // ยังไม่เปิดตรวจอัตโนมัติ: รอแอดมินตรวจ
  await db.insert(payments).values({ ...base, status: "pending" });
  background(mailSlipNeedsReview(app, u.email, amount));
  return { status: "pending" };
});

type Part = { name?: string; filename?: string; data: Buffer };
async function council(app: typeof applications.$inferSelect | undefined, parts: Part[], email: string) {
  if (!app || app.status === "rejected") throw createError({ statusCode: 409, message: "ส่งหลักฐานได้หลังส่งใบสมัคร" });
  const db = useDb()!;
  const prev = await db.select({ status: payments.status }).from(payments).where(and(eq(payments.applicationId, app.id), eq(payments.kind, "council")));
  if (prev.some((p) => p.status === "paid")) throw createError({ statusCode: 409, message: "ทีมงานยืนยันการชำระค่าตรวจสอบคุณสมบัติแล้ว" });
  if (prev.some((p) => p.status === "pending")) throw createError({ statusCode: 409, message: "ส่งหลักฐานแล้ว กรุณารอทีมงานตรวจสอบ" });
  const slip = parts.find((p) => p.name === "slip");
  if (!slip?.data.length) throw createError({ statusCode: 422, message: "กรุณาแนบสลิปหรือใบเสร็จ" });
  if (slip.data.length > MAX) throw createError({ statusCode: 422, message: "ไฟล์ต้องไม่เกิน 4MB" });
  const d = slip.data;
  const type = d[0] === 0xff && d[1] === 0xd8 ? "image/jpeg" : d.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ? "image/png" : d.subarray(0, 5).toString("latin1") === "%PDF-" ? "application/pdf" : "";
  if (!type) throw createError({ statusCode: 422, message: "หลักฐานต้องเป็นรูป JPG/PNG หรือ PDF" });
  const amount = await councilFee();
  await db.insert(payments).values({ applicationId: app.id, kind: "council", amount, status: "pending", slipName: slip.filename || "slip", slipType: type, slipData: d });
  background(mailCouncilSlip(app, email, amount));
  return { status: "pending" };
}
