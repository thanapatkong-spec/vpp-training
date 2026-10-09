// ข้อมูลรุ่น/แพ็กเกจ/ติดต่อ — ช่วงแรกเก็บเป็นค่าคงที่ ภายหลังย้ายเข้าตาราง cohorts/packages ใน DB (แก้ผ่านหน้าแอดมิน)
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

export const COHORT = {
  id: "2569-11",
  name: "รุ่นที่เปิดรับบัตร",
  seatsLeft: 30,
  registerLabel: "4–5 และ 11–12 พฤศจิกายน 2569",
  sessions: [
    { title: "ภาคทฤษฎี (ออนไลน์สด)", date: "วันที่ 4–5 และ 11–12 พฤศจิกายน 2569", time: "09:00–16:00 น. (พักเที่ยง 12:00–13:00)" },
    { title: "สอบออนไลน์", date: "วันที่ 19 พฤศจิกายน 2569", time: "ใช้เวลาประมาณ 2 ชั่วโมง" },
    { title: "ภาคปฏิบัติ & สอบปฏิบัติ", date: "วันที่ 23–24 พฤศจิกายน 2569", time: "09:00–16:00 น. ณ รพส.คชาเวท ลาซาล", extra: "สอบปฏิบัติทันทีหลังเรียนจบ" },
  ],
};

export const BANK = { name: "ธนาคารกสิกรไทย", number: "123-4-56789-0", holder: "บริษัท วีพีพี เทรนนิ่ง จำกัด" };

export const CONTACT = { line: "@dr.john", email: "info@vetvpp.com", phone: "094-825-2545" };

export const baht = (n: number) => n.toLocaleString("th-TH");
