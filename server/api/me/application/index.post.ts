import { and, desc, eq, inArray } from "drizzle-orm";
import { APP_DOCS } from "#shared/application";
import { applicationFiles, applications } from "../../../db/schema";

// ส่งใบสมัครใหม่ / ส่งแก้ไข (เมื่อแอดมินขอแก้) พร้อมเอกสาร
export default defineEventHandler(async (event) => {
  const u = await requireUser(event);
  const { values, docs } = await readApplicationForm(event);
  const db = useDb()!;
  const [cur] = await db.select().from(applications).where(eq(applications.userId, u.id)).orderBy(desc(applications.createdAt)).limit(1);

  if (cur && (cur.status === "submitted" || cur.status === "approved")) {
    throw createError({ statusCode: 409, message: cur.status === "approved" ? "ใบสมัครของคุณผ่านการตรวจสอบแล้ว" : "ส่งใบสมัครแล้ว กรุณารอแอดมินตรวจสอบ" });
  }

  if (cur && cur.status === "needs_changes") {
    // ต้องแนบใหม่เฉพาะเอกสารที่ถูกตีกลับ (หรือยังไม่มี)
    const existing = await db.select({ id: applicationFiles.id, kind: applicationFiles.kind, status: applicationFiles.status }).from(applicationFiles).where(eq(applicationFiles.applicationId, cur.id));
    for (const d of APP_DOCS) {
      const have = existing.find((e) => e.kind === d.kind && e.status !== "rejected");
      if (!have && !docs.some((x) => x.kind === d.kind)) throw createError({ statusCode: 422, message: `กรุณาแนบ${d.label}ใหม่` });
    }
    await db.transaction(async (tx) => {
      await tx.update(applications).set({ ...values, status: "submitted", updatedAt: new Date() }).where(eq(applications.id, cur.id));
      const replace = docs.map((d) => d.kind);
      if (replace.length) await tx.delete(applicationFiles).where(and(eq(applicationFiles.applicationId, cur.id), inArray(applicationFiles.kind, replace)));
      for (const d of docs) await tx.insert(applicationFiles).values({ applicationId: cur.id, kind: d.kind, name: d.name, contentType: d.contentType, size: d.data.length, data: d.data });
    });
    await mailSubmitted(values, u.email, true);
    return { ok: true, id: cur.id };
  }

  // ใบสมัครใหม่ (ครั้งแรก หรือครั้งก่อนไม่ผ่าน)
  for (const d of APP_DOCS) if (!docs.some((x) => x.kind === d.kind)) throw createError({ statusCode: 422, message: `กรุณาแนบ${d.label}` });
  const id = await db.transaction(async (tx) => {
    const [row] = await tx.insert(applications).values({ ...values, userId: u.id }).returning({ id: applications.id });
    for (const d of docs) await tx.insert(applicationFiles).values({ applicationId: row!.id, kind: d.kind, name: d.name, contentType: d.contentType, size: d.data.length, data: d.data });
    return row!.id;
  });
  await mailSubmitted(values, u.email);
  return { ok: true, id };
});
