import { sortCohorts, toCohort } from "#shared/cohorts";

const fetchCohorts = () => useAsyncData("cohorts", () => queryCollection("cohorts").all());
const toList = (data: Ref<unknown[] | null | undefined>) => computed(() => sortCohorts((data.value ?? []).map((r) => toCohort(r as Record<string, any>))));

// รุ่นทั้งหมดจาก content/cohorts (รวมรุ่นที่ซ่อน — กรองเองตามหน้าที่ใช้) — ใช้ใน <script setup> ของหน้า
export async function useCohorts() {
  const { data } = await fetchCohorts();
  return toList(data);
}

// แบบไม่รอ (ใช้ในคอมโพเนนต์ย่อย) — ค่าว่างจนกว่าจะโหลดเสร็จ
export function useCohortList() {
  return toList(fetchCohorts().data);
}
