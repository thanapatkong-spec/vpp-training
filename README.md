# VPP Training

เว็บรับสมัครอบรมหลักสูตรผู้ช่วยสัตวแพทย์ (VPP) และฐานสำหรับระบบ e-learning ในอนาคต

## Stack
Next.js (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL + Drizzle ORM · Zod
Hosting: Vercel + Neon/Railway (Postgres) — ย้ายไป Docker/VPS ได้

## เริ่มใช้งาน
```bash
cp .env.example .env.local   # ใส่ DATABASE_URL
npm install
npm run db:push              # สร้างตารางใน Postgres
npm run dev
```

## โครงสร้าง
- `src/app/page.tsx` หน้าแรก · `src/app/register/` ฟอร์มสมัครพร้อมแนบสลิป (server action)
- `src/lib/config.ts` รุ่น/แพ็กเกจ/บัญชี/ช่องทางติดต่อ (ข้อมูลตัวอย่าง — แก้ให้ตรงของจริง)
- `src/db/schema.ts` ตาราง `registrations` + `courses`/`lessons` (เฟส e-learning)
- `src/lib/storage.ts` เก็บสลิป (dev = `.uploads/`, production ให้สลับเป็น S3/R2)

## ยังไม่ได้ทำ
รูป hero จริง · หน้าแอดมินตรวจสลิป · FAQ แบบขยายได้ · บทความ/เอกสาร · Auth + e-learning · อีเมลแจ้งเตือน
