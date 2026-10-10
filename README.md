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

## เพิ่มบทความ / รูป / ไฟล์ดาวน์โหลด
1. **รูป** → วางใน `public/articles/` (รูปปกแนะนำ 1200×630) · **ไฟล์ดาวน์โหลด** (PDF ฯลฯ) → วางใน `public/downloads/`
2. **บทความ** → สร้างไฟล์ `.md` ใน `content/articles/` โดยคัดลอกจาก `docs/article-template.md` (ตั้ง `cover`, `files`, `cohort`, `draft` ในหัวไฟล์)
3. commit เข้า `main` → workflow deploy ให้เอง ไม่ต้องใช้ command line: บน GitHub กด **Add file → Upload files / Create new file** ได้เลย
- ส่วน "เอกสารแนบ" หน้าแรก มาจาก `content/documents/*.yml` และ "คำถามที่ถามบ่อย" มาจาก `content/faq/*.yml` (แก้ผ่าน `/admin/` ได้)
- ชื่อไฟล์ใช้ภาษาอังกฤษ/ตัวเลข/ขีดกลาง จะปลอดภัยที่สุด

## หน้าจัดการบทความ (CMS)
เปิด `/admin/` บนเว็บ ล็อกอินด้วย GitHub token แล้วสร้าง/แก้บทความ อัปโหลดรูปและไฟล์ผ่านฟอร์มได้ — ดู `docs/cms-setup.md`

## ระบบสมาชิก
สมัคร (อีเมล/Google) → ยื่นคำขอ → แอดมินอนุมัติ → ดาวน์โหลดใบประกาศนียบัตร ต้อง deploy ที่ Vercel + Neon (ใช้บน GitHub Pages ไม่ได้) — ดู `docs/members-setup.md`

## โครงสร้าง
- `app/pages/index.vue` หน้าข้อมูลหลักสูตร (ปุ่มสมัครเรียนส่งไป LINE@ / อีเมล)
- `content/articles/*.md` บทความ/เนื้อหาอบรมแต่ละรุ่น (Nuxt Content — frontmatter: title, description, date, cohort, draft) · รูปไว้ใน `public/articles/`
- `shared/config.ts` รุ่น/แพ็กเกจ/บัญชี/ช่องทางติดต่อ (ข้อมูลตัวอย่าง — แก้ให้ตรงของจริง)
- `server/db/schema.ts` ตาราง `registrations` + `courses`/`lessons` (เฟส e-learning)

## ยังไม่ได้ทำ
หน้าสมัคร+แนบสลิป (ถอดออกไปก่อน เอากลับมาได้จาก git history) · รูป hero จริง · หน้าแอดมินตรวจสลิป · บทความ/เอกสาร · Auth + e-learning · อีเมลแจ้งเตือน
(คำตอบ FAQ เป็นร่าง ควรตรวจแก้)
