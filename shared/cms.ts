// โครงสร้างเนื้อหาที่แก้ได้ในหน้าแอดมิน (ตรงกับ content.config.ts และ public/admin/config.yml)
export type FieldType = "string" | "text" | "markdown" | "date" | "boolean" | "number" | "image" | "file" | "select" | "images" | "list";

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

export const CMS_COLLECTIONS: CmsCollection[] = [
  {
    name: "articles", label: "บทความ", singular: "บทความ", kind: "folder", dir: "content/articles", ext: "md",
    titleField: "title", sortField: "date", sortDir: "desc",
    fields: [
      stringF("title", "ชื่อบทความ"),
      textF("description", "คำอธิบายสั้น (แสดงในรายการ)"),
      dateF,
      stringF("cohort", "รุ่น (ใช้กรอง เช่น รุ่น พ.ย. 2569)", false),
      { name: "draft", label: "ฉบับร่าง (ยังไม่เผยแพร่)", type: "boolean", default: false },
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

export const findCollection = (name: string) => CMS_COLLECTIONS.find((c) => c.name === name);
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;
