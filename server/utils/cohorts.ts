import type { H3Event } from "h3";
import { asc, eq, isNull, sql } from "drizzle-orm";
import YAML from "yaml";
import { cohortPrice, sortCohorts, toCohort, withVat, type Cohort } from "#shared/cohorts";
import { cohorts } from "../db/schema";

// รุ่นที่เปิดรับสมัคร — เก็บในฐานข้อมูล (แก้ในหน้าแอดมินแล้วมีผลทันที ไม่ต้องรอ build)
// ไฟล์ content/cohorts/*.yml ใช้เป็นข้อมูลตั้งต้น (คัดลอกเข้าฐานข้อมูลครั้งแรก) และสำหรับเว็บแบบ static

/** ข้อมูลจากไฟล์ที่ฝังมากับ build */
export async function bundledCohorts(): Promise<Cohort[]> {
  const st = useStorage("assets:content");
  const keys = (await st.getKeys("cohorts:")).filter((k) => /\.ya?ml$/.test(k));
  const list = await Promise.all(keys.map(async (k) => {
    const raw = await st.getItemRaw(k);
    const data = YAML.parse(typeof raw === "string" ? raw : Buffer.from(raw as Uint8Array).toString("utf8")) || {};
    return toCohort({ ...data, stem: k.replace(/^.*:/, "") });
  }));
  return sortCohorts(list);
}

let seeded = false;
async function seedOnce(db: NonNullable<ReturnType<typeof useDb>>) {
  if (seeded) return;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(cohorts);
  if (!n) {
    const rows = await bundledCohorts();
    if (rows.length) await db.insert(cohorts).values(rows.map(toRow)).onConflictDoNothing();
  }
  seeded = true;
}

export const toRow = (c: Cohort) => ({
  id: c.id, name: c.name, status: c.status, seats: c.seats ?? null, dates: c.dates ?? null, order: c.order,
  priceTheory: c.priceTheory, pricePractical: c.pricePractical, priceBundle: c.priceBundle, sessions: c.sessions,
});
const fromRow = (r: typeof cohorts.$inferSelect): Cohort => ({
  id: r.id, name: r.name, status: r.status as Cohort["status"], seats: r.seats ?? undefined, dates: r.dates ?? undefined, order: r.order,
  priceTheory: r.priceTheory, pricePractical: r.pricePractical, priceBundle: r.priceBundle, sessions: (r.sessions || []) as Cohort["sessions"],
});

/** รุ่นทั้งหมด (ไม่รวมที่ลบแล้ว) เรียงตามลำดับ — ไม่มีฐานข้อมูล (เว็บ static) ใช้ข้อมูลจากไฟล์ */
export async function getCohorts(_event?: H3Event): Promise<Cohort[]> {
  const db = useDb();
  if (!db) return bundledCohorts();
  await seedOnce(db);
  const rows = await db.select().from(cohorts).where(isNull(cohorts.deletedAt)).orderBy(asc(cohorts.order), asc(cohorts.id));
  return rows.map(fromRow);
}

export async function getCohort(event: H3Event, id: string) {
  return (await getCohorts(event)).find((c) => c.id === id);
}

/** แถวดิบ (รวมเวลาแก้ไขล่าสุด) สำหรับหน้าแอดมิน */
export async function getCohortRow(id: string) {
  const db = useDb()!;
  await seedOnce(db);
  const [r] = await db.select().from(cohorts).where(eq(cohorts.id, id)).limit(1);
  return r && !r.deletedAt ? { cohort: fromRow(r), version: r.updatedAt.toISOString() } : null;
}

/** ค่าเรียนตามรุ่นและแพ็กเกจ (รุ่นที่ถูกลบไปแล้ว ใช้ราคามาตรฐาน) */
export async function priceOf(event: H3Event, cohortId: string, packageId: string) {
  const db = useDb();
  if (!db) return cohortPrice((await bundledCohorts()).find((c) => c.id === cohortId), packageId);
  await seedOnce(db);
  const [r] = await db.select().from(cohorts).where(eq(cohorts.id, cohortId)).limit(1); // รวมรุ่นที่ลบแล้ว (ใบสมัครเก่ายังใช้ราคาเดิม)
  return cohortPrice(r ? fromRow(r) : undefined, packageId);
}

/** อัตรา VAT (%) จากตั้งค่าเว็บไซต์ (ค่าเริ่มต้น 7) */
export async function vatRate() {
  const n = Number.parseFloat((await getSiteSettings()).vatRate);
  return Number.isFinite(n) && n >= 0 ? n : 7;
}

/** ยอดที่ต้องโอนค่าเรียน = ราคารุ่น/แพ็กเกจ + VAT → { base, vat, rate, total } */
export async function tuitionDue(event: H3Event, cohortId: string, packageId: string) {
  const [base, rate] = await Promise.all([priceOf(event, cohortId, packageId), vatRate()]);
  return withVat(base, rate);
}
