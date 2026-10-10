import { eq } from "drizzle-orm";
import { z } from "zod";
import { applicationFiles, applications, memberProfiles, user } from "../../../../db/schema";

const Body = z.object({
  status: z.enum(["approved", "needs_changes", "rejected"]),
  adminNote: z.string().trim().max(1000).optional(),
  files: z.array(z.object({ id: z.string().uuid(), status: z.enum(["pending", "ok", "rejected"]), note: z.string().trim().max(300).optional() })).default([]),
});

// แอดมิน: ตรวจใบสมัคร (ผ่าน / ขอแก้ไข / ไม่ผ่าน) พร้อมสถานะเอกสารรายไฟล์
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const id = getRouterParam(event, "id")!;
  const p = Body.safeParse(await readBody(event));
  if (!p.success) throw createError({ statusCode: 422, message: "ข้อมูลไม่ถูกต้อง" });
  const b = p.data;
  if (b.status === "needs_changes" && !b.adminNote && !b.files.some((f) => f.status === "rejected")) {
    throw createError({ statusCode: 422, message: "กรุณาระบุสิ่งที่ต้องแก้ไข (หมายเหตุ หรือเลือกเอกสารที่ไม่ผ่าน)" });
  }
  const db = useDb()!;
  const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  if (!app) throw createError({ statusCode: 404, message: "ไม่พบใบสมัคร" });
  await db.transaction(async (tx) => {
    for (const f of b.files) {
      await tx.update(applicationFiles).set({ status: f.status, note: f.note || null }).where(eq(applicationFiles.id, f.id));
    }
    await tx.update(applications).set({ status: b.status, adminNote: b.adminNote || null, reviewedBy: admin.email, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(applications.id, id));
    if (b.status === "approved") {
      // เก็บเบอร์โทรไว้ในโปรไฟล์สมาชิก (ถ้ายังไม่มี)
      await tx.insert(memberProfiles).values({ userId: app.userId, phone: app.phone, imported: false }).onConflictDoNothing();
    }
  });
  const [owner] = await db.select({ email: user.email }).from(user).where(eq(user.id, app.userId)).limit(1);
  const fileRows = await db.select({ id: applicationFiles.id, kind: applicationFiles.kind }).from(applicationFiles).where(eq(applicationFiles.applicationId, id));
  const rejectedDocs = b.status === "needs_changes" ? b.files.filter((f) => f.status === "rejected").map((f) => ({ kind: fileRows.find((r) => r.id === f.id)?.kind || "", note: f.note })) : [];
  if (owner) await mailReviewed(app, owner.email, b.status, b.adminNote, rejectedDocs);
  return { ok: true };
});
