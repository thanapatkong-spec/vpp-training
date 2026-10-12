import { waitUntil } from "@vercel/functions";

/** ทำงานต่อหลังส่งคำตอบให้ผู้ใช้แล้ว (เช่น ส่งอีเมล) — ผู้ใช้ไม่ต้องรอ SMTP; บน Vercel ใช้ waitUntil กันฟังก์ชันหยุดก่อนงานเสร็จ */
export function background(task: Promise<unknown>) {
  const p = task.catch((e) => console.error("[background] failed", e));
  try {
    waitUntil(p);
  } catch {
    /* นอก Vercel: promise ทำงานต่อเองใน Node */
  }
}
