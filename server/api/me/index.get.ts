// ข้อมูลผู้ใช้ปัจจุบัน + สถานะแอดมิน
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  return { id: u.id, name: u.name, email: u.email, emailVerified: u.emailVerified, isAdmin: u.isAdmin, adminCandidate: isAdminCandidate(u.email) };
});
