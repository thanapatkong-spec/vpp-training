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

-- ข้อความกล่อง "ถูกต้องตามกฎหมาย" (หน้าแรก): เปลี่ยนเฉพาะถ้ายังเป็นข้อความเดิม (แอดมินแก้เองแล้วไม่ทับ)
DO $$ BEGIN
	IF to_regclass('public.content_items') IS NOT NULL THEN
		UPDATE "content_items" SET "data" = jsonb_set("data", '{legalText}', to_jsonb('ผู้ช่วยสัตวแพทย์ที่ผ่านการอบรมหลักสูตร VPP สามารถช่วยเหลือสัตวแพทย์ในการทำปฏิบัติงานรักษาสัตว์ ในสถานพยาบาลที่ขึ้นทะเบียนได้อย่างถูกต้อง มีหลักการ ภายใต้การดูแลของสัตวแพทย์ผู้ควบคุมอย่างใกล้ชิด'::text))
		WHERE "collection" = 'settings' AND "slug" = 'site' AND "data"->>'legalText' = 'การอบรมไม่ได้ทำให้ผู้ช่วยสัตวแพทย์สามารถเป็นสัตวแพทย์ หรือทำหัตถการในขอบเขตวิชาชีพสัตวแพทย์ได้';
	END IF;
END $$;

-- FAQ ข้อ 05: คำตอบแนวเดียวกับกล่อง "ถูกต้องตามกฎหมาย" — เปลี่ยนเฉพาะถ้ายังเป็นคำตอบเดิม
DO $$ BEGIN
	IF to_regclass('public.content_items') IS NOT NULL THEN
		UPDATE "content_items" SET "data" = jsonb_set("data", '{answer}', to_jsonb('ผู้ช่วยสัตวแพทย์ที่ผ่านการอบรมหลักสูตร VPP ทำงานร่วมกับสัตวแพทย์ ไม่ใช่ทำแทน โดยช่วยเหลือสัตวแพทย์ในการปฏิบัติงานรักษาสัตว์ ในสถานพยาบาลที่ขึ้นทะเบียนได้อย่างถูกต้อง มีหลักการ ตามขอบเขตและบทบาทหน้าที่ที่สัตวแพทยสภากำหนด เช่น การควบคุมสัตว์ การเตรียมอุปกรณ์ การดูแลสัตว์ป่วยเบื้องต้น และการช่วยงานผ่าตัด ภายใต้การดูแลของสัตวแพทย์ผู้ควบคุมอย่างใกล้ชิด'::text))
		WHERE "collection" = 'faq' AND "slug" = '05' AND "data"->>'answer' = 'ไม่ได้ ผู้ช่วยสัตวแพทย์ทำหน้าที่สนับสนุนงานพยาบาลสัตว์ภายใต้การกำกับดูแลของสัตวแพทย์ ตามขอบเขตและบทบาทหน้าที่ที่สัตวแพทยสภากำหนด เช่น การควบคุมสัตว์ การเตรียมอุปกรณ์ การดูแลสัตว์ป่วยเบื้องต้น และการช่วยงานผ่าตัด การอบรมไม่ได้ทำให้เป็นสัตวแพทย์ หรือทำหัตถการในขอบเขตวิชาชีพสัตวแพทย์ได้';
	END IF;
END $$;
