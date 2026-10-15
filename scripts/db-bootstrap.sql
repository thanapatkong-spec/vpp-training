-- สร้างตารางที่จำเป็นแบบปลอดภัย (ไม่แตะตารางที่มีอยู่) — รันก่อน drizzle-kit push ทุกครั้งที่ deploy
-- สร้างจาก drizzle-kit generate ให้ตรงกับ server/db/schema.ts

CREATE TABLE IF NOT EXISTS "cohorts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"seats" integer,
	"dates" text,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"price_theory" integer DEFAULT 0 NOT NULL,
	"price_practical" integer DEFAULT 0 NOT NULL,
	"price_bundle" integer DEFAULT 0 NOT NULL,
	"sessions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "content_items" (
	"collection" text NOT NULL,
	"slug" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "content_items_collection_slug_pk" PRIMARY KEY("collection","slug")
);

CREATE TABLE IF NOT EXISTS "content_seeds" (
	"collection" text PRIMARY KEY NOT NULL,
	"seeded_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- คอลัมน์ใหม่ในตารางเดิม (ถ้ามีตารางแล้ว)
DO $$ BEGIN
	IF to_regclass('public.payments') IS NOT NULL THEN
		ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'tuition' NOT NULL;
	END IF;
	-- ผลตรวจคุณสมบัติจากสัตวแพทยสภา: ตอนเพิ่มคอลัมน์ครั้งแรก ใบสมัครที่ผ่านอยู่แล้ว = ผ่านคุณสมบัติ (ชำระค่าเรียนต่อได้เหมือนเดิม)
	IF to_regclass('public.applications') IS NOT NULL AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'council_check'
	) THEN
		ALTER TABLE "applications" ADD COLUMN "council_check" text;
		ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "council_note" text;
		ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "council_checked_at" timestamp with time zone;
		UPDATE "applications" SET "council_check" = 'passed', "council_checked_at" = now() WHERE "status" = 'approved';
	END IF;
END $$;

-- บทความการขอขึ้นทะเบียน: เปิดกล่องข้อมูลกรอกแบบคำขอ (ครั้งเดียว ถ้าแอดมินยังไม่เคยตั้งค่าช่องนี้)
DO $$ BEGIN
	IF to_regclass('public.content_items') IS NOT NULL THEN
		UPDATE "content_items" SET "data" = "data" || '{"regInfo": true}'::jsonb
		WHERE "collection" = 'articles' AND "slug" = 'vpp-registration' AND NOT ("data" ? 'regInfo');
	END IF;
END $$;
