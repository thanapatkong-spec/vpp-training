import { z } from "zod";
import { COHORT, PACKAGES } from "#shared/config";
import { registrations } from "../db/schema";
import { useDb } from "../db";
import { saveSlip } from "../utils/storage";

const schema = z.object({
  packageId: z.enum(["theory", "practical", "bundle"], { message: "กรุณาเลือกแพ็กเกจ" }),
  fullName: z.string({ message: "กรุณากรอกชื่อ-นามสกุล" }).trim().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string({ message: "กรุณากรอกเบอร์โทร" }).trim().regex(/^[0-9\-\s+]{9,15}$/, "เบอร์โทรไม่ถูกต้อง"),
  email: z.string({ message: "กรุณากรอกอีเมล" }).trim().email("อีเมลไม่ถูกต้อง"),
  lineId: z.string().trim().optional(),
  workplace: z.string().trim().optional(),
});

export default defineEventHandler(async (event) => {
  const parts = (await readMultipartFormData(event)) ?? [];
  const fields: Record<string, string> = {};
  let slip: (typeof parts)[number] | undefined;
  for (const p of parts) {
    if (p.name === "slip") slip = p;
    else if (p.name) fields[p.name] = p.data.toString("utf8");
  }

  const parsed = schema.safeParse(fields);
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  if (!slip || slip.data.length === 0) fieldErrors.slip = "กรุณาแนบสลิปการโอนเงิน";
  if (!parsed.success || !slip || Object.keys(fieldErrors).length) {
    throw createError({ statusCode: 422, message: "ข้อมูลไม่ครบถ้วน", data: { fieldErrors } });
  }

  const db = useDb();
  if (!db) throw createError({ statusCode: 503, message: "ระบบฐานข้อมูลยังไม่พร้อม (ไม่ได้ตั้งค่า NUXT_DATABASE_URL)" });

  let slipKey: string;
  try {
    slipKey = await saveSlip({ type: slip.type, data: slip.data });
  } catch (e) {
    throw createError({ statusCode: 422, message: "ข้อมูลไม่ครบถ้วน", data: { fieldErrors: { slip: (e as Error).message } } });
  }

  const pkg = PACKAGES.find((p) => p.id === parsed.data.packageId)!; // ราคาคิดฝั่งเซิร์ฟเวอร์เท่านั้น
  await db.insert(registrations).values({
    cohortId: COHORT.id,
    packageId: pkg.id,
    amount: pkg.price,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    lineId: parsed.data.lineId || null,
    workplace: parsed.data.workplace || null,
    slipKey,
  });
  return { ok: true };
});
