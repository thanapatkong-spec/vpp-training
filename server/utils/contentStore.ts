import { and, eq, isNull } from "drizzle-orm";
import { CMS_COLLECTIONS, findCollection, type CmsCollection } from "#shared/cms";
import { contentItems, contentSeeds } from "../db/schema";

// เนื้อหาเว็บในฐานข้อมูล (แทนไฟล์ใน GitHub) — แก้ในหน้าแอดมินแล้วมีผลทันที
// ครั้งแรกของแต่ละหมวด คัดลอกจากไฟล์ใน content/<หมวด>/ ที่ฝังมากับ build (server assets "content")

export type Item = { slug: string; data: Record<string, unknown>; body: string | null; updatedAt: Date };

const seeded = new Set<string>();
async function seed(col: CmsCollection) {
  if (seeded.has(col.name)) return;
  const db = useDb()!;
  const [done] = await db.select().from(contentSeeds).where(eq(contentSeeds.collection, col.name)).limit(1);
  if (!done) {
    const st = useStorage("assets:content");
    const prefix = `${(col.dir || "").replace(/^content\//, "")}:`;
    const keys = (await st.getKeys(prefix)).filter((k) => k.endsWith(`.${col.ext}`) && !k.slice(prefix.length).includes(":"));
    const rows = [];
    for (const k of keys) {
      const raw = await st.getItemRaw(k);
      const text = typeof raw === "string" ? raw : Buffer.from(raw as Uint8Array).toString("utf8");
      let v: Record<string, unknown> = {};
      try { v = parseEntry(col, text); } catch { continue; }
      const { body, ...data } = v;
      rows.push({ collection: col.name, slug: k.slice(prefix.length, -(col.ext!.length + 1)), data: cleanFields(col.fields, data), body: typeof body === "string" ? body : null });
    }
    if (rows.length) await db.insert(contentItems).values(rows).onConflictDoNothing();
    await db.insert(contentSeeds).values({ collection: col.name }).onConflictDoNothing();
  }
  seeded.add(col.name);
}

const colOf = (name: string) => {
  const c = findCollection(name);
  if (!c) throw createError({ statusCode: 404, message: "ไม่พบหมวดเนื้อหา" });
  return c;
};

export async function listItems(name: string): Promise<Item[]> {
  const col = colOf(name);
  await seed(col);
  const rows = await useDb()!.select().from(contentItems).where(and(eq(contentItems.collection, col.name), isNull(contentItems.deletedAt)));
  const items = rows.map((r) => ({ slug: r.slug, data: r.data || {}, body: r.body, updatedAt: r.updatedAt }));
  if (col.sortField) {
    const f = col.sortField, dir = col.sortDir === "desc" ? -1 : 1;
    items.sort((a, b) => {
      const x = a.data[f] as any, y = b.data[f] as any;
      return x === y ? a.slug.localeCompare(b.slug) : x == null ? 1 : y == null ? -1 : x > y ? dir : -dir;
    });
  }
  return items;
}

export async function getItem(name: string, slug: string): Promise<Item | null> {
  const col = colOf(name);
  await seed(col);
  const [r] = await useDb()!.select().from(contentItems).where(and(eq(contentItems.collection, col.name), eq(contentItems.slug, slug))).limit(1);
  return r && !r.deletedAt ? { slug: r.slug, data: r.data || {}, body: r.body, updatedAt: r.updatedAt } : null;
}

/** บันทึก (สร้าง/แก้) — version = updatedAt ตอนเปิด (กันแก้ทับกัน), ไม่ส่ง = สร้างใหม่ */
export async function putItem(name: string, slug: string, values: Record<string, unknown>, version?: string) {
  const col = colOf(name);
  const cur = await getItem(name, slug);
  if (col.kind === "folder" && cur && version !== cur.updatedAt.toISOString()) {
    throw createError({ statusCode: 409, message: version ? "เนื้อหานี้ถูกแก้ไขจากที่อื่นไปแล้ว กรุณาเปิดใหม่" : "มีรายการชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" });
  }
  if (col.kind === "files" && cur && version && version !== cur.updatedAt.toISOString()) throw createError({ statusCode: 409, message: "เนื้อหานี้ถูกแก้ไขจากที่อื่นไปแล้ว กรุณาเปิดใหม่" });
  const hasBody = col.fields.some((f) => f.type === "markdown");
  const row = {
    data: cleanFields(col.fields, values),
    body: hasBody && typeof values.body === "string" ? values.body.replace(/\r\n/g, "\n").trim() : null,
    updatedAt: new Date(),
    deletedAt: null,
  };
  await useDb()!.insert(contentItems).values({ collection: col.name, slug, ...row }).onConflictDoUpdate({ target: [contentItems.collection, contentItems.slug], set: row });
}

export async function deleteItem(name: string, slug: string) {
  const col = colOf(name);
  const r = await useDb()!.update(contentItems).set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(contentItems.collection, col.name), eq(contentItems.slug, slug), isNull(contentItems.deletedAt))).returning({ slug: contentItems.slug });
  if (!r.length) throw createError({ statusCode: 404, message: "ไม่พบเนื้อหา" });
}

export const contentCollections = () => CMS_COLLECTIONS.filter((c) => c.name !== "cohorts");
