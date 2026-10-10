import { desc, eq } from "drizzle-orm";
import { certificates } from "../../../../db/schema";

// แอดมิน: ใบประกาศทั้งหมดของสมาชิก
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  return useDb()!
    .select({ id: certificates.id, title: certificates.title, certNo: certificates.certNo, issuedOn: certificates.issuedOn, createdAt: certificates.createdAt })
    .from(certificates)
    .where(eq(certificates.userId, getRouterParam(event, "id")!))
    .orderBy(desc(certificates.createdAt));
});
