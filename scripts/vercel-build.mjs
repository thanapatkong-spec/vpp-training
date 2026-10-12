// Vercel ใช้สคริปต์นี้แทน `npm run build` (ผ่าน "vercel-build")
// 1) ถ้ามีฐานข้อมูล (DATABASE_URL): สร้างตารางที่จำเป็นแบบปลอดภัย แล้ว sync schema ด้วย drizzle-kit push
// 2) build เว็บ — ถ้า push มีปัญหา (เช่น ถามแบบโต้ตอบ) แค่เตือน ไม่ทำให้ deploy ล้ม
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const run = (cmd, args, env = {}) =>
  spawnSync(cmd, args, { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, ...env }, shell: process.platform === "win32" }).status ?? 1;

// ใช้ลิงก์แบบไม่ผ่าน pooler (ถ้ามี) สำหรับสร้างตาราง
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL;
if (url) {
  console.log("[vercel-build] creating required tables if missing (scripts/db-bootstrap.sql)");
  try {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
    await sql.unsafe(readFileSync(new URL("./db-bootstrap.sql", import.meta.url), "utf8"));
    await sql.end();
  } catch (e) {
    console.warn("[vercel-build] WARNING: bootstrap failed:", e?.message || e);
  }
  console.log("[vercel-build] syncing database schema (drizzle-kit push)");
  if (run("npx", ["drizzle-kit", "push", "--force"], { DATABASE_URL: url }) !== 0) {
    console.warn("[vercel-build] WARNING: drizzle-kit push failed — continuing build (ตารางหลักสร้างไว้แล้วด้านบน)");
  }
} else {
  console.log("[vercel-build] no database URL set, skipping schema sync");
}
const code = run("npx", ["nuxt", "build"]);
if (code !== 0) process.exit(code);
