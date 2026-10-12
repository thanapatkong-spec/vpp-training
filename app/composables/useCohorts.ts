import { sortCohorts, toCohort, type Cohort } from "#shared/cohorts";

// รุ่นทั้งหมด (รวมรุ่นที่ซ่อน — กรองเองตามหน้าที่ใช้)
// เว็บที่มีเซิร์ฟเวอร์ (Vercel): ดึงสดจาก /api/cohorts (ฐานข้อมูล) — แก้ในแอดมินแล้วเห็นทันที
// เว็บ static (GitHub Pages): อ่านจาก content/cohorts ที่ build ไว้
export async function useCohorts() {
  if (useRuntimeConfig().public.membersEnabled) {
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
