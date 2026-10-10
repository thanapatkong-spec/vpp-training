import { eq } from "drizzle-orm";
import { certClaims, certFiles, certificates } from "../../../../db/schema";

// แอดมิน: อนุมัติคำขอ พร้อมแนบไฟล์ใบประกาศ PDF/JPG/PNG (multipart: file, certNo?, title?, issuedOn?, adminNote?)
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const att = await readAttachment(event);
  const f = att.fields;

  const db = useDb()!;
  const [claim] = await db.select().from(certClaims).where(eq(certClaims.id, id)).limit(1);
  if (!claim) throw createError({ statusCode: 404, message: "ไม่พบคำขอ" });
  if (claim.status !== "pending") throw createError({ statusCode: 409, message: "คำขอนี้ถูกตรวจสอบแล้ว" });

  await db.transaction(async (tx) => {
    const [stored] = await tx
      .insert(certFiles)
      .values({ name: att.name, contentType: att.contentType, size: att.data.length, data: att.data })
      .returning({ id: certFiles.id });
    if (!stored) throw createError({ statusCode: 500, message: "บันทึกไฟล์ไม่สำเร็จ" });
    await tx.insert(certificates).values({
      userId: claim.userId,
      claimId: claim.id,
      title: f.title || `ประกาศนียบัตรผู้ช่วยสัตวแพทย์ด้านการพยาบาลสัตว์ (${claim.cohort})`,
      certNo: f.certNo || null,
      issuedOn: f.issuedOn || null,
      fileId: stored.id,
    });
    await tx
      .update(certClaims)
      .set({ status: "approved", adminNote: f.adminNote || null, reviewedBy: admin.email, reviewedAt: new Date() })
      .where(eq(certClaims.id, id));
  });
  return { ok: true };
});
