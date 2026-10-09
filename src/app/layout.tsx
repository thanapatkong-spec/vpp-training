import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VPP · Training & Competency System for Veterinary Hospital",
  description:
    "หลักสูตรผู้ช่วยสัตวแพทย์ด้านการพยาบาลสัตว์ สร้างทีมที่มีพื้นฐาน ลดภาระการสอนงาน ยกระดับมาตรฐานโรงพยาบาลสัตว์",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
