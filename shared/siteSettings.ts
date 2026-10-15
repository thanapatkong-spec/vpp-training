// ตั้งค่าเว็บไซต์ (หน้าแอดมิน > เนื้อหาเว็บ > ตั้งค่าเว็บไซต์) — ค่าเริ่มต้นด้านล่างใช้เมื่อยังไม่ได้แก้
export interface SiteSettings {
  heroTitle: string;
  heroTitle2: string;
  heroText: string;
  heroCta: string;
  heroBadgeTitle: string;
  heroBadgeText: string;
  cohortsTitle: string;
  cohortsText: string;
  pricingTitle: string;
  pkgTheoryName: string;
  pkgTheorySub: string;
  pkgPracticalName: string;
  pkgPracticalSub: string;
  pkgPracticalNote: string;
  pkgBundleName: string;
  pkgBundleHeadline: string;
  problemsTitle: string;
  problems: { text: string }[];
  problemsFooter: string;
  whyTitle: string;
  why: { title: string; text: string }[];
  certTitle: string;
  certText: string;
  legalTitle: string;
  legalText: string;
  contactTitle: string;
  contactText: string;
  contactLine: string;
  contactEmail: string;
  contactPhone: string;
  footerTagline: string;
  footerAudience: { text: string }[];
  payName: string;
  payBank: string;
  payPromptpayId: string;
  payBillerId: string;
  payRef1: string;
  payRef2: string;
  payTerminal: string;
  councilFee: string;
  councilPayInfo: string;
  councilPayinFile: string;
  formPrefixes: { text: string }[];
  formEducation: { text: string }[];
}

const items = (...t: string[]) => t.map((text) => ({ text }));

export const SITE_DEFAULTS: SiteSettings = {
  heroTitle: "หลักสูตรผู้ช่วยสัตวแพทย์",
  heroTitle2: "ด้านการพยาบาลสัตว์",
  heroText: "สร้างทีมที่มีพื้นฐาน ลดภาระการสอนงาน ยกระดับมาตรฐานโรงพยาบาลสัตว์ พร้อมเป็นส่วนหนึ่งของทีมอย่างมั่นใจ",
  heroCta: "สมัครเรียน / สอบถาม",
  heroBadgeTitle: "ใบประกาศนียบัตร",
  heroBadgeText: "รับรองจากสัตวแพทยสภา",
  cohortsTitle: "รุ่นที่เปิดรับสมัคร",
  cohortsText: "เลือกรุ่นที่สะดวก แล้วสมัครผ่าน LINE หรืออีเมลได้ทันที",
  pricingTitle: "ค่าอบรมหลักสูตร",
  pkgTheoryName: "ภาคทฤษฎี",
  pkgTheorySub: "เรียนสดออนไลน์",
  pkgPracticalName: "ภาคปฏิบัติ",
  pkgPracticalSub: "ฝึกจริง ณ รพส.คชาเวท ลาซาล",
  pkgPracticalNote: "ต้องเรียนคู่กับภาคทฤษฎี (สมัครอย่างเดียวไม่ได้)",
  pkgBundleName: "แพ็กเกจครบ 2 ภาค",
  pkgBundleHeadline: "★ พิเศษ! สมัครครบทั้ง 2 ภาค",
  problemsTitle: "คุณกำลังเจอปัญหาเหล่านี้อยู่หรือเปล่า?",
  problems: items("พนักงานใหม่ยังทำงานไม่คล่อง", "จับบังคับสัตว์ไม่ถูกวิธี", "ไม่มั่นใจในการใช้อุปกรณ์และเครื่องมือ", "พื้นฐานของแต่ละคนไม่เท่ากัน", "คุณหมอต้องเสียเวลาสอนงานตั้งแต่พื้นฐาน"),
  problemsFooter: "ส่งพนักงานมาเรียนพื้นฐานก่อน แล้วกลับไปฝึกต่อกับทีมของคุณ",
  whyTitle: "ทำไมโรงพยาบาลสัตว์ควรส่งพนักงานมาเรียนกับ VPP?",
  why: [
    { title: "มีหลักฐานการอบรม", text: "เอกสารยืนยันบุคลากรผ่านการอบรมและประเมินผล เหมาะกับ Training Record / HR" },
    { title: "สร้างมาตรฐานทีม", text: "ทุกคนมีพื้นฐานเดียวกัน ลดความเหลื่อมล้ำของประสบการณ์" },
    { title: "ลดภาระคุณหมอ", text: "ให้ VPP ปูพื้นฐานก่อน แล้วนำไปฝึกต่อกับทีมของคลินิก" },
    { title: "บริหารบุคลากรเป็นระบบ", text: "มีประวัติการอบรม ผลการประเมิน และแผนพัฒนาทักษะต่อเนื่อง" },
  ],
  certTitle: "ใบประกาศนียบัตรรับรองจากสัตวแพทยสภา",
  certText: "เพิ่มความน่าเชื่อถือของบุคลากร และสนับสนุนการบริหารทีมในระบบของโรงพยาบาลสัตว์",
  legalTitle: "ถูกต้องตามกฎหมาย",
  legalText: "การอบรมไม่ได้ทำให้ผู้ช่วยสัตวแพทย์สามารถเป็นสัตวแพทย์ หรือทำหัตถการในขอบเขตวิชาชีพสัตวแพทย์ได้",
  contactTitle: "สมัครเรียน / สอบถาม",
  contactText: "ส่งชื่อ-นามสกุล เบอร์โทร แพ็กเกจที่สนใจ และโรงพยาบาล/คลินิกที่สังกัด ทาง LINE หรืออีเมล ทีมงานจะแจ้งขั้นตอนการชำระเงินกลับไป",
  contactLine: "@dr.john",
  contactEmail: "info@vetvpp.com",
  contactPhone: "094-825-2545",
  footerTagline: "พัฒนาคน เพื่อยกระดับมาตรฐานโรงพยาบาลสัตว์",
  footerAudience: items("พนักงานใหม่ของโรงพยาบาลสัตว์", "ผู้ช่วยแพทย์ที่ต้องการเพิ่มทักษะ", "โรงพยาบาลสัตว์/คลินิกที่ต้องการพัฒนาทีม"),
  payName: "Dr.John Pet Co., Ltd.",
  payBank: "ธนาคารไทยพาณิชย์ (SCB) 038-485804-4",
  payPromptpayId: "",
  payBillerId: "010556801728901",
  payRef1: "REF001",
  payRef2: "0",
  payTerminal: "IFB0948252545",
  councilFee: "500",
  councilPayInfo: [
    "ชำระเข้าบัญชี \"สัตวแพทยสภา\" (ไม่คืนเงินทุกกรณี แม้ไม่ผ่านการตรวจคุณสมบัติ)",
    "",
    "ธนาคารกสิกรไทย (K PLUS): เมนู \"จ่ายบิล\" ค้นหารหัส 35096 สัตวแพทยสภา",
    "ธนาคารไทยพาณิชย์ (SCB EASY): เมนู \"จ่ายบิล\" ค้นหารหัส 0932 สัตวแพทยสภา (Veterinary Council of Thailand)",
    "",
    "Ref 1 / รหัสสถาบัน: 20223/2567",
    "Ref 2 / รหัสกิจกรรม: 5000134",
    "จำนวน: 500 บาท",
  ].join("\n"),
  councilPayinFile: "",
  formPrefixes: items("นาย", "นาง", "นางสาว"),
  formEducation: items("มัธยมศึกษาปีที่ 6", "ปวช.", "ปวส.", "ปริญญาตรี", "สูงกว่าปริญญาตรี", "อื่นๆ (เทียบเท่า ม.6)"),
};

/** รวมค่าที่บันทึกไว้กับค่าเริ่มต้น (ช่องว่าง/รายการว่าง = ใช้ค่าเริ่มต้น) */
export function mergeSettings(saved: Partial<Record<keyof SiteSettings, unknown>> | null | undefined): SiteSettings {
  const out = { ...SITE_DEFAULTS } as Record<string, unknown>;
  for (const [k, def] of Object.entries(SITE_DEFAULTS)) {
    const v = saved?.[k as keyof SiteSettings];
    if (Array.isArray(def)) {
      if (Array.isArray(v)) out[k] = v; // แอดมินลบรายการจนหมดได้ (แต่ตัวเลือกฟอร์มต้องมีอย่างน้อย 1 — ตรวจตอนบันทึก)
    } else if (typeof v === "string" && (v.trim() || k === "payPromptpayId" || k === "councilPayinFile")) out[k] = v.trim();
  }
  return out as unknown as SiteSettings;
}

export const textsOf = (l: { text: string }[]) => l.map((x) => x.text.trim()).filter(Boolean);
