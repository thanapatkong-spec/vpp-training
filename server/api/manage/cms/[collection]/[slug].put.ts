import { findCollection } from "#shared/cms";
import { textsOf } from "#shared/siteSettings";

// แอดมิน: สร้าง/แก้เนื้อหา (บันทึกลงฐานข้อมูล มีผลบนเว็บทันที)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const col = findCollection(getRouterParam(event, "collection") || "");
  const slug = getRouterParam(event, "slug") || "";
  if (!col || !isValidSlug(col, slug)) throw createError({ statusCode: 422, message: "ชื่อไฟล์ (slug) ไม่ถูกต้อง ใช้ a-z 0-9 และ - เท่านั้น" });
  const body = (await readBody<{ values?: Record<string, unknown>; sha?: string }>(event)) || {};
  const values = body.values || {};
  if (col.name === "cohorts") return cohortCmsPut(slug, values, body.sha);
  const bad = validate(col, values);
  if (bad) throw createError({ statusCode: 422, message: bad });
  if (col.name === "settings") {
    for (const [k, label] of [["formPrefixes", "คำนำหน้าชื่อ"], ["formEducation", "วุฒิการศึกษา"]] as const) {
      if (Array.isArray(values[k]) && !textsOf(values[k] as { text: string }[]).length) throw createError({ statusCode: 422, message: `"${label}" ต้องมีอย่างน้อย 1 ตัวเลือก` });
    }
    const fee = String(values.councilFee ?? "").trim();
    if (fee && !/^\d{1,6}$/.test(fee)) throw createError({ statusCode: 422, message: "\"ค่าตรวจสอบคุณสมบัติ: จำนวนเงิน\" ต้องเป็นตัวเลขอย่างเดียว เช่น 500" });
  }
  await putItem(col.name, slug, values, body.sha);
  return { ok: true, slug };
});
