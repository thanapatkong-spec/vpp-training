import type { H3Event } from "h3";
import { ApplicationInput, APP_DOCS, type AppDocKind } from "#shared/application";

const MAX_TOTAL = 4 * 1024 * 1024; // Vercel รับ request ได้ราว 4.5MB

export type IncomingDoc = { kind: AppDocKind; name: string; contentType: string; data: Buffer };

function sniff(d: Buffer) {
  if (d.subarray(0, 1024).includes("%PDF-")) return "application/pdf";
  if (d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff) return "image/jpeg";
  if (d.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  return "";
}

// อ่านใบสมัครแบบ multipart: data = JSON ของฟอร์ม, ไฟล์ชื่อ id_card / education
export async function readApplicationForm(event: H3Event) {
  const parts = (await readMultipartFormData(event)) ?? [];
  let raw: unknown = {};
  const docs: IncomingDoc[] = [];
  let total = 0;
  for (const p of parts) {
    if (p.name === "data") {
      try { raw = JSON.parse(p.data.toString("utf8")); } catch { throw createError({ statusCode: 422, message: "ข้อมูลไม่ถูกต้อง" }); }
    } else if (APP_DOCS.some((d) => d.kind === p.name) && p.data.length) {
      const contentType = sniff(p.data);
      const label = APP_DOCS.find((d) => d.kind === p.name)!.label;
      if (!contentType) throw createError({ statusCode: 422, message: `${label}: แนบได้เฉพาะ PDF, JPG หรือ PNG` });
      total += p.data.length;
      docs.push({ kind: p.name as AppDocKind, name: p.filename || p.name!, contentType, data: p.data });
    }
  }
  if (total > MAX_TOTAL) throw createError({ statusCode: 422, message: "ไฟล์รวมกันต้องไม่เกิน 4MB (ย่อรูปหรือสแกนความละเอียดต่ำลง)" });
  const parsed = ApplicationInput.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "form")] ||= i.message;
    throw createError({ statusCode: 422, message: Object.values(fieldErrors)[0] || "ข้อมูลไม่ถูกต้อง", data: { fieldErrors } });
  }
  const { consent: _c, ...values } = parsed.data;
  return { values: { ...values, nameEn: values.nameEn || null, lineId: values.lineId || null, school: values.school || null, position: values.position || null, vetPhone: values.vetPhone || null, invoiceName: values.invoiceName || null, invoiceAddress: values.invoiceAddress || null, invoiceTaxId: values.invoiceTaxId || null, experienceYears: values.experienceYears ?? null }, docs };
}

export const maskId = (id: string) => (id.length === 13 ? `${id.slice(0, 1)}-xxxx-xxxxx-${id.slice(10, 12)}-${id.slice(12)}` : "xxxx");
