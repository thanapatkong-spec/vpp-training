import { extname } from "node:path";
import { randomBytes } from "node:crypto";

const MAX = 3 * 1024 * 1024; // Vercel จำกัด request ~4.5MB (base64/multipart เพิ่มขนาด)
const TYPES: Record<string, string> = { ".jpg": "image", ".jpeg": "image", ".png": "image", ".webp": "image", ".gif": "image", ".pdf": "file", ".docx": "file", ".xlsx": "file", ".pptx": "file", ".zip": "file" };

// แอดมิน: อัปโหลดรูป/ไฟล์ไปที่ public/uploads (multipart: file) คืน path บนเว็บ
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const file = ((await readMultipartFormData(event)) ?? []).find((p) => p.name === "file");
  if (!file || !file.data.length) throw createError({ statusCode: 422, message: "กรุณาเลือกไฟล์" });
  const ext = extname(file.filename || "").toLowerCase();
  if (!TYPES[ext]) throw createError({ statusCode: 422, message: "รองรับเฉพาะ jpg, png, webp, gif, pdf, docx, xlsx, pptx, zip" });
  if (file.data.length > MAX) throw createError({ statusCode: 422, message: "ไฟล์ต้องไม่เกิน 3MB (ย่อรูปก่อนอัปโหลด)" });
  if (TYPES[ext] === "image" && ext !== ".gif" && ext !== ".webp") {
    const h = file.data.subarray(0, 4).toString("hex");
    if (!(h.startsWith("ffd8ff") || h === "89504e47")) throw createError({ statusCode: 422, message: "ไฟล์รูปไม่ถูกต้อง" });
  }
  if (ext === ".pdf" && file.data.subarray(0, 5).toString("latin1") !== "%PDF-") throw createError({ statusCode: 422, message: "ไฟล์ PDF ไม่ถูกต้อง" });
  const base = (file.filename || "").slice(0, -ext.length).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const name = `${base || "file"}-${randomBytes(3).toString("hex")}${ext}`;
  await repoWrite(`public/uploads/${name}`, file.data, `CMS: อัปโหลด ${name} (โดย ${admin.email})`);
  return { path: `/uploads/${name}` };
});
