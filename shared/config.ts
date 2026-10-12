// แพ็กเกจ (ชื่อ + ราคามาตรฐาน) และช่องทางติดต่อ — ราคาจริงของแต่ละรุ่นอยู่ใน content/cohorts (แก้ในหน้าแอดมิน)
export type PackageId = "theory" | "practical" | "bundle";

export const PACKAGES: {
  id: PackageId;
  label: string;
  short: string;
  sub: string;
  price: number;
}[] = [
  { id: "theory", label: "ภาคทฤษฎี (เรียนสดออนไลน์)", short: "ภาคทฤษฎี", sub: "เรียนสดออนไลน์", price: 7000 },
  { id: "practical", label: "ภาคปฏิบัติ ณ รพส.คชาเวท ลาซาล", short: "ภาคปฏิบัติ", sub: "ฝึกจริง ณ รพส.คชาเวท ลาซาล", price: 10000 },
  { id: "bundle", label: "แพ็กเกจครบ 2 ภาค (ประหยัด 2,000 บาท)", short: "แพ็กเกจครบ 2 ภาค", sub: "ประหยัด 2,000 บาท", price: 15000 },
];

export const CONTACT = { line: "@dr.john", email: "info@vetvpp.com", phone: "094-825-2545" };

export const baht = (n: number) => n.toLocaleString("th-TH");
