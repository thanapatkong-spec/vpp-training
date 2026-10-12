// รุ่นทั้งหมด (สด จากฐานข้อมูล) — ห้ามแคช เพื่อให้แก้ในแอดมินแล้วเห็นทันที
export default defineEventHandler((event) => {
  setResponseHeader(event, "cache-control", "no-store");
  return getCohorts(event);
});
