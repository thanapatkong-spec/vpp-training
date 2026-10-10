// Vercel ใช้สคริปต์นี้แทน `npm run build` (ผ่าน "vercel-build")
// 1) ถ้ามีฐานข้อมูลตั้งไว้ (DATABASE_URL) ให้สร้าง/อัปเดตตารางก่อน  2) แล้ว build เว็บ
import { spawnSync } from "node:child_process";

const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, ...env }, shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// ใช้ลิงก์แบบไม่ผ่าน pooler (ถ้ามี) สำหรับสร้างตาราง
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.NUXT_DATABASE_URL;
if (url) {
  console.log("[vercel-build] syncing database schema (drizzle-kit push)");
  run("npx", ["drizzle-kit", "push"], { DATABASE_URL: url });
} else {
  console.log("[vercel-build] no database URL set, skipping schema sync");
}
run("npx", ["nuxt", "build"]);
