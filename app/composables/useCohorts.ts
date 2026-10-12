import { sortCohorts, toCohort, type Cohort } from "#shared/cohorts";

// รุ่นทั้งหมด (รวมรุ่นที่ซ่อน — กรองเองตามหน้าที่ใช้)
// หน้าที่เรนเดอร์ล่วงหน้า (หน้าแรก) อ่านจาก content โดยตรง / หน้าสมาชิก (เรนเดอร์ในเบราว์เซอร์) ดึงจาก /api/cohorts ซึ่งเบากว่ามาก
export async function useCohorts(opts: { api?: boolean } = {}) {
  if (opts.api) {
    const { data } = await useFetch<Cohort[]>("/api/cohorts", { key: "cohorts-api", default: () => [] });
    return computed(() => data.value ?? []);
  }
  const { data } = await useAsyncData("cohorts", () => queryCollection("cohorts").all());
  return computed(() => sortCohorts((data.value ?? []).map((r) => toCohort(r as Record<string, any>))));
}

// แบบไม่รอ (ใช้ในคอมโพเนนต์ย่อยของหน้าสมาชิก) — ค่าว่างจนกว่าจะโหลดเสร็จ
export function useCohortList() {
  const { data } = useFetch<Cohort[]>("/api/cohorts", { key: "cohorts-api", default: () => [] });
  return computed(() => data.value ?? []);
}
