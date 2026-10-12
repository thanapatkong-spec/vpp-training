import type { H3Event } from "h3";
import { queryCollection } from "@nuxt/content/server";
import { cohortPrice, sortCohorts, toCohort, type Cohort } from "#shared/cohorts";

// รุ่นทั้งหมดจาก content/cohorts (ข้อมูลเดียวกับที่แสดงบนเว็บ)
export async function getCohorts(event: H3Event): Promise<Cohort[]> {
  const rows = await queryCollection(event, "cohorts").all();
  return sortCohorts(rows.map((r) => toCohort(r as Record<string, any>)));
}

export async function getCohort(event: H3Event, id: string) {
  return (await getCohorts(event)).find((c) => c.id === id);
}

/** ค่าเรียนตามรุ่นและแพ็กเกจ (รุ่นที่ถูกลบไปแล้ว ใช้ราคามาตรฐาน) */
export async function priceOf(event: H3Event, cohortId: string, packageId: string) {
  return cohortPrice(await getCohort(event, cohortId), packageId);
}
