// Better Auth: สมัคร/เข้าสู่ระบบ/ออกจากระบบ/Google/ยืนยันอีเมล/รีเซ็ตรหัสผ่าน (ทุกเส้นทางภายใต้ /api/auth/*)
export default defineEventHandler((event) => useAuth().handler(toWebRequest(event)));
