import { findCollection } from "#shared/cms";

// แอดมิน: สร้าง/แก้เนื้อหา (commit เข้า main)
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const col = findCollection(getRouterParam(event, "collection") || "");
  const slug = getRouterParam(event, "slug") || "";
  if (!col || !isValidSlug(col, slug)) throw createError({ statusCode: 422, message: "ชื่อไฟล์ (slug) ไม่ถูกต้อง ใช้ a-z 0-9 และ - เท่านั้น" });
  const body = (await readBody<{ values?: Record<string, unknown>; sha?: string }>(event)) || {};
  const values = body.values || {};
  const bad = validate(col, values);
  if (bad) throw createError({ statusCode: 422, message: bad });

  const path = `${col.dir}/${slug}.${col.ext}`;
  const existing = await repoRead(path);
  if (col.kind === "files" && !existing) throw createError({ statusCode: 404, message: "ไม่พบหน้านี้" });
  if (existing && body.sha !== existing.sha) {
    throw createError({ statusCode: 409, message: body.sha ? "เนื้อหานี้ถูกแก้ไขจากที่อื่นไปแล้ว กรุณาเปิดใหม่" : "มีไฟล์ชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" });
  }
  await repoWrite(path, Buffer.from(serializeEntry(col, values), "utf8"), `CMS: ${existing ? "แก้ไข" : "เพิ่ม"} ${col.name}/${slug} (โดย ${admin.email})`, existing?.sha);
  return { ok: true, slug };
});
