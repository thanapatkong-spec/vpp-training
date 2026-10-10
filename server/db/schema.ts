import { boolean, customType, date, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const packageEnum = pgEnum("package_id", ["theory", "practical", "bundle"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "confirmed", "rejected"]);

// --- รอบแรก: รับสมัคร + ชำระเงินด้วยสลิป ---
export const registrations = pgTable("registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  cohortId: text("cohort_id").notNull(),
  packageId: packageEnum("package_id").notNull(),
  amount: integer("amount").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  lineId: text("line_id"),
  workplace: text("workplace"),
  slipKey: text("slip_key"),
  status: paymentStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- เฟส e-learning (ยังไม่ใช้ แต่วาง schema ไว้) ---
export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  videoRef: text("video_ref"),
  content: text("content"),
});


// --- ระบบสมาชิก (Better Auth) — ชื่อตาราง/คอลัมน์ตามที่ Better Auth ต้องการ ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- ใบประกาศนียบัตรของสมาชิก (ระยะ A) ---
export const claimStatus = pgEnum("claim_status", ["pending", "approved", "rejected"]);

const bytea = customType<{ data: Buffer; default: false }>({
  dataType: () => "bytea",
});

// สมาชิกยื่นคำขอว่า "เคยเรียน" แอดมินตรวจและอนุมัติ พร้อมแนบ PDF ใบประกาศ
export const certClaims = pgTable("cert_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  cohort: text("cohort").notNull(),
  completedOn: date("completed_on", { mode: "string" }),
  note: text("note"),
  status: claimStatus("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ไฟล์ PDF เก็บในฐานข้อมูล (ส่วนตัว ไม่อยู่ใน repo) — ย้ายไป R2/S3 ได้ภายหลังโดยเปลี่ยนแค่ตารางนี้
export const certFiles = pgTable("cert_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
});

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  claimId: uuid("claim_id").references(() => certClaims.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  certNo: text("cert_no"),
  issuedOn: date("issued_on", { mode: "string" }),
  fileId: uuid("file_id").notNull().references(() => certFiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ข้อมูลเพิ่มของสมาชิกที่แอดมินนำเข้า (เช่น จากรายชื่อผู้เรียนรุ่นเก่า)
export const memberProfiles = pgTable("member_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  phone: text("phone"),
  cohort: text("cohort"),
  imported: boolean("imported").notNull().default(true), // false = โปรไฟล์ที่สมาชิกสมัครเองแล้วแก้ข้อมูล
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
});

// ลิงก์เปิดใช้งานบัญชีที่แอดมินสร้างไว้ให้ (เก็บเฉพาะค่าแฮชของ token)
export const claimTokens = pgTable("claim_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- ใบสมัครเรียน VPP (ผู้สมัครต้องมีบัญชีสมาชิกก่อน) ---
export const applicationStatus = pgEnum("application_status", ["submitted", "needs_changes", "approved", "rejected"]);
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  cohortId: text("cohort_id").notNull(),
  packageId: packageEnum("package_id").notNull(),
  prefix: text("prefix").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nameEn: text("name_en"),
  nationalId: text("national_id").notNull(),
  birthDate: date("birth_date", { mode: "string" }).notNull(),
  phone: text("phone").notNull(),
  lineId: text("line_id"),
  address: text("address").notNull(),
  education: text("education").notNull(),
  school: text("school"),
  workplace: text("workplace").notNull(),
  position: text("position"),
  experienceYears: integer("experience_years"),
  vetName: text("vet_name").notNull(),
  vetLicense: text("vet_license").notNull(),
  vetPhone: text("vet_phone"),
  payer: text("payer").notNull().default("self"), // self | employer
  invoiceName: text("invoice_name"),
  invoiceAddress: text("invoice_address"),
  invoiceTaxId: text("invoice_tax_id"),
  status: applicationStatus("status").notNull().default("submitted"),
  adminNote: text("admin_note"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// เอกสารแนบใบสมัคร (เก็บในฐานข้อมูล ไม่เปิดสาธารณะ) kind: id_card | education
export const applicationFiles = pgTable("application_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  status: text("status").notNull().default("pending"), // pending | ok | rejected
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
