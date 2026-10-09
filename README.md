# VPP Training

เว็บรับสมัครอบรมหลักสูตรผู้ช่วยสัตวแพทย์ (VPP) และฐานสำหรับระบบ e-learning ในอนาคต

## Stack
Nuxt 4 (Vue 3) · TypeScript · Tailwind CSS v4 · PostgreSQL + Drizzle ORM · Zod
Hosting: Docker/VPS หรือ Vercel/Cloudflare + Neon (Postgres)

## เริ่มใช้งาน
```bash
cp .env.example .env         # ใส่ DATABASE_URL และ NUXT_DATABASE_URL
npm install
npm run db:push              # สร้างตารางใน Postgres
npm run dev
```

## โครงสร้าง
- `app/pages/index.vue` หน้าแรก · `app/pages/register.vue` ฟอร์มสมัครพร้อมแนบสลิป
- `server/api/register.post.ts` รับใบสมัคร (validate ด้วย Zod, คิดราคาฝั่งเซิร์ฟเวอร์)
- `shared/config.ts` รุ่น/แพ็กเกจ/บัญชี/ช่องทางติดต่อ (ข้อมูลตัวอย่าง — แก้ให้ตรงของจริง)
- `server/db/schema.ts` ตาราง `registrations` + `courses`/`lessons` (เฟส e-learning)
- `server/utils/storage.ts` เก็บสลิป (dev = `.uploads/`, production ให้สลับเป็น S3/R2)

## ยังไม่ได้ทำ
รูป hero จริง · หน้าแอดมินตรวจสลิป · บทความ/เอกสาร · Auth + e-learning · อีเมลแจ้งเตือน
(คำตอบ FAQ เป็นร่าง ควรตรวจแก้)
