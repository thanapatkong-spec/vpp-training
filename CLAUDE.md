# VPP Training — คู่มือสำหรับ Claude Code

เว็บหลักสูตรผู้ช่วยสัตวแพทย์ด้านการพยาบาลสัตว์ (VPP) ความร่วมมือ Dr.John Pet × รพส.คชาเวท
- เว็บจริง: https://vpp-training.vercel.app (Vercel ทีม Drjohn, region sin1) · ฐานข้อมูล Neon Postgres (Singapore)
- GitHub Pages (thanapatkong-spec.github.io/vpp-training) เลิกใช้แล้ว เหลือหน้าส่งต่อไป Vercel
- โดเมน www.vetvpp.com ชี้มาที่ Vercel แล้ว (DNS ที่ Squarespace) · โดเมนที่ล็อกอินได้ตั้งใน `trustedOrigins` (server/utils/auth.ts) + env `TRUSTED_ORIGINS`

## สแต็ก
| ส่วน | ใช้อะไร |
|---|---|
| โฮสต์ | **Vercel** (ทีม Drjohn, region `sin1`) deploy อัตโนมัติเมื่อ merge เข้า main · โดเมน www.vetvpp.com (DNS ที่ Squarespace) + vpp-training.vercel.app |
| โค้ด | GitHub `thanapatkong-spec/vpp-training` (public) · GitHub Pages เลิกใช้ เหลือหน้า redirect (`.github/workflows/pages.yml`) |
| หน้าเว็บ | **Nuxt 4 + Vue 3** (TypeScript) · **Tailwind CSS v4** (`@tailwindcss/vite`) · ฟอนต์ IBM Plex Sans Thai (`@fontsource`) · ไอคอน `lucide-vue-next` |
| ฝั่งเบราว์เซอร์ | `qrcode` (QR ชำระเงิน) · `pdf-lib` + `pdfjs-dist` (ย่อ PDF/รูปก่อนอัปโหลด `app/utils/shrinkUpload.ts`) |
| หลังบ้าน | **Nitro** (`server/api`) · **Zod** ตรวจข้อมูล · `marked` แปลง Markdown (ตัด script/on* ออก) · `yaml` อ่านข้อมูลตั้งต้น · `read-excel-file` นำเข้าสมาชิกจาก Excel |
| ฐานข้อมูล | **Neon Postgres** (Singapore) ผ่าน `postgres` (postgres-js) · **Drizzle ORM** + `drizzle-kit push` ตอน deploy |
| ไฟล์อัปโหลด | เก็บในฐานข้อมูล (ตาราง `media`, เสิร์ฟที่ `/api/media/...`) · ตั้ง `BLOB_READ_WRITE_TOKEN` แล้วใช้ **Vercel Blob** (`@vercel/blob`) แทน |
| ล็อกอิน | **Better Auth** (อีเมล/รหัสผ่าน + Google, cookie cache 5 นาที) · แอดมิน = `ADMIN_EMAILS` + `ADMIN_KEY` |
| อีเมล | `nodemailer` ผ่าน **Gmail SMTP** ของ info@vetvpp.com (`SMTP_USER`/`SMTP_PASS` = app password) หรือ **Resend** สำรอง · ส่งเบื้องหลังด้วย `background()` (`@vercel/functions` waitUntil) |
| ชำระเงิน | ค่าเรียน: QR ชำระบิล SCB ของบริษัท (ยอดรวม VAT) + แนบสลิป → แอดมินตรวจ (หรือตรวจสลิปอัตโนมัติถ้าตั้งค่า) · ค่าตรวจสอบคุณสมบัติ: โอนให้สัตวแพทยสภาเอง แนบหลักฐานแยก (`payments.kind = council`) |
| เครื่องมือพัฒนา | TypeScript + `vue-tsc` · ทดสอบด้วย Playwright (Chromium) กับ dev server ก่อนส่งงาน |

## โครงสร้างสำคัญ
- `server/db/schema.ts` — ตารางทั้งหมด (สมาชิก, ใบประกาศ, ใบสมัคร, ชำระเงิน, `cohorts`, `content_items`, `media`)
- `server/utils/` — auth (`requireUser`/`requireAdmin`, ADMIN_EMAILS + ADMIN_KEY), contentStore (เนื้อหาใน DB), cohorts, siteSettings, mailer, appMail, markdown
- `shared/` — ใช้ร่วมหน้าเว็บ/เซิร์ฟเวอร์: `cms.ts` (หมวดเนื้อหา+ฟิลด์ฟอร์มแอดมิน), `cohorts.ts`, `siteSettings.ts` (ค่าเริ่มต้นข้อความเว็บ), `application.ts`, `promptpay.ts`
- `app/pages/manage/index.vue` — หน้าแอดมิน (ใบสมัคร, ตรวจการชำระเงิน, สมาชิกและใบประกาศ, เนื้อหาเว็บ)
- เนื้อหาเว็บทั้งหมดเก็บในฐานข้อมูล แก้ในแอดมินแล้วเห็นทันที · `content/` = ข้อมูลตั้งต้น คัดลอกเข้า DB ครั้งแรกเท่านั้น (แก้ไฟล์แล้วไม่มีผล)
- ใบสมัครแยกตามรุ่น (`/apply?cohort=<id>`) · flow: ส่งใบสมัคร → เอกสารผ่าน (`status=approved`) → ผลตรวจคุณสมบัติสัตวแพทยสภา (`council_check=passed`) → เปิด QR ค่าเรียน (ราคารุ่น + VAT ตามตั้งค่าเว็บไซต์) · ค่าตรวจสอบคุณสมบัติส่งหลักฐานได้ทุกเมื่อหลังส่งใบสมัคร

## คำสั่ง
```bash
npm ci
cp .env.example .env            # หรือ: npx vercel env pull .env  (ดึงค่าจาก Vercel)
npm run db:push                 # สร้าง/อัปเดตตาราง (ใช้ฐานข้อมูลทดสอบ ไม่ใช่ของจริง)
npm run dev                     # http://localhost:3000
npx nuxi build                  # ตรวจว่า build ผ่านก่อน push
```
Deploy: Vercel รัน `scripts/vercel-build.mjs` (สร้างตารางด้วย `scripts/db-bootstrap.sql` → `drizzle-kit push` → `nuxt build`)
เพิ่มตารางใหม่: เพิ่มใน schema.ts + ชื่อตารางใน `drizzle.config.ts` (tablesFilter) + CREATE TABLE IF NOT EXISTS ใน `scripts/db-bootstrap.sql`

## วิธีทำงานกับเจ้าของโปรเจกต์ (สำคัญ)
- ตอบเป็นภาษาไทย อธิบายแบบไม่ใช้ศัพท์เทคนิคเกินจำเป็น
- ทุกการแก้: ทำบน branch → push → **เปิด PR ทุกครั้ง** เจ้าของเป็นคน merge เอง (ห้าม merge เอง) · ก่อนเพิ่ม commit ให้เช็กว่า PR เดิมยังไม่ถูก merge
- ทดสอบจริงก่อนส่ง (เช่น Playwright กับ dev server) และบอกตรง ๆ ว่าอะไรทดสอบแล้ว/ยังไม่ได้ทดสอบ
- ห้ามขอหรือใส่ secret (token, API key, ADMIN_KEY, รหัสผ่าน) ในแชทหรือใน repo (repo เป็น public) · ห้ามใส่ข้อมูลส่วนบุคคล/ไฟล์รายชื่อสมาชิกลง repo
- ไม่พูดถึงราคาในบทความ/หน้าเนื้อหา (ราคาอยู่ที่ข้อมูลรุ่น หน้าแรก ฟอร์มสมัคร และ FAQ ข้อ 02 เท่านั้น)

## งานค้าง / ไอเดียถัดไป
- เชื่อม Vercel Blob สำหรับรูปที่อัปโหลด (ตอนนี้เก็บในฐานข้อมูลตาราง `media`)
- ระบบแต้ม E-learning ต่อใบอนุญาต VPP, ใบเสร็จ PDF, นับที่นั่งอัตโนมัติ, ออกใบประกาศเป็นชุด (รอรายละเอียดจากเจ้าของ)
- บัญชี info@vetvpp.com: ถอด iPhone 15 ที่ขายไปออกจากบัญชี, ตั้ง 2-Step ใหม่ (ถ้าเปลี่ยนรหัสผ่าน ต้องสร้าง app password ใหม่ แล้วแก้ `SMTP_PASS`)
