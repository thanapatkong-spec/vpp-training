import { eq } from "drizzle-orm";
import { z } from "zod";
import { certClaims } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const { adminNote } = z.object({ adminNote: z.string().trim().max(500).optional() }).parse((await readBody(event)) ?? {});
  const db = useDb()!;
  const [claim] = await db.select().from(certClaims).where(eq(certClaims.id, id)).limit(1);
  if (!claim) throw createError({ statusCode: 404, message: "ไม่พบคำขอ" });
  if (claim.status !== "pending") throw createError({ statusCode: 409, message: "คำขอนี้ถูกตรวจสอบแล้ว" });
  await db.update(certClaims).set({ status: "rejected", adminNote: adminNote || null, reviewedBy: admin.email, reviewedAt: new Date() }).where(eq(certClaims.id, id));
  return { ok: true };
});
