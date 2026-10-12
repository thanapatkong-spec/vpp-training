import { findCollection } from "#shared/cms";
import { mergeSettings } from "#shared/siteSettings";

// แอดมิน: เปิดเนื้อหาหนึ่งรายการ
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const col = findCollection(getRouterParam(event, "collection") || "");
  const slug = getRouterParam(event, "slug") || "";
  if (!col || !isValidSlug(col, slug)) throw createError({ statusCode: 404, message: "ไม่พบเนื้อหา" });
  if (col.name === "cohorts") return cohortCmsGet(slug);
  const it = await getItem(col.name, slug);
  // ตั้งค่าเว็บไซต์: เปิดฟอร์มพร้อมค่าที่ใช้อยู่จริง (ที่บันทึกไว้ + ค่าเริ่มต้น)
  if (col.name === "settings") return { slug, sha: it?.updatedAt.toISOString(), values: mergeSettings(it?.data as never) };
  if (!it) {
    if (col.kind === "files") return { slug, sha: undefined, values: {} }; // ยังไม่เคยบันทึก (เช่น ตั้งค่าเว็บไซต์) = ใช้ค่าเริ่มต้น
    throw createError({ statusCode: 404, message: "ไม่พบเนื้อหา" });
  }
  return { slug, sha: it.updatedAt.toISOString(), values: { ...it.data, ...(it.body != null ? { body: it.body } : {}) } };
});
