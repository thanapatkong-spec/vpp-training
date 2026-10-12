import type { Cohort } from "#shared/cohorts";

// รุ่นทั้งหมดจากฐานข้อมูล (รวมรุ่นที่ซ่อน — กรองเองตามหน้าที่ใช้) — แก้ในแอดมินแล้วเห็นทันที
export async function useCohorts() {
  const { data } = await useFetch<Cohort[]>("/api/cohorts", { key: "cohorts-api", default: () => [] });
  return computed(() => data.value ?? []);
}

// แบบไม่รอ (ใช้ในคอมโพเนนต์ย่อย) — ค่าว่างจนกว่าจะโหลดเสร็จ
export function useCohortList() {
  const { data } = useFetch<Cohort[]>("/api/cohorts", { key: "cohorts-api", default: () => [] });
  return computed(() => data.value ?? []);
}
