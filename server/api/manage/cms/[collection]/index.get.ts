import { findCollection } from "#shared/cms";

// แอดมิน: รายการเนื้อหาในหมวด (ชื่อ + ค่าสำหรับเรียงลำดับ)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const col = findCollection(getRouterParam(event, "collection") || "");
  if (!col) throw createError({ statusCode: 404, message: "ไม่พบหมวดเนื้อหา" });
  if (col.name === "cohorts") return cohortCmsList(); // ตารางรุ่นแยก
  if (col.kind === "files") return col.files!.map((f) => ({ slug: f.name, title: f.label, sort: null, draft: false }));
  const items = await listItems(col.name);
  return items.map((it) => ({
    slug: it.slug,
    title: String(it.data[col.titleField] ?? it.slug),
    sort: col.sortField ? ((it.data[col.sortField] as string | number | undefined) ?? null) : null,
    draft: it.data.draft === true,
    sub: it.data.cohort ? String(it.data.cohort) : undefined,
  }));
});
