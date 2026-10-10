import { findCollection } from "#shared/cms";

// แอดมิน: ลบเนื้อหา (ลบหน้าถาวรไม่ได้)
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const col = findCollection(getRouterParam(event, "collection") || "");
  const slug = getRouterParam(event, "slug") || "";
  if (!col || col.kind !== "folder" || !isValidSlug(col, slug)) throw createError({ statusCode: 404, message: "ไม่พบเนื้อหา" });
  const path = `${col.dir}/${slug}.${col.ext}`;
  const f = await repoRead(path);
  if (!f) throw createError({ statusCode: 404, message: "ไม่พบเนื้อหา" });
  await repoDelete(path, f.sha, `CMS: ลบ ${col.name}/${slug} (โดย ${admin.email})`);
  return { ok: true };
});
