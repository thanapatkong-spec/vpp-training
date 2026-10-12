// ตั้งค่าเว็บไซต์ (ข้อความหน้าแรก, แพ็กเกจ, ติดต่อ, ฟอร์มสมัคร) — สด ไม่แคช
export default defineEventHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  return getSiteSettings();
});
