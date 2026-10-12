import type { H3Event } from "h3";
import YAML from "yaml";
import { cohortPrice, sortCohorts, toCohort, type Cohort } from "#shared/cohorts";

// รุ่นทั้งหมดจาก content/cohorts — อ่านจากไฟล์ที่ฝังมากับ build (server assets) เร็วกว่าเปิดฐานข้อมูลเนื้อหา
let cache: Cohort[] | null = null;
export async function getCohorts(_event?: H3Event): Promise<Cohort[]> {
  if (cache && !import.meta.dev) return cache;
  const st = useStorage("assets:cohorts");
  const keys = (await st.getKeys()).filter((k) => /\.ya?ml$/.test(k));
  const list = await Promise.all(keys.map(async (k) => {
    const raw = await st.getItemRaw(k);
    const data = YAML.parse(typeof raw === "string" ? raw : Buffer.from(raw as Uint8Array).toString("utf8")) || {};
    return toCohort({ ...data, stem: k.replace(/^.*:/, "") });
  }));
  return (cache = sortCohorts(list));
}

export async function getCohort(event: H3Event, id: string) {
  return (await getCohorts(event)).find((c) => c.id === id);
}

/** ค่าเรียนตามรุ่นและแพ็กเกจ (รุ่นที่ถูกลบไปแล้ว ใช้ราคามาตรฐาน) */
export async function priceOf(event: H3Event, cohortId: string, packageId: string) {
  return cohortPrice(await getCohort(event, cohortId), packageId);
}
