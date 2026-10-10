import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { H3Event } from "h3";
import { claimTokens } from "../db/schema";

export const PLACEHOLDER_DOMAIN = "placeholder.invalid";
export const isPlaceholderEmail = (e: string) => e.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`);
export const newPlaceholderEmail = () => `noemail-${randomBytes(5).toString("hex")}@${PLACEHOLDER_DOMAIN}`;
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export function siteOrigin(event: H3Event) {
  const env = (process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");
  return env || getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin;
}

// สร้างลิงก์เปิดใช้งานใหม่ (ลิงก์เก่าที่ยังไม่ได้ใช้ถูกยกเลิก) อายุ 14 วัน
export async function createActivationLink(event: H3Event, db: NonNullable<ReturnType<typeof useDb>>, userId: string) {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000);
  await db.delete(claimTokens).where(and(eq(claimTokens.userId, userId), isNull(claimTokens.usedAt)));
  await db.insert(claimTokens).values({ userId, tokenHash: hashToken(token), expiresAt });
  return { url: `${siteOrigin(event)}/activate?token=${token}`, expiresAt };
}

export async function findActivationToken(db: NonNullable<ReturnType<typeof useDb>>, token: string) {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  const [row] = await db.select().from(claimTokens).where(eq(claimTokens.tokenHash, hashToken(token))).limit(1);
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row;
}
