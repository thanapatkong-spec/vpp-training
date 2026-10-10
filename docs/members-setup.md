# ระบบสมาชิก (ระยะ A): สมัคร + ดาวน์โหลดใบประกาศนียบัตร

ผู้ที่เคยเรียนสมัครสมาชิก (อีเมล หรือ Google) → ยื่นคำขอรับใบประกาศ → แอดมินตรวจและอนุมัติพร้อมแนบ PDF → ผู้เรียนดาวน์โหลดใบจากหน้า **บัญชีของฉัน** (`/account`)

> ระบบนี้ต้องมีเซิร์ฟเวอร์และฐานข้อมูล **ใช้บน GitHub Pages ไม่ได้** ต้อง deploy ที่ Vercel + Neon ตามด้านล่าง
> บน GitHub Pages ลิงก์ "เข้าสู่ระบบ" จะถูกซ่อนไว้ (ปิดด้วย `NUXT_PUBLIC_MEMBERS_ENABLED=false`)

## 1) Deploy ที่ Vercel
1. vercel.com → Add New → Project → Import `vpp-training` (Framework: Nuxt, **ไม่ต้องแก้ Build Command**)
   - ถ้าไม่เห็น repo ให้ไปที่ GitHub → Settings → Applications → Vercel → Configure → Repository access แล้วเพิ่ม `vpp-training`
2. ใส่ Environment Variables ก่อนกด Deploy

| ตัวแปร | ค่า |
|---|---|
| `BETTER_AUTH_SECRET` | สตริงสุ่มยาว ≥ 32 ตัวอักษร (เก็บเป็นความลับ) |
| `BETTER_AUTH_URL` | URL จริงของเว็บ เช่น `https://vpp-training.vercel.app` |
| `ADMIN_EMAILS` | อีเมลแอดมิน (คั่นด้วยจุลภาค) |
| `ADMIN_KEY` | (ไม่บังคับ) รหัสแอดมินพิเศษ ≥12 ตัวอักษร ใช้เข้า `/manage` โดยไม่ต้องยืนยันอีเมล (อีเมลต้องอยู่ใน `ADMIN_EMAILS` ด้วย) |
| `NUXT_PUBLIC_MEMBERS_ENABLED` | `true` |
| `RESEND_API_KEY`, `MAIL_FROM` | ดูข้อ 4 |
| `NUXT_PUBLIC_GOOGLE_LOGIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ดูข้อ 3 |

## 2) ฐานข้อมูล (Neon ผ่าน Vercel — ไม่ต้องรันคำสั่งเอง)
1. ในโปรเจกต์บน Vercel → แท็บ **Storage** → Create Database → **Neon** (Marketplace) → Connect to project
   - Vercel จะเพิ่ม `DATABASE_URL` ให้อัตโนมัติ (ระบบอ่านตัวแปรนี้เอง)
2. กด **Redeploy** ตอน build สคริปต์ `scripts/vercel-build.mjs` จะ **สร้าง/อัปเดตตารางให้อัตโนมัติ** (`drizzle-kit push`) ถ้าไม่มี `DATABASE_URL` จะข้ามขั้นนี้
- ใช้ Neon นอก Vercel ก็ได้: ตั้ง `DATABASE_URL` (หรือ `NUXT_DATABASE_URL`) เป็น connection string ของ Neon
- สร้างตารางเองจากเครื่อง: `DATABASE_URL="<connection string>" npm run db:push`
- ถ้าแก้ `server/db/schema.ts` แล้วการเปลี่ยนอาจทำให้ข้อมูลหาย `drizzle-kit push` จะหยุดและ build ล้ม ให้ตรวจก่อนแล้วค่อยดำเนินการ

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

## นำเข้าสมาชิกจากรายชื่อ (Excel)
แอดมินเข้า `/manage` → ส่วน "นำเข้าสมาชิกจากรายชื่อ" เลือกไฟล์ .xlsx ที่มีชีต `VPP 1`, `VPP 2`, ... (คอลัมน์ ชื่อ-สกุล / เบอร์โทรศัพท์ / อีเมล) → "ตรวจสอบก่อน" → "ยืนยันนำเข้า"
- ไฟล์ถูกอ่านในเบราว์เซอร์ ส่งเฉพาะชื่อ/อีเมล/เบอร์/รุ่นไปที่ฐานข้อมูล ไม่เก็บไฟล์ และ **ห้ามนำไฟล์รายชื่อใส่ใน GitHub**
- ข้ามแถวที่ไม่มีอีเมล อีเมลไม่ถูกต้อง หรือมีบัญชีอยู่แล้ว
- บัญชีที่นำเข้ายังไม่มีรหัสผ่าน: เข้าสู่ระบบด้วย Google (อีเมลเดียวกัน) หรือใช้ "ลืมรหัสผ่าน" (ต้องตั้ง Resend)
