# หน้าจัดการบทความ (CMS)

เปิดที่ **https://thanapatkong-spec.github.io/vpp-training/admin/**
ใช้ Sveltia CMS (เข้ากับ config แบบ Decap) บันทึกแล้วจะ commit เข้า `main` และ deploy อัตโนมัติภายใน 1–2 นาที

## ล็อกอินครั้งแรก (ใช้ GitHub token)
1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token
2. Repository access: **Only select repositories** → `vpp-training`
3. Permissions → Repository permissions → **Contents: Read and write**
4. คัดลอก token (ขึ้นต้น `github_pat_`) ไปวางที่หน้า `/admin/` ปุ่ม **Sign in with token**
- token เก็บในเบราว์เซอร์ของเครื่องนั้น อย่าส่งต่อให้คนอื่น และตั้งวันหมดอายุไว้
- คนที่จะเขียนบทความต้องมีบัญชี GitHub ที่ได้รับเชิญเป็น collaborator (สิทธิ์เขียน) ของ repo นี้

## ใช้งาน
- **บทความ → New บทความ**: กรอกชื่อ วันที่ รุ่น รูปปก ไฟล์ดาวน์โหลด และเนื้อหา (แทรกรูปในเนื้อหาด้วยปุ่มรูปภาพ)
- รูปและไฟล์ที่อัปโหลดจะอยู่ใน `public/uploads/`
- ติ๊ก "ฉบับร่าง" ถ้ายังไม่ให้ขึ้นเว็บ

## ข้อจำกัด
- หน้านี้ใช้กับ repo ที่เปิด GitHub Pages เท่านั้น ถ้าย้ายไป deploy แบบมีเซิร์ฟเวอร์ จะแทนด้วยหน้าแอดมินจริง
