import Link from "next/link";
import {
  Award, CalendarDays, ChevronDown, Clock, FileText, GraduationCap, Hospital,
  Laptop, Scale, ShieldCheck, Stethoscope, Users, AlertCircle, BookOpen,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { COHORT, PACKAGES, baht } from "@/lib/config";

const PROBLEMS = [
  "พนักงานใหม่ยังทำงานไม่คล่อง",
  "จับบังคับสัตว์ไม่ถูกวิธี",
  "ไม่มั่นใจในการใช้อุปกรณ์และเครื่องมือ",
  "พื้นฐานของแต่ละคนไม่เท่ากัน",
  "คุณหมอต้องเสียเวลาสอนงานตั้งแต่พื้นฐาน",
];

const WHY = [
  { icon: FileText, t: "มีหลักฐานการอบรม", d: "เอกสารยืนยันบุคลากรผ่านการอบรมและประเมินผล เหมาะกับ Training Record / HR" },
  { icon: Users, t: "สร้างมาตรฐานทีม", d: "ทุกคนมีพื้นฐานเดียวกัน ลดความเหลื่อมล้ำของประสบการณ์" },
  { icon: Stethoscope, t: "ลดภาระคุณหมอ", d: "ให้ VPP ปูพื้นฐานก่อน แล้วนำไปฝึกต่อกับทีมของคลินิก" },
  { icon: ShieldCheck, t: "บริหารบุคลากรเป็นระบบ", d: "มีประวัติการอบรม ผลการประเมิน และแผนพัฒนาทักษะต่อเนื่อง" },
];

const FAQ = [
  "หลักสูตรเรียนในรูปแบบใด?",
  "ค่าอบรมเท่าไร และเลือกเรียนแยกภาคได้หรือไม่?",
  "สมัครเรียนและชำระเงินอย่างไร?",
  "หลักสูตรเหมาะกับใคร?",
  "ผ่านการอบรมแล้วสามารถทำงานแทนสัตวแพทย์ได้หรือไม่?",
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-b from-white to-sky-soft">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
            <div>
              <div className="flex flex-wrap gap-2 text-sm font-semibold text-white">
                <span className="rounded-full bg-ok px-3 py-1">เปิดรับสมัครแล้ว!</span>
                <span className="rounded-full bg-brand px-3 py-1">รุ่นที่เปิดรับบัตร</span>
              </div>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-navy-800 md:text-5xl">
                หลักสูตรผู้ช่วยสัตวแพทย์
                <span className="block text-brand">ด้านการพยาบาลสัตว์</span>
              </h1>
              <p className="mt-4 max-w-md text-slate-600">
                สร้างทีมที่มีพื้นฐาน ลดภาระการสอนงาน ยกระดับมาตรฐานโรงพยาบาลสัตว์ พร้อมเป็นส่วนหนึ่งของทีมอย่างมั่นใจ
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="btn-brand px-6 py-3">สมัครเรียนและชำระเงิน</Link>
                <a href="#cohorts" className="rounded-full border-2 border-navy-800 px-6 py-3 font-semibold text-navy-800 hover:bg-navy-800 hover:text-white">
                  ดูตารางเรียน
                </a>
              </div>
            </div>
            <div className="relative">
              {/* TODO: แทนด้วยรูปจริง public/hero.jpg */}
              <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-gradient-to-br from-sky-card to-white shadow-xl">
                <Stethoscope className="size-24 text-navy-700/40" />
              </div>
              <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
                <Award className="size-7 text-brand" />
                <div className="text-sm">
                  <div className="font-semibold text-navy-800">ใบประกาศนียบัตร</div>
                  <div className="text-xs text-slate-500">รับรองจากสัตวแพทยสภา</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cohorts */}
        <section id="cohorts" className="bg-gradient-to-br from-navy-900 to-navy-700 py-14 text-white">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl font-bold">รุ่นที่เปิดรับสมัคร</h2>
            <p className="mt-1 text-sky-card">เลือกรุ่นที่สะดวก แล้วสมัครพร้อมแนบสลิปโอนเงินได้ทันที</p>
            <div className="mt-6 rounded-3xl bg-white p-6 text-navy-900 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-brand px-5 py-2 text-lg font-bold text-white">{COHORT.name}</span>
                  <span className="rounded-full bg-ok/10 px-3 py-1 text-xs font-medium text-ok">
                    ● เปิดรับสมัคร · {COHORT.seatsLeft} ที่นั่ง
                  </span>
                </div>
                <Link href="/register" className="rounded-full bg-navy-800 px-5 py-2 text-sm font-semibold text-white">สมัครรุ่นนี้ →</Link>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {COHORT.sessions.map((s, i) => (
                  <div key={s.title} className="rounded-2xl bg-sky-card/60 p-4 text-sm">
                    <div className="flex items-center gap-2 font-semibold">
                      {i === 0 ? <Laptop className="size-4" /> : i === 1 ? <FileText className="size-4" /> : <Hospital className="size-4" />}
                      {s.title}
                    </div>
                    <div className="mt-3 flex items-center gap-2"><CalendarDays className="size-4 text-brand" />{s.date}</div>
                    <div className="mt-1 flex items-center gap-2"><Clock className="size-4 text-brand" />{s.time}</div>
                    {"extra" in s && s.extra && <div className="mt-1 flex items-center gap-2"><GraduationCap className="size-4 text-brand" />{s.extra}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-14">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-center text-3xl font-bold text-navy-800">ค่าอบรมหลักสูตร</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {PACKAGES.map((p) =>
                p.id === "bundle" ? (
                  <div key={p.id} className="rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-xl">
                    <div className="font-semibold">★ พิเศษ! สมัครครบทั้ง 2 ภาค</div>
                    <div className="mt-1 text-xs opacity-90">จาก 17,000 บาท · ประหยัด 2,000 บาท</div>
                    <div className="mt-4 text-5xl font-bold">{baht(p.price)} <span className="text-lg font-medium">บาท/คน</span></div>
                    <Link href="/register?package=bundle" className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-dark">สมัครแพ็กเกจนี้</Link>
                  </div>
                ) : (
                  <div key={p.id} className="rounded-3xl bg-white p-6 shadow-md">
                    {p.id === "theory" ? <Laptop className="size-7 text-navy-800" /> : <Hospital className="size-7 text-navy-800" />}
                    <div className="mt-3 text-lg font-bold text-navy-800">{p.short}</div>
                    <div className="text-xs text-slate-500">{p.sub}</div>
                    <div className="mt-4 text-3xl font-bold text-navy-800">{baht(p.price)} <span className="text-sm font-medium">บาท/คน</span></div>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Problems / Why */}
        <section className="bg-sky-soft py-14">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-navy-800">คุณกำลังเจอปัญหาเหล่านี้อยู่หรือเปล่า?</h2>
              <ul className="mt-5 space-y-3">
                {PROBLEMS.map((t) => (
                  <li key={t} className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 text-sm shadow-sm">
                    <AlertCircle className="size-4 text-brand" />{t}
                  </li>
                ))}
              </ul>
              <p className="mt-5 font-bold text-navy-800">ส่งพนักงานมาเรียนพื้นฐานก่อน แล้วกลับไปฝึกต่อกับทีมของคุณ</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy-800">ทำไมโรงพยาบาลสัตว์ควรส่งพนักงานมาเรียนกับ VPP?</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {WHY.map(({ icon: Icon, t, d }) => (
                  <div key={t} className="rounded-2xl bg-white p-4 shadow-sm">
                    <Icon className="size-6 text-brand" />
                    <div className="mt-2 text-sm font-bold text-navy-800">{t}</div>
                    <p className="mt-1 text-xs text-slate-600">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Certificate / legal */}
        <section className="py-10">
          <div className="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-2">
            <div className="flex gap-4 rounded-2xl border border-sky-card bg-white p-5">
              <Award className="size-8 shrink-0 text-brand" />
              <div>
                <div className="font-bold text-navy-800">ใบประกาศนียบัตรรับรองจากสัตวแพทยสภา</div>
                <p className="mt-1 text-sm text-slate-600">เพิ่มความน่าเชื่อถือของบุคลากร และสนับสนุนการบริหารทีมในระบบของโรงพยาบาลสัตว์</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-sky-card bg-white p-5">
              <Scale className="size-8 shrink-0 text-navy-800" />
              <div>
                <div className="font-bold text-navy-800">ถูกต้องตามกฎหมาย</div>
                <p className="mt-1 text-sm text-slate-600">การอบรมไม่ได้ทำให้ผู้ช่วยสัตวแพทย์สามารถเป็นสัตวแพทย์ หรือทำหัตถการในขอบเขตวิชาชีพสัตวแพทย์ได้</p>
              </div>
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="py-10">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-navy-800"><BookOpen className="text-brand" />บทความ</h2>
              <span className="text-sm text-navy-800">ดูทั้งหมด →</span>
            </div>
            <p className="mt-4 text-sm text-slate-500">ยังไม่มีบทความที่เผยแพร่</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-sky-soft py-14">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[2fr_1fr]">
            <div>
              <h2 className="text-2xl font-bold text-navy-800">คำถามที่ถามบ่อย</h2>
              <div className="mt-4 divide-y divide-sky-card border-y border-sky-card">
                {FAQ.map((q) => (
                  <div key={q} className="flex items-center justify-between py-3 text-sm font-medium">
                    {q}<ChevronDown className="size-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold text-navy-800"><FileText className="text-brand" />เอกสารแนบ</h2>
              <p className="mt-4 text-sm text-slate-500">ยังไม่มีเอกสารที่เผยแพร่</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
