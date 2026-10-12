import { and, eq, isNull } from "drizzle-orm";
import { COHORT_STATUS, type Cohort, type CohortStatus } from "#shared/cohorts";
import { findCollection } from "#shared/cms";
import { cohorts } from "../db/schema";

// หน้าแอดมิน > เนื้อหาเว็บ > รุ่นที่เปิดรับสมัคร: อ่าน/เขียนฐานข้อมูลโดยตรง (มีผลบนเว็บทันที)
const col = () => findCollection("cohorts")!;
const num = (v: unknown) => (v === "" || v == null ? undefined : Math.trunc(Number(v)));
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export async function cohortCmsList() {
  const list = await getCohorts();
  return list.map((c) => ({ slug: c.id, title: c.name, sort: c.order, draft: false, sub: `${c.id} · ${COHORT_STATUS[c.status] ?? c.status}` }));
}

export async function cohortCmsGet(id: string) {
  const r = await getCohortRow(id);
  if (!r) throw createError({ statusCode: 404, message: "ไม่พบรุ่นนี้" });
  const { id: _id, ...values } = r.cohort;
  return { slug: id, sha: r.version, values };
}

export async function cohortCmsPut(id: string, values: Record<string, unknown>, version?: string) {
  const bad = validate(col(), values);
  if (bad) throw createError({ statusCode: 422, message: bad });
  const db = useDb()!;
  const cur = await getCohortRow(id);
  if (cur && version !== cur.version) {
    throw createError({ statusCode: 409, message: version ? "รุ่นนี้ถูกแก้ไขจากที่อื่นไปแล้ว กรุณาเปิดใหม่" : "มีรุ่นรหัสนี้อยู่แล้ว กรุณาใช้รหัสอื่น" });
  }
  const sessions = (Array.isArray(values.sessions) ? values.sessions : [])
    .map((s: any) => ({ icon: str(s?.icon) || "other", title: str(s?.title) || "", date: str(s?.date), time: str(s?.time), extra: str(s?.extra) }))
    .filter((s) => s.title);
  const row = {
    name: str(values.name)!, status: (str(values.status) || "open") as CohortStatus, seats: num(values.seats) ?? null, dates: str(values.dates) ?? null,
    order: num(values.order) ?? 100, priceTheory: num(values.priceTheory) ?? 0, pricePractical: num(values.pricePractical) ?? 0, priceBundle: num(values.priceBundle) ?? 0,
    sessions: sessions as Cohort["sessions"], updatedAt: new Date(), deletedAt: null,
  };
  // รหัสเดิมที่เคยลบไปแล้ว: สร้างทับได้ (คืนชีพ)
  await db.insert(cohorts).values({ id, ...row }).onConflictDoUpdate({ target: cohorts.id, set: row });
  return { ok: true, slug: id };
}

export async function cohortCmsDelete(id: string) {
  const db = useDb()!;
  const r = await db.update(cohorts).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(cohorts.id, id), isNull(cohorts.deletedAt))).returning({ id: cohorts.id });
  if (!r.length) throw createError({ statusCode: 404, message: "ไม่พบรุ่นนี้" });
  return { ok: true };
}
