import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// อัปโหลดสลิป: dev เก็บลงโฟลเดอร์ .uploads/ — production สลับเป็น S3/Cloudflare R2 (คงฟังก์ชันนี้ไว้ตัวเดียว)
const DIR = path.join(process.cwd(), ".uploads");
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

export const SLIP_MAX = 5 * 1024 * 1024;

export async function saveSlip(file: { type?: string; data: Buffer }): Promise<string> {
  const ext = file.type ? EXT[file.type] : undefined;
  if (!ext) throw new Error("ไฟล์สลิปต้องเป็นรูปภาพหรือ PDF");
  if (file.data.length > SLIP_MAX) throw new Error("ไฟล์สลิปต้องไม่เกิน 5MB");
  await mkdir(DIR, { recursive: true });
  const key = `${randomUUID()}.${ext}`;
  await writeFile(path.join(DIR, key), file.data);
  return key;
}
