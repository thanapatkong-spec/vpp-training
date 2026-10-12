import { defineConfig } from "drizzle-kit";

// จัดการเฉพาะตารางของเว็บนี้ (ตารางอื่นในฐานข้อมูล เช่น ตารางตัวอย่างของ Neon จะไม่ถูกแตะ)
// กัน drizzle-kit push ถามแบบโต้ตอบ ("สร้างใหม่ หรือเปลี่ยนชื่อจากตารางเดิม?") ซึ่งทำให้ build บน Vercel ล้ม
const TABLES = [
  "registrations", "courses", "lessons", "user", "session", "account", "verification",
  "cert_claims", "cert_files", "certificates", "member_profiles", "claim_tokens",
  "applications", "application_files", "payments", "cohorts", "content_items", "content_seeds", "media",
];

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  schemaFilter: ["public"],
  tablesFilter: TABLES,
});
