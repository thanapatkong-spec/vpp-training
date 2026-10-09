"use server";

import { z } from "zod";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { COHORT, PACKAGES } from "@/lib/config";
import { saveSlip } from "@/lib/storage";

export type RegisterState = { ok: boolean; error?: string; fieldErrors?: Record<string, string> };

const schema = z.object({
  packageId: z.enum(["theory", "practical", "bundle"], { message: "กรุณาเลือกแพ็กเกจ" }),
  fullName: z.string().trim().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string().trim().regex(/^[0-9\-\s+]{9,15}$/, "เบอร์โทรไม่ถูกต้อง"),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  lineId: z.string().trim().optional(),
  workplace: z.string().trim().optional(),
});

export async function registerAction(_prev: RegisterState, form: FormData): Promise<RegisterState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, fieldErrors };
  }
  const slip = form.get("slip");
  if (!(slip instanceof File) || slip.size === 0) return { ok: false, fieldErrors: { slip: "กรุณาแนบสลิปการโอนเงิน" } };
  if (!db) return { ok: false, error: "ระบบฐานข้อมูลยังไม่พร้อม (ไม่ได้ตั้งค่า DATABASE_URL)" };

  try {
    const slipKey = await saveSlip(slip);
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
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }
}
