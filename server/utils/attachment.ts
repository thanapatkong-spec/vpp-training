import type { H3Event } from "h3";

const MAX = 4 * 1024 * 1024; // Vercel จำกัดขนาด request ราว 4.5MB

// อ่านไฟล์แนบ (multipart: file + ช่องข้อความอื่น) ตรวจชนิดจากเนื้อไฟล์จริง: PDF / JPG / PNG
export async function readAttachment(event: H3Event) {
  const parts = (await readMultipartFormData(event)) ?? [];
  const fields: Record<string, string> = {};
  let file: (typeof parts)[number] | undefined;
  for (const p of parts) {
    if (p.name === "file" && p.filename !== undefined) file = p;
    else if (p.name) fields[p.name] = p.data.toString("utf8").trim();
  }
  if (!file || !file.data.length) throw createError({ statusCode: 422, message: "กรุณาแนบไฟล์" });
  if (file.data.length > MAX) throw createError({ statusCode: 422, message: "ไฟล์ต้องไม่เกิน 4MB" });
  const d = file.data;
  // PDF บางไฟล์มีไบต์นำหน้าก่อน %PDF- (มาตรฐานอนุญาตภายใน 1024 ไบต์แรก)
  const kind = d.subarray(0, 1024).includes("%PDF-") ? "pdf" : d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff ? "jpg" : d.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ? "png" : "";
  if (!kind) throw createError({ statusCode: 422, message: "แนบได้เฉพาะไฟล์ PDF, JPG หรือ PNG (ไฟล์ HEIC จากไอโฟนให้แปลงเป็น JPG ก่อน)" });
  if (fields.issuedOn && !/^\d{4}-\d{2}-\d{2}$/.test(fields.issuedOn)) throw createError({ statusCode: 422, message: "วันที่ไม่ถูกต้อง" });
  const contentType = kind === "pdf" ? "application/pdf" : kind === "jpg" ? "image/jpeg" : "image/png";
  return { fields, data: d, name: file.filename || `file.${kind}`, contentType };
}
