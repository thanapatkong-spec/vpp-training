import { desc, eq } from "drizzle-orm";
import { certClaims } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  return useDb()!.select().from(certClaims).where(eq(certClaims.userId, u.id)).orderBy(desc(certClaims.createdAt));
});
