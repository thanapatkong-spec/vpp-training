import { findCollection } from "#shared/cms";

// แอดมิน: รายการเนื้อหาในหมวด (ชื่อ + ค่าสำหรับเรียงลำดับ)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const col = findCollection(getRouterParam(event, "collection") || "");
  if (!col) throw createError({ statusCode: 404, message: "ไม่พบหมวดเนื้อหา" });

  const names = col.kind === "files" ? col.files!.map((f) => f.name) : (await repoList(col.dir!)).filter((n) => n.endsWith(`.${col.ext}`)).map((n) => n.slice(0, -(col.ext!.length + 1)));
  const items = await Promise.all(
    names.map(async (slug) => {
      const f = await repoRead(`${col.dir}/${slug}.${col.ext}`);
      if (!f) return null;
      let v: Record<string, unknown> = {};
      try { v = parseEntry(col, f.content.toString("utf8")); } catch {}
      const label = col.kind === "files" ? col.files!.find((x) => x.name === slug)!.label : String(v[col.titleField] ?? slug);
      return { slug, title: label, sort: col.sortField ? (v[col.sortField] as string | number | undefined) ?? null : null, draft: v.draft === true, sub: v.cohort ? String(v.cohort) : undefined };
    }),
  );
  const rows = items.filter((x): x is NonNullable<typeof x> => !!x);
  if (col.sortField) {
    const dir = col.sortDir === "desc" ? -1 : 1;
    rows.sort((a, b) => (a.sort === b.sort ? 0 : a.sort == null ? 1 : b.sort == null ? -1 : a.sort! > b.sort! ? dir : -dir));
  }
  return rows;
});
