import { findCollection } from "#shared/cms";

// แอดมิน: เปิดเนื้อหาหนึ่งรายการ
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const col = findCollection(getRouterParam(event, "collection") || "");
  const slug = getRouterParam(event, "slug") || "";
  if (!col || !isValidSlug(col, slug)) throw createError({ statusCode: 404, message: "ไม่พบเนื้อหา" });
  const f = await repoRead(`${col.dir}/${slug}.${col.ext}`);
  if (!f) throw createError({ statusCode: 404, message: "ไม่พบเนื้อหา" });
  return { slug, sha: f.sha, values: parseEntry(col, f.content.toString("utf8")) };
});
