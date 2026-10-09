import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
