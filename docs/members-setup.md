# ระบบสมาชิก (ระยะ A): สมัคร + ดาวน์โหลดใบประกาศนียบัตร

ผู้ที่เคยเรียนสมัครสมาชิก (อีเมล หรือ Google) → ยื่นคำขอรับใบประกาศ → แอดมินตรวจและอนุมัติพร้อมแนบ PDF → ผู้เรียนดาวน์โหลดใบจากหน้า **บัญชีของฉัน** (`/account`)

> ระบบนี้ต้องมีเซิร์ฟเวอร์และฐานข้อมูล **ใช้บน GitHub Pages ไม่ได้** ต้อง deploy ที่ Vercel + Neon ตามด้านล่าง
> บน GitHub Pages ลิงก์ "เข้าสู่ระบบ" จะถูกซ่อนไว้ (ปิดด้วย `NUXT_PUBLIC_MEMBERS_ENABLED=false`)

## 1) ฐานข้อมูล (Neon)
1. สร้างโปรเจกต์ที่ neon.tech (ฟรี) คัดลอก connection string (`postgres://…?sslmode=require`)
2. สร้างตารางครั้งแรกจากเครื่องที่ clone repo:
   ```bash
   DATABASE_URL="<connection string>" npm run db:push
   ```
   (รันซ้ำทุกครั้งที่ `server/db/schema.ts` เปลี่ยน)

## 2) Deploy ที่ Vercel
1. vercel.com → Add New Project → เลือก repo `vpp-training` (Framework: Nuxt, ไม่ต้องแก้ build command)
2. ตั้ง Environment Variables (ดูตัวอย่างใน `.env.example`)

| ตัวแปร | ค่า |
|---|---|
| `NUXT_DATABASE_URL` | connection string ของ Neon |
| `BETTER_AUTH_SECRET` | สตริงสุ่มยาว ≥ 32 ตัวอักษร (เก็บเป็นความลับ) |
| `BETTER_AUTH_URL` | URL จริงของเว็บ เช่น `https://vpp-training.vercel.app` |
| `ADMIN_EMAILS` | อีเมลแอดมิน (คั่นด้วยจุลภาค) |
| `NUXT_PUBLIC_MEMBERS_ENABLED` | `true` |
| `RESEND_API_KEY`, `MAIL_FROM` | ดูข้อ 4 |
| `NUXT_PUBLIC_GOOGLE_LOGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ดูข้อ 3 |

3. กด Deploy แล้วเข้า `/signup` ทดสอบ เมื่อ Vercel พร้อมใช้งานแล้ว ปิด workflow GitHub Pages (`.github/workflows/pages.yml`) หรือชี้โดเมนไปที่ Vercel

## 3) ล็อกอินด้วย Google
1. console.cloud.google.com → APIs & Services → Credentials → Create OAuth client ID (Web application)
2. Authorized redirect URI: `https://<โดเมนของเว็บ>/api/auth/callback/google` (ใส่ `http://localhost:3000/api/auth/callback/google` ด้วยถ้าจะลองในเครื่อง)
3. ใส่ Client ID/Secret ใน Vercel แล้วตั้ง `NUXT_PUBLIC_GOOGLE_LOGIN=true`

## 4) อีเมลยืนยัน / ตั้งรหัสผ่านใหม่ (Resend)
1. resend.com → สร้าง API key และยืนยันโดเมนผู้ส่ง
2. ตั้ง `RESEND_API_KEY` และ `MAIL_FROM` (เช่น `"VPP <no-reply@โดเมนของคุณ>"`)
3. เมื่อตั้งแล้ว ระบบจะ **บังคับยืนยันอีเมล** ก่อนล็อกอินด้วยอีเมล/รหัสผ่าน ถ้าไม่ตั้ง ระบบจะไม่ส่งอีเมล (พิมพ์ลิงก์ลง log) และไม่บังคับยืนยัน เหมาะกับการลองเท่านั้น

## แอดมิน
- อีเมลใน `ADMIN_EMAILS` ที่ **ยืนยันอีเมลแล้ว** (หรือเข้าด้วย Google) จะเห็นปุ่ม "จัดการคำขอ (แอดมิน)" ในหน้าบัญชี → `/manage`
- ตรวจคำขอ เทียบกับทะเบียนผู้เรียนของคุณ แล้วเลือกไฟล์ PDF (ไม่เกิน 4MB) กด "อนุมัติและส่งใบประกาศ" ใบจะขึ้นในบัญชีของผู้ยื่นทันที หรือกด "ไม่อนุมัติ" พร้อมหมายเหตุ
- ใบประกาศดาวน์โหลดได้เฉพาะเจ้าของบัญชีและแอดมิน

## ข้อมูลส่วนบุคคล (PDPA)
- ระบบเก็บ ชื่อ อีเมล ข้อมูลคำขอ และไฟล์ใบประกาศ เก็บใน Postgres (ไฟล์ PDF เก็บเป็น bytea ในตาราง `cert_files` ไม่อยู่ใน repo)
- หน้า `/privacy` เป็น **ข้อความร่าง** ควรให้ผู้เชี่ยวชาญตรวจก่อนเปิดใช้ แก้ได้ที่ `/admin/` → หน้าเนื้อหา → นโยบายความเป็นส่วนตัว
- ถ้าจำนวนไฟล์ใหญ่ขึ้น ย้ายไปเก็บที่ Cloudflare R2/S3 ได้ โดยเปลี่ยนเฉพาะที่ `approve.post.ts` และ `file.get.ts`

## ที่ยังไม่มี (ระยะถัดไป)
- ระยะ B: แต้มสะสมและตัวติดตามอายุบัตร (ต้องมีเกณฑ์แต้มและกิจกรรมที่ได้แต้ม)
- ระยะ C: เรียนจากวิดีโอ + ข้อสอบ ที่ให้แต้มอัตโนมัติ
