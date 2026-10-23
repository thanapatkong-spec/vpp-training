// โครงสร้างเนื้อหาที่แก้ได้ในหน้าแอดมิน (เก็บในฐานข้อมูล · ไฟล์ใน content/ เป็นข้อมูลตั้งต้น)
export type FieldType = "string" | "text" | "markdown" | "date" | "boolean" | "number" | "image" | "file" | "select" | "images" | "list" | "section";

export interface CmsField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  default?: unknown;
  options?: { label: string; value: string }[];
  fields?: CmsField[]; // สำหรับ type "list" (รายการของกลุ่มฟิลด์)
  hint?: string;
}

export interface CmsCollection {
  name: string;
  label: string;
  singular?: string;
  kind: "folder" | "files";
  dir?: string; // folder: โฟลเดอร์ใน repo
  ext?: "md" | "yml";
  files?: { name: string; label: string }[]; // kind=files: ไฟล์ใน content/pages
  titleField: string;
  slugHint?: string; // คำอธิบายช่องชื่อไฟล์ตอนสร้างใหม่
  sortField?: string;
  sortDir?: "asc" | "desc";
  fields: CmsField[];
}

const stringF = (name: string, label: string, required = true, hint?: string): CmsField => ({ name, label, type: "string", required, hint });
const textF = (name: string, label: string, required = false): CmsField => ({ name, label, type: "text", required });
const bodyF: CmsField = { name: "body", label: "เนื้อหา", type: "markdown", required: false };
const orderF: CmsField = { name: "order", label: "ลำดับ (เลขน้อยขึ้นก่อน)", type: "number", default: 100, required: true };
const dateF: CmsField = { name: "date", label: "วันที่", type: "date", required: true };

const pageFields: CmsField[] = [
  stringF("title", "หัวข้อหน้า"),
  stringF("description", "คำโปรย", false),
  { name: "cover", label: "รูปปก", type: "image", required: false },
  bodyF,
];

const priceF = (name: string, label: string): CmsField => ({ name, label, type: "number", required: true, hint: "บาท/คน ใส่เฉพาะตัวเลข" });

export const CMS_COLLECTIONS: CmsCollection[] = [
  {
    name: "cohorts", label: "รุ่นที่เปิดรับสมัคร", singular: "รุ่น", kind: "folder", dir: "content/cohorts", ext: "yml",
    titleField: "name", sortField: "order", sortDir: "asc",
    slugHint: "รหัสรุ่น เช่น 2570-03 (ปี-เดือนที่เริ่มเรียน) ใช้อ้างอิงในใบสมัคร ตั้งครั้งเดียวแก้ภายหลังไม่ได้",
    fields: [
      stringF("name", "ชื่อรุ่น (ป้ายสีส้ม)", true, "เช่น รุ่นที่เปิดรับบัตร / รุ่นที่ 5"),
      {
        name: "status", label: "สถานะ", type: "select", default: "open", required: true,
        options: [
          { label: "เปิดรับสมัคร (แสดงปุ่มสมัคร)", value: "open" },
          { label: "เต็มแล้ว (แสดงบนเว็บ แต่สมัครไม่ได้)", value: "full" },
          { label: "ปิดรับสมัคร (แสดงบนเว็บ แต่สมัครไม่ได้)", value: "closed" },
          { label: "ซ่อน (ไม่แสดงบนเว็บ)", value: "hidden" },
        ],
      },
      { name: "seats", label: "จำนวนที่นั่ง", type: "number", required: false, hint: "แสดงเป็น \"เปิดรับสมัคร · 30 ที่นั่ง\" ไม่ใส่ = ไม่แสดงจำนวน" },
      stringF("dates", "ช่วงวันเรียนแบบสั้น (แสดงในฟอร์มสมัคร)", false, "เช่น 4–5 และ 11–12 พฤศจิกายน 2569"),
      priceF("priceTheory", "ราคาภาคทฤษฎี"),
      priceF("pricePractical", "ราคาภาคปฏิบัติ"),
      { ...priceF("priceBundle", "ราคาแพ็กเกจครบ 2 ภาค"), hint: "ส่วนลด (ประหยัด X บาท) คำนวณจาก ทฤษฎี + ปฏิบัติ − ราคานี้ ให้อัตโนมัติ" },
      {
        name: "sessions", label: "ตารางเรียน (กล่องในการ์ดรุ่น เรียงตามลำดับ)", type: "list", required: false,
        fields: [
          {
            name: "icon", label: "ไอคอน", type: "select", default: "theory",
            options: [
              { label: "💻 ภาคทฤษฎี / ออนไลน์", value: "theory" },
              { label: "📄 สอบ", value: "exam" },
              { label: "🏥 ภาคปฏิบัติ / โรงพยาบาล", value: "practical" },
              { label: "📅 อื่น ๆ", value: "other" },
            ],
          },
          stringF("title", "หัวข้อ", true, "เช่น ภาคทฤษฎี (ออนไลน์สด)"),
          stringF("date", "วันที่ (บรรทัดไอคอนปฏิทิน)", false, "เช่น วันที่ 4–5 และ 11–12 พฤศจิกายน 2569"),
          stringF("time", "เวลา/สถานที่ (บรรทัดไอคอนนาฬิกา)", false, "เช่น 09:00–16:00 น. (พักเที่ยง 12:00–13:00)"),
          stringF("extra", "หมายเหตุ (บรรทัดไอคอนหมวกบัณฑิต)", false, "เช่น สอบปฏิบัติทันทีหลังเรียนจบ"),
        ],
      },
      { ...orderF, label: "ลำดับการแสดง (เลขน้อยขึ้นก่อน)" },
    ],
  },
  {
    name: "articles", label: "บทความ", singular: "บทความ", kind: "folder", dir: "content/articles", ext: "md",
    titleField: "title", sortField: "date", sortDir: "desc",
    fields: [
      stringF("title", "ชื่อบทความ"),
      textF("description", "คำอธิบายสั้น (แสดงในรายการ)"),
      dateF,
      stringF("cohort", "รุ่น (ใช้กรอง เช่น รุ่น พ.ย. 2569)", false),
      { name: "draft", label: "ฉบับร่าง (ยังไม่เผยแพร่)", type: "boolean", default: false },
      { name: "regInfo", label: "แสดงกล่อง \"ข้อมูลสำหรับกรอกแบบคำขอขึ้นทะเบียน\" (หลักสูตร/หน่วยงานที่จัด)", type: "boolean", default: false },
      { name: "cover", label: "รูปปก (แนะนำ 1200x630)", type: "image", required: false },
      {
        name: "files", label: "ไฟล์ให้ดาวน์โหลด", type: "list", required: false,
        fields: [stringF("title", "ชื่อไฟล์ที่แสดง"), { name: "path", label: "ไฟล์", type: "file", required: true }, stringF("note", "หมายเหตุ (เช่น PDF 1 MB)", false)],
      },
      bodyF,
    ],
  },
  {
    name: "faq", label: "คำถามที่พบบ่อย", singular: "คำถาม", kind: "folder", dir: "content/faq", ext: "yml",
    titleField: "question", sortField: "order", sortDir: "asc",
    fields: [stringF("question", "คำถาม"), { ...textF("answer", "คำตอบ"), required: true }, orderF],
  },
  {
    name: "documents", label: "เอกสารแนบ (หน้าแรก)", singular: "เอกสาร", kind: "folder", dir: "content/documents", ext: "yml",
    titleField: "title", sortField: "order", sortDir: "asc",
    fields: [stringF("title", "ชื่อเอกสารที่แสดง"), { name: "file", label: "ไฟล์", type: "file", required: true }, stringF("note", "หมายเหตุ (เช่น PDF 1 MB)", false), orderF],
  },
  {
    name: "albums", label: "อัลบั้มรูป", singular: "อัลบั้ม", kind: "folder", dir: "content/albums", ext: "yml",
    titleField: "title", sortField: "date", sortDir: "desc",
    fields: [
      stringF("title", "ชื่ออัลบั้ม"),
      textF("description", "คำอธิบาย"),
      dateF,
      stringF("cohort", "รุ่น (เช่น รุ่นที่ 3)", false),
      { name: "cover", label: "รูปปกอัลบั้ม (ไม่ใส่ = ใช้รูปแรก)", type: "image", required: false },
      {
        name: "layout", label: "สัดส่วนรูปในอัลบั้ม", type: "select", default: "square",
        options: [{ label: "สี่เหลี่ยมจัตุรัส (รูปถ่ายทั่วไป)", value: "square" }, { label: "แนวนอน 16:9 (สไลด์)", value: "wide" }],
      },
      { name: "photos", label: "รูปในอัลบั้ม", type: "images", required: false },
    ],
  },
  {
    name: "pages", label: "หน้าเนื้อหา", kind: "files", dir: "content/pages", ext: "md",
    files: [{ name: "about", label: "เกี่ยวกับ VPP" }, { name: "collaboration", label: "ความร่วมมือ DR.john x คชาเวท" }, { name: "privacy", label: "นโยบายความเป็นส่วนตัว" }],
    titleField: "title", fields: pageFields,
  },
];

const listF = (name: string, label: string, sub: CmsField[], hint?: string): CmsField => ({ name, label, type: "list", required: false, fields: sub, hint });
const lineF = stringF("text", "ข้อความ");
const sectionF = (label: string): CmsField => ({ name: `_${label}`, label, type: "section" });

// ตั้งค่าเว็บไซต์: ข้อความที่เคยเขียนไว้ในโค้ด (เว้นว่าง = ใช้ค่าเดิม)
CMS_COLLECTIONS.push({
  name: "settings", label: "ตั้งค่าเว็บไซต์", kind: "files", dir: "settings", ext: "yml",
  files: [{ name: "site", label: "ตั้งค่าเว็บไซต์ (ข้อความหน้าแรก, แพ็กเกจ, ติดต่อ, บัญชีรับเงิน, ค่าตรวจสอบคุณสมบัติ, ฟอร์มสมัคร)" }],
  titleField: "heroTitle",
  fields: [
    sectionF("ส่วนหัวหน้าแรก"),
    stringF("heroTitle", "หัวข้อใหญ่ บรรทัด 1", false), stringF("heroTitle2", "หัวข้อใหญ่ บรรทัด 2 (สีส้ม)", false), textF("heroText", "คำอธิบายใต้หัวข้อ"),
    stringF("heroCta", "ข้อความปุ่มสมัคร", false), stringF("heroBadgeTitle", "ป้ายบนรูป: หัวข้อ", false), stringF("heroBadgeText", "ป้ายบนรูป: ข้อความ", false),
    sectionF("วิดีโอแนะนำ (หน้าแรก)"),
    stringF("videoTitle", "หัวข้อวิดีโอ", false), textF("videoText", "คำอธิบายใต้หัวข้อ"),
    stringF("videoUrl", "ลิงก์วิดีโอ", false, "ลิงก์ YouTube (เช่น https://youtu.be/xxxx) หรือไฟล์ .mp4 · เว้นว่าง = ซ่อนส่วนวิดีโอ · ค่าเดิม /videos/vpp-intro.mp4"),
    sectionF("รุ่นและค่าอบรม"),
    stringF("cohortsTitle", "หัวข้อส่วนรุ่นที่เปิดรับสมัคร", false), stringF("cohortsText", "คำอธิบายส่วนรุ่น", false), stringF("pricingTitle", "หัวข้อส่วนค่าอบรม", false),
    stringF("pkgTheoryName", "ชื่อแพ็กเกจภาคทฤษฎี", false), stringF("pkgTheorySub", "คำอธิบายภาคทฤษฎี", false),
    stringF("pkgPracticalName", "ชื่อแพ็กเกจภาคปฏิบัติ", false), stringF("pkgPracticalSub", "คำอธิบายภาคปฏิบัติ", false), stringF("pkgPracticalNote", "หมายเหตุภาคปฏิบัติ", false),
    stringF("pkgBundleName", "ชื่อแพ็กเกจครบ 2 ภาค", false), stringF("pkgBundleHeadline", "หัวการ์ดแพ็กเกจครบ 2 ภาค", false),
    sectionF("ปัญหา / ทำไมต้อง VPP"),
    stringF("problemsTitle", "หัวข้อปัญหา", false), listF("problems", "รายการปัญหา", [lineF]), stringF("problemsFooter", "ข้อความใต้รายการปัญหา", false),
    stringF("whyTitle", "หัวข้อทำไมต้อง VPP", false), listF("why", "เหตุผล (การ์ด 4 ใบ)", [stringF("title", "หัวข้อ"), textF("text", "คำอธิบาย")]),
    stringF("certTitle", "กล่องใบประกาศ: หัวข้อ", false), textF("certText", "กล่องใบประกาศ: ข้อความ"),
    stringF("legalTitle", "กล่องกฎหมาย: หัวข้อ", false), textF("legalText", "กล่องกฎหมาย: ข้อความ"),
    sectionF("ติดต่อ / ท้ายเว็บ"),
    stringF("contactTitle", "หัวข้อส่วนติดต่อ", false), textF("contactText", "ข้อความส่วนติดต่อ"),
    stringF("contactLine", "LINE ID", false, "เช่น @dr.john"), stringF("contactEmail", "อีเมลติดต่อ", false), stringF("contactPhone", "เบอร์โทร", false),
    stringF("footerTagline", "คำขวัญท้ายเว็บ", false), listF("footerAudience", "เหมาะสำหรับ (ท้ายเว็บ)", [lineF]),
    sectionF("บัญชีรับเงินค่าเรียน (QR)"),
    stringF("payName", "ชื่อบัญชีที่แสดง", false), stringF("payBank", "ธนาคาร/เลขบัญชีที่แสดง", false),
    stringF("payBillerId", "QR ชำระบิล: Biller ID (15 หลัก)", false, "จาก QR ที่ธนาคารออกให้ (ค่าเดิมคือของ Dr.John Pet SCB)"), stringF("payRef1", "QR ชำระบิล: Ref1", false), stringF("payRef2", "QR ชำระบิล: Ref2", false), stringF("payTerminal", "QR ชำระบิล: Terminal", false),
    stringF("vatRate", "VAT (%) ที่บวกเพิ่มตอนโอนค่าเรียน", false, "ราคาในข้อมูลรุ่น = ราคาก่อน VAT · ยอดโอน/QR = ราคา + VAT · ใส่ 0 = ไม่คิด VAT"),
    stringF("payPromptpayId", "หรือใช้พร้อมเพย์ทั่วไป (เบอร์/เลขผู้เสียภาษี)", false, "ใส่ช่องนี้ = ใช้พร้อมเพย์แทน QR ชำระบิล · สแกนทดสอบทุกครั้งที่เปลี่ยน"),
    sectionF("ค่าตรวจสอบคุณสมบัติ (ชำระให้สัตวแพทยสภา)"),
    stringF("councilFee", "จำนวนเงิน (บาท)", false, "ตัวเลขอย่างเดียว เช่น 500"),
    textF("councilPayInfo", "วิธีชำระที่แสดงให้ผู้สมัคร"),
    { name: "councilPayinFile", label: "ใบ Pay-in ของสัตวแพทยสภา (PDF ให้ผู้สมัครดาวน์โหลด)", type: "file", required: false },
    sectionF("ข้อมูลสำหรับกรอกแบบคำขอขึ้นทะเบียน (สัตวแพทยสภา)"),
    stringF("regCourse", "ผ่านการอบรมหลักสูตร… เรื่อง", false), stringF("regOrganizer", "จัดโดยหน่วยงาน", false),
    sectionF("ตัวเลือกในฟอร์มสมัคร"),
    listF("formPrefixes", "คำนำหน้าชื่อ", [lineF]), listF("formEducation", "วุฒิการศึกษา", [lineF]),
  ],
});

export const findCollection = (name: string) => CMS_COLLECTIONS.find((c) => c.name === name);
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
