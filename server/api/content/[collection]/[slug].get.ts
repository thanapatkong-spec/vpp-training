import { findCollection } from "#shared/cms";

// หน้าเว็บ: เนื้อหาหนึ่งรายการ (บทความ/อัลบั้ม/หน้าเนื้อหา) พร้อม HTML ที่แปลงจาก Markdown แล้ว
const PUBLIC = ["articles", "albums", "pages"];
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "collection") || "";
  const slug = getRouterParam(event, "slug") || "";
  if (!PUBLIC.includes(name) || !findCollection(name)) throw createError({ statusCode: 404, message: "ไม่พบหมวดเนื้อหา" });
  setResponseHeader(event, "cache-control", "no-store");
  const it = await getItem(name, slug);
  if (!it || it.data.draft === true) throw createError({ statusCode: 404, message: "ไม่พบเนื้อหา" });
  return { slug: it.slug, ...it.data, html: it.body != null ? renderMarkdown(it.body) : undefined };
});
