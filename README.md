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

## Deploy (GitHub Pages)
เว็บตอนนี้เป็นหน้าข้อมูลล้วน (static) — push เข้า `main` แล้ว workflow `.github/workflows/pages.yml` จะ build ด้วย `nuxt generate` และ deploy ให้อัตโนมัติ
ต้องเปิดครั้งเดียว: Settings → Pages → Source = GitHub Actions · ลิงก์: `https://<user>.github.io/vpp-training/`

## โครงสร้าง
- `app/pages/index.vue` หน้าข้อมูลหลักสูตร (ปุ่มสมัครเรียนส่งไป LINE@ / อีเมล)
- `content/articles/*.md` บทความ/เนื้อหาอบรมแต่ละรุ่น (Nuxt Content — frontmatter: title, description, date, cohort, draft) · รูปไว้ใน `public/articles/`
- `shared/config.ts` รุ่น/แพ็กเกจ/บัญชี/ช่องทางติดต่อ (ข้อมูลตัวอย่าง — แก้ให้ตรงของจริง)
- `server/db/schema.ts` ตาราง `registrations` + `courses`/`lessons` (เฟส e-learning)

## ยังไม่ได้ทำ
หน้าสมัคร+แนบสลิป (ถอดออกไปก่อน เอากลับมาได้จาก git history) · รูป hero จริง · หน้าแอดมินตรวจสลิป · บทความ/เอกสาร · Auth + e-learning · อีเมลแจ้งเตือน
(คำตอบ FAQ เป็นร่าง ควรตรวจแก้)
