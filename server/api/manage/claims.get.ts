import { desc, eq } from "drizzle-orm";
import { certClaims, user } from "../../db/schema";

// แอดมิน: รายการคำขอทั้งหมด (รอตรวจขึ้นก่อน)
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const rows = await useDb()!
    .select({
      id: certClaims.id, fullName: certClaims.fullName, cohort: certClaims.cohort, completedOn: certClaims.completedOn,
      note: certClaims.note, status: certClaims.status, adminNote: certClaims.adminNote, createdAt: certClaims.createdAt,
      email: user.email, accountName: user.name,
    })
    .from(certClaims)
    .innerJoin(user, eq(user.id, certClaims.userId))
    .orderBy(desc(certClaims.createdAt));
  const order = { pending: 0, approved: 1, rejected: 2 } as const;
  return rows.sort((a, b) => order[a.status] - order[b.status]);
});
