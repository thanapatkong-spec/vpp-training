import { desc, eq, sql } from "drizzle-orm";
import { applications, payments, user } from "../../../db/schema";

// แอดมิน: รายการใบสมัคร (ปิดบังเลขบัตรประชาชน)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const rows = await useDb()!
    .select({
      id: applications.id, cohortId: applications.cohortId, packageId: applications.packageId, prefix: applications.prefix,
      firstName: applications.firstName, lastName: applications.lastName, nationalId: applications.nationalId, phone: applications.phone,
      workplace: applications.workplace, status: applications.status, createdAt: applications.createdAt, updatedAt: applications.updatedAt, email: user.email,
      payStatus: sql<string | null>`(select case when bool_or(${payments.status} = 'paid') then 'paid' when bool_or(${payments.status} = 'pending') then 'pending' else null end from ${payments} where ${payments.applicationId} = ${applications.id})`,
    })
    .from(applications)
    .innerJoin(user, eq(user.id, applications.userId))
    .orderBy(desc(applications.updatedAt));
  return rows.map((r) => ({ ...r, nationalId: maskId(r.nationalId) }));
});
