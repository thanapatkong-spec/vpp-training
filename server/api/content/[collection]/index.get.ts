import { findCollection } from "#shared/cms";

// หน้าเว็บ: รายการเนื้อหาในหมวด (สดจากฐานข้อมูล ไม่แคช) — บทความฉบับร่างไม่แสดง, รายการไม่ส่งเนื้อหายาว
const PUBLIC = ["articles", "faq", "documents", "albums"];
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "collection") || "";
  if (!PUBLIC.includes(name) || !findCollection(name)) throw createError({ statusCode: 404, message: "ไม่พบหมวดเนื้อหา" });
  setResponseHeader(event, "cache-control", "no-store");
  const items = await listItems(name);
  return items.filter((it) => it.data.draft !== true).map((it) => ({ slug: it.slug, ...it.data }));
});
