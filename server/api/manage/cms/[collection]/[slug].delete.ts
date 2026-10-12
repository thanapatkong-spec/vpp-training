import { findCollection } from "#shared/cms";

// แอดมิน: ลบเนื้อหา (หน้าเนื้อหาคงที่ลบไม่ได้)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const col = findCollection(getRouterParam(event, "collection") || "");
  const slug = getRouterParam(event, "slug") || "";
  if (!col || col.kind !== "folder" || !isValidSlug(col, slug)) throw createError({ statusCode: 404, message: "ไม่พบเนื้อหา" });
  if (col.name === "cohorts") return cohortCmsDelete(slug);
  await deleteItem(col.name, slug);
  return { ok: true };
});
