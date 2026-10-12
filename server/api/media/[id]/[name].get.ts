import { eq } from "drizzle-orm";
import { media } from "../../../db/schema";

// รูป/ไฟล์ที่อัปโหลดผ่านหน้าแอดมิน (เก็บในฐานข้อมูล) — เนื้อไฟล์ไม่เปลี่ยน จึงแคชได้นาน
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id") || "";
  if (!/^[0-9a-f-]{36}$/.test(id)) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });
  const [f] = await useDb()!.select().from(media).where(eq(media.id, id)).limit(1);
  if (!f) throw createError({ statusCode: 404, message: "ไม่พบไฟล์" });
  setResponseHeaders(event, {
    "content-type": f.contentType,
    "content-length": String(f.size),
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
    ...(f.contentType.startsWith("image/") || f.contentType === "application/pdf" ? {} : { "content-disposition": `attachment; filename="${f.name}"` }),
  });
  return f.data;
});
