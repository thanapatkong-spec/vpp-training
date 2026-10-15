import { desc, eq, sql } from "drizzle-orm";
import { applications, payments } from "../../db/schema";

// ใบสมัครทั้งหมดของฉัน (ใบล่าสุดของแต่ละรุ่น) พร้อมสถานะการชำระ
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const rows = await useDb()!
    .select({
      id: applications.id, cohortId: applications.cohortId, packageId: applications.packageId, status: applications.status, councilCheck: applications.councilCheck, createdAt: applications.createdAt, updatedAt: applications.updatedAt,
      paid: sql<boolean>`exists (select 1 from ${payments} where ${payments.applicationId} = ${applications.id} and ${payments.status} = 'paid' and ${payments.kind} = 'tuition')`,
      council: sql<string | null>`(select case when bool_or(${payments.status} = 'paid') then 'paid' when bool_or(${payments.status} = 'pending') then 'pending' else null end from ${payments} where ${payments.applicationId} = ${applications.id} and ${payments.kind} = 'council')`,
    })
    .from(applications).where(eq(applications.userId, u.id)).orderBy(desc(applications.createdAt));
  const seen = new Set<string>();
  return rows.filter((r) => !seen.has(r.cohortId) && seen.add(r.cohortId));
});
