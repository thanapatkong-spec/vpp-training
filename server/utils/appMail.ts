import { APP_DOCS } from "#shared/application";
import { PACKAGES } from "#shared/config";

// อีเมลแจ้งผู้สมัคร/ทีมงาน ตามขั้นตอนใบสมัครและการชำระเงิน (ผู้รับกดตอบกลับถึงทีมงานได้)
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const adminEmails = () => (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
const site = () => (process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
type App = { prefix: string; firstName: string; lastName: string; packageId: string; workplace?: string };
const fullName = (a: App) => `${a.prefix}${a.firstName} ${a.lastName}`;
export const priceOf = (packageId: string) => PACKAGES.find((p) => p.id === packageId)?.price ?? 0;

function layout(title: string, lines: string[], cta?: { url: string; label: string }) {
  const html = `<div style="font-family:sans-serif;max-width:560px;line-height:1.6;color:#0f2742"><h2 style="color:#0b2f5b">${esc(title)}</h2>${lines.map((l) => `<p>${l}</p>`).join("")}${cta ? `<p><a href="${esc(cta.url)}" style="display:inline-block;background:#f26b1d;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none">${esc(cta.label)}</a></p>` : ""}<p style="color:#64748b;font-size:13px">มีข้อสงสัย ตอบกลับอีเมลนี้ได้เลย · ทีมงาน VPP (Dr.John x คชาเว็ท)</p></div>`;
  const text = [title, ...lines.map((l) => l.replace(/<[^>]+>/g, "")), cta ? `${cta.label}: ${cta.url}` : "", "มีข้อสงสัย ตอบกลับอีเมลนี้ได้เลย · ทีมงาน VPP"].filter(Boolean).join("\n\n");
  return { html, text };
}

export async function mailSubmitted(a: App, to: string, resubmit = false) {
  const m = layout(resubmit ? "ได้รับใบสมัครที่แก้ไขแล้ว" : "ได้รับใบสมัครเรียน VPP แล้ว", [
    `เรียน ${esc(fullName(a))}`,
    "ทีมงานได้รับใบสมัครและเอกสารของคุณแล้ว จะตรวจสอบและแจ้งผลทางอีเมลนี้",
  ], { url: `${site()}/apply`, label: "ดูสถานะใบสมัคร" });
  await sendMail({ to, subject: resubmit ? "ได้รับใบสมัครที่แก้ไขแล้ว · VPP" : "ได้รับใบสมัครเรียนแล้ว · VPP", ...m });
  const n = layout(resubmit ? "ผู้สมัครส่งใบสมัครที่แก้ไขแล้ว" : "มีใบสมัครเรียนใหม่", [`${esc(fullName(a))} · ${esc(a.workplace)} · ${esc(PACKAGES.find((p) => p.id === a.packageId)?.short)}`, `อีเมลผู้สมัคร: ${esc(to)}`], { url: `${site()}/manage`, label: "เปิดหน้าตรวจใบสมัคร" });
  await sendMail({ to: adminEmails(), subject: `${resubmit ? "ใบสมัครแก้ไขแล้ว" : "ใบสมัครใหม่"}: ${fullName(a)}`, ...n, replyTo: to });
}

export async function mailReviewed(a: App, to: string, status: string, note: string | null | undefined, rejectedDocs: { kind: string; note?: string | null }[]) {
  if (status === "approved") {
    const m = layout("ใบสมัครของคุณผ่านการตรวจสอบแล้ว", [
      `เรียน ${esc(fullName(a))}`,
      `ขั้นต่อไป: ชำระค่าเรียน <b>${priceOf(a.packageId).toLocaleString("th-TH")} บาท</b> ผ่านพร้อมเพย์ แล้วอัปโหลดสลิปในหน้าใบสมัคร ระบบจะยืนยันการชำระให้อัตโนมัติ`,
      "และชำระค่าตรวจสอบคุณสมบัติให้สัตวแพทยสภาตามช่องทางที่สัตวแพทยสภากำหนด",
      note ? `หมายเหตุจากทีมงาน: ${esc(note)}` : "",
    ].filter(Boolean), { url: `${site()}/apply`, label: "ชำระค่าเรียน" });
    return sendMail({ to, subject: "ใบสมัครผ่านการตรวจสอบ กรุณาชำระค่าเรียน · VPP", ...m });
  }
  if (status === "needs_changes") {
    const docs = rejectedDocs.map((d) => `• ${esc(APP_DOCS.find((x) => x.kind === d.kind)?.label || d.kind)}${d.note ? `: ${esc(d.note)}` : ""}`);
    const m = layout("กรุณาแก้ไขใบสมัคร", [`เรียน ${esc(fullName(a))}`, "ทีมงานตรวจใบสมัครแล้ว ขอให้แก้ไขข้อมูลหรือเอกสารต่อไปนี้", ...(note ? [esc(note)] : []), ...docs], { url: `${site()}/apply`, label: "แก้ไขใบสมัคร" });
    return sendMail({ to, subject: "กรุณาแก้ไขใบสมัคร · VPP", ...m });
  }
  const m = layout("ผลการพิจารณาใบสมัคร", [`เรียน ${esc(fullName(a))}`, "ขออภัย ใบสมัครครั้งนี้ไม่ผ่านการพิจารณา", note ? `เหตุผล: ${esc(note)}` : "", "หากมีข้อสงสัยหรือต้องการสมัครใหม่ ตอบกลับอีเมลนี้ได้"].filter(Boolean));
  return sendMail({ to, subject: "ผลการพิจารณาใบสมัคร · VPP", ...m });
}

export async function mailPaid(a: App, to: string, amount: number, ref: string) {
  const m = layout("ยืนยันการชำระค่าเรียน", [`เรียน ${esc(fullName(a))}`, `ได้รับชำระค่าเรียน ${amount.toLocaleString("th-TH")} บาท เรียบร้อยแล้ว (เลขอ้างอิง ${esc(ref)})`, "ที่นั่งของคุณได้รับการยืนยันแล้ว ทีมงานจะส่งรายละเอียดการเรียนทางอีเมลก่อนวันเรียน", "อย่าลืมชำระค่าตรวจสอบคุณสมบัติให้สัตวแพทยสภาด้วย"], { url: `${site()}/apply`, label: "ดูสถานะ" });
  await sendMail({ to, subject: "ยืนยันการชำระค่าเรียน · VPP", ...m });
  const n = layout("ได้รับชำระค่าเรียน", [`${esc(fullName(a))} ชำระ ${amount.toLocaleString("th-TH")} บาท (อ้างอิง ${esc(ref)})`]);
  await sendMail({ to: adminEmails(), subject: `ชำระแล้ว: ${fullName(a)}`, ...n, replyTo: to });
}

export async function mailSlipNeedsReview(a: App, to: string, amount: number, reason?: string) {
  const n = layout("มีสลิปรอตรวจสอบ", [`${esc(fullName(a))} อัปโหลดสลิปค่าเรียน ${amount.toLocaleString("th-TH")} บาท`, reason ? `ระบบตรวจอัตโนมัติไม่ผ่าน: ${esc(reason)}` : "ยังไม่ได้เปิดระบบตรวจสลิปอัตโนมัติ กรุณาตรวจเอง"], { url: `${site()}/manage`, label: "ตรวจสลิป" });
  await sendMail({ to: adminEmails(), subject: `สลิปรอตรวจ: ${fullName(a)}`, ...n, replyTo: to });
}
