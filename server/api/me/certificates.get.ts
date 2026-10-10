import { desc, eq } from "drizzle-orm";
import { certificates } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  return useDb()!
    .select({ id: certificates.id, title: certificates.title, certNo: certificates.certNo, issuedOn: certificates.issuedOn, createdAt: certificates.createdAt })
    .from(certificates)
    .where(eq(certificates.userId, u.id))
    .orderBy(desc(certificates.createdAt));
});
