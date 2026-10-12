import { extname } from "node:path";
import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";
import { media } from "../../../db/schema";

const MAX = 3 * 1024 * 1024; // Vercel จำกัด request ~4.5MB (base64/multipart เพิ่มขนาด)
const TYPES: Record<string, string> = { ".jpg": "image", ".jpeg": "image", ".png": "image", ".webp": "image", ".gif": "image", ".pdf": "file", ".docx": "file", ".xlsx": "file", ".pptx": "file", ".zip": "file" };

// แอดมิน: อัปโหลดรูป/ไฟล์ (multipart: file) คืน URL ที่ใช้ได้ทันที
// ตั้ง BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob) = เก็บที่ Vercel Blob · ไม่ตั้ง = เก็บในฐานข้อมูล
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
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
  const contentType = file.type || (ext === ".pdf" ? "application/pdf" : TYPES[ext] === "image" ? `image/${ext.slice(1).replace("jpg", "jpeg")}` : "application/octet-stream");
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const b = await put(`uploads/${name}`, file.data, { access: "public", contentType, addRandomSuffix: false });
    return { path: b.url };
  }
  const [row] = await useDb()!.insert(media).values({ name, contentType, size: file.data.length, data: file.data }).returning({ id: media.id });
  return { path: `/api/media/${row!.id}/${name}` };
});
