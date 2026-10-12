// รุ่นที่เปิดรับสมัคร — แก้ในหน้าแอดมิน > เนื้อหาเว็บ > รุ่นที่เปิดรับสมัคร (ไฟล์ content/cohorts/<รหัสรุ่น>.yml)
import { PACKAGES, type PackageId } from "./config";
import type { SiteSettings } from "./siteSettings";

export type CohortStatus = "open" | "full" | "closed" | "hidden";
export type SessionIcon = "theory" | "exam" | "practical" | "other";

export interface CohortSession {
  icon?: SessionIcon;
  title: string;
  date?: string;
  time?: string;
  extra?: string;
}

export interface Cohort {
  id: string; // ชื่อไฟล์ เช่น 2569-11 (ใช้อ้างอิงในใบสมัคร)
  name: string;
  status: CohortStatus;
  seats?: number;
  dates?: string; // ช่วงวันเรียนแบบสั้น แสดงในฟอร์มสมัคร
  order: number;
  priceTheory: number;
  pricePractical: number;
  priceBundle: number;
  sessions: CohortSession[];
}

export const COHORT_STATUS: Record<CohortStatus, string> = {
  open: "เปิดรับสมัคร",
  full: "เต็มแล้ว",
  closed: "ปิดรับสมัคร",
  hidden: "ซ่อน (ไม่แสดงบนเว็บ)",
};

// ข้อมูลจากไฟล์ content/cohorts/<id>.yml → Cohort (id = ชื่อไฟล์)
export function toCohort(row: Record<string, any>): Cohort {
  const stem = String(row.stem || row.id || "").split("/").pop()!.replace(/\.ya?ml$/, "");
  return {
    id: stem,
    name: row.name,
    status: row.status || "open",
    seats: row.seats ?? undefined,
    dates: row.dates || undefined,
    order: row.order ?? 100,
    priceTheory: row.priceTheory ?? 0,
    pricePractical: row.pricePractical ?? 0,
    priceBundle: row.priceBundle ?? 0,
    sessions: row.sessions || [],
  };
}

export const sortCohorts = (list: Cohort[]) => [...list].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

export function cohortPrice(c: Pick<Cohort, "priceTheory" | "pricePractical" | "priceBundle"> | undefined, packageId: string) {
  if (!c) return PACKAGES.find((p) => p.id === packageId)?.price ?? 0;
  return packageId === "theory" ? c.priceTheory : packageId === "practical" ? c.pricePractical : packageId === "bundle" ? c.priceBundle : 0;
}

type PkgNames = Partial<Pick<SiteSettings, "pkgTheoryName" | "pkgTheorySub" | "pkgPracticalName" | "pkgPracticalSub" | "pkgBundleName">>;

/** แพ็กเกจพร้อมราคาของรุ่น (ส่วนลดแพ็กเกจครบ 2 ภาค คำนวณจากราคาแยก) · names = ชื่อจากตั้งค่าเว็บไซต์ */
export function cohortPackages(c: Cohort | undefined, names: PkgNames = {}) {
  const full = c ? c.priceTheory + c.pricePractical : 0;
  return PACKAGES.map((base) => {
    const p = { ...base };
    if (p.id === "theory") { p.short = names.pkgTheoryName || p.short; p.sub = names.pkgTheorySub || p.sub; p.label = `${p.short} (${p.sub})`; }
    if (p.id === "practical") { p.short = names.pkgPracticalName || p.short; p.sub = names.pkgPracticalSub || p.sub; p.label = `${p.short} ${p.sub}`; }
    if (p.id === "bundle") p.short = names.pkgBundleName || p.short;
    const price = cohortPrice(c, p.id);
    if (p.id !== "bundle" || !c) return { ...p, price };
    const save = full - price;
    return { ...p, price, full, save, label: save > 0 ? `${p.short} (ประหยัด ${save.toLocaleString("th-TH")} บาท)` : p.short, sub: save > 0 ? `ประหยัด ${save.toLocaleString("th-TH")} บาท` : "ทฤษฎี + ปฏิบัติ" };
  }) as ((typeof PACKAGES)[number] & { id: PackageId; full?: number; save?: number })[];
}
