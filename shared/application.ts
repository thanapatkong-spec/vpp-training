import { z } from "zod";

// ใบสมัครเรียน VPP: ตัวเลือกและกฎตรวจข้อมูล (ใช้ทั้งหน้าเว็บและเซิร์ฟเวอร์)
export const PREFIXES = ["นาย", "นาง", "นางสาว"] as const;
export const EDUCATION = ["มัธยมศึกษาปีที่ 6", "ปวช.", "ปวส.", "ปริญญาตรี", "สูงกว่าปริญญาตรี", "อื่นๆ (เทียบเท่า ม.6)"] as const;
export const APP_DOCS = [
  { kind: "id_card", label: "สำเนาบัตรประชาชน" },
  { kind: "education", label: "สำเนาวุฒิการศึกษา (ม.6 ขึ้นไป)" },
] as const;
export type AppDocKind = (typeof APP_DOCS)[number]["kind"];
export const APP_STATUS: Record<string, [string, string]> = {
  submitted: ["ส่งแล้ว รอตรวจสอบ", "bg-amber-100 text-amber-800"],
  needs_changes: ["ขอแก้ไขข้อมูล/เอกสาร", "bg-orange-100 text-orange-800"],
  approved: ["ผ่านการตรวจสอบ", "bg-green-100 text-green-800"],
  rejected: ["ไม่ผ่าน", "bg-red-100 text-red-700"],
};

// ตรวจเลขบัตรประชาชน 13 หลัก (เลขตรวจสอบหลักสุดท้าย)
export function validThaiId(id: string) {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(id[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(id[12]);
}

const req = (msg: string, max = 200) => z.string().trim().min(1, msg).max(max);
const opt = (max = 200) => z.string().trim().max(max).optional().default("");

export const ApplicationInput = z
  .object({
    cohortId: req("กรุณาเลือกรุ่น", 40),
    packageId: z.enum(["theory", "practical", "bundle"], { message: "กรุณาเลือกแพ็กเกจ" }),
    prefix: z.enum(PREFIXES, { message: "กรุณาเลือกคำนำหน้า" }),
    firstName: req("กรุณากรอกชื่อ", 100),
    lastName: req("กรุณากรอกนามสกุล", 100),
    nameEn: opt(200),
    nationalId: z.string().trim().transform((s) => s.replace(/[\s-]/g, "")).refine(validThaiId, "เลขบัตรประชาชนไม่ถูกต้อง"),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาระบุวันเกิด"),
    phone: z.string().trim().regex(/^0\d[\d -]{7,11}$/, "เบอร์โทรไม่ถูกต้อง"),
    lineId: opt(60),
    address: req("กรุณากรอกที่อยู่", 500),
    education: z.enum(EDUCATION, { message: "กรุณาเลือกวุฒิการศึกษา" }),
    school: opt(200),
    workplace: req("กรุณากรอกสถานที่ทำงาน", 200),
    position: opt(100),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    vetName: req("กรุณากรอกชื่อสัตวแพทย์ผู้ควบคุม", 200),
    vetLicense: req("กรุณากรอกเลขใบอนุญาตของสัตวแพทย์", 40),
    vetPhone: opt(30),
    payer: z.enum(["self", "employer"]).default("self"),
    invoiceName: opt(200),
    invoiceAddress: opt(500),
    invoiceTaxId: opt(20),
    consent: z.literal(true, { message: "กรุณายอมรับนโยบายความเป็นส่วนตัวและรับรองข้อมูล" }),
  })
  .superRefine((v, ctx) => {
    if (v.payer === "employer" && !v.invoiceName) ctx.addIssue({ code: "custom", path: ["invoiceName"], message: "กรุณากรอกชื่อผู้ออกใบเสร็จ (นายจ้าง)" });
  });
export type ApplicationInputT = z.infer<typeof ApplicationInput>;
