import YAML from "yaml";
import { SLUG_RE, type CmsCollection, type CmsField } from "#shared/cms";

const YAML_OPTS = { lineWidth: 0, defaultStringType: "QUOTE_DOUBLE", defaultKeyType: "PLAIN", blockQuote: "literal" } as const;
const dump = (o: unknown) => YAML.stringify(o, YAML_OPTS as any);

// แปลงไฟล์ในรีโปเป็นค่าฟิลด์
export function parseEntry(col: CmsCollection, raw: string): Record<string, unknown> {
  if (col.ext === "yml") return (YAML.parse(raw) as Record<string, unknown>) || {};
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { body: raw };
  const meta = (YAML.parse(m[1]!) as Record<string, unknown>) || {};
  if (meta.date instanceof Date) meta.date = meta.date.toISOString().slice(0, 10);
  return { ...meta, body: (m[2] || "").replace(/^\n+/, "").replace(/\s+$/, "") };
}

function clean(f: CmsField, v: unknown): unknown {
  switch (f.type) {
    case "boolean": return !!v;
    case "number": { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : undefined; }
    case "images": return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
    case "list": {
      if (!Array.isArray(v)) return [];
      return v.map((row) => cleanFields(f.fields || [], (row || {}) as Record<string, unknown>)).filter((r) => Object.keys(r).length);
    }
    default: { const s = typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : v == null ? "" : String(v); return s === "" ? undefined : s; }
  }
}

function cleanFields(fields: CmsField[], values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "markdown") continue;
    const v = clean(f, values[f.name]);
    if (v === undefined) continue;
    if ((f.type === "images" || f.type === "list") && !(v as unknown[]).length) continue;
    out[f.name] = v;
  }
  return out;
}

export function validate(col: CmsCollection, values: Record<string, unknown>): string | null {
  for (const f of col.fields) {
    if (!f.required || f.type === "markdown" || f.type === "boolean") continue;
    const v = clean(f, values[f.name]);
    if (v === undefined || (Array.isArray(v) && !v.length)) return `กรุณากรอก "${f.label}"`;
    if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return `"${f.label}" ต้องเป็นวันที่`;
    if (f.type === "number" && typeof v !== "number") return `"${f.label}" ต้องเป็นตัวเลข`;
  }
  const sel = col.fields.find((f) => f.type === "select");
  if (sel && values[sel.name] && !sel.options!.some((o) => o.value === values[sel.name])) return `"${sel.label}" ไม่ถูกต้อง`;
  return null;
}

// แปลงค่าฟิลด์เป็นข้อความไฟล์
export function serializeEntry(col: CmsCollection, values: Record<string, unknown>): string {
  const meta = cleanFields(col.fields, values);
  if (col.ext === "yml") return dump(meta);
  const body = typeof values.body === "string" ? values.body.replace(/\r\n/g, "\n").trim() : "";
  return `---\n${dump(meta)}---\n\n${body}\n`;
}

// slug ที่อนุญาต: โฟลเดอร์ = a-z0-9- / หมวดไฟล์ = เฉพาะไฟล์ที่กำหนด
export function isValidSlug(col: CmsCollection, slug: string) {
  return col.kind === "files" ? !!col.files!.some((f) => f.name === slug) : SLUG_RE.test(slug);
}
