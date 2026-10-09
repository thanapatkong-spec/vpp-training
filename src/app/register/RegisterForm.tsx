"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Landmark, Upload } from "lucide-react";
import { BANK, COHORT, PACKAGES, baht, type PackageId } from "@/lib/config";
import { registerAction, type RegisterState } from "./actions";

const input = "w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm outline-none focus:border-brand";

function Step({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="mb-5 flex items-center gap-3 text-xl font-bold text-navy-800">
      <span className="flex size-9 items-center justify-center rounded-full bg-navy-800 text-base text-white">{n}</span>
      {title}
    </h2>
  );
}

export function RegisterForm() {
  const q = useSearchParams().get("package");
  const initial: PackageId = q === "theory" || q === "practical" ? q : "bundle";
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction, { ok: false });
  const [pkg, setPkg] = useState<PackageId>(initial);
  const [fileName, setFileName] = useState("");
  const price = PACKAGES.find((p) => p.id === pkg)!.price;
  const fe = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-lg">
        <CheckCircle2 className="mx-auto size-14 text-ok" />
        <h2 className="mt-4 text-2xl font-bold text-navy-800">ส่งใบสมัครเรียบร้อยแล้ว</h2>
        <p className="mt-2 text-sm text-slate-600">ทีมงานจะตรวจสอบสลิปและติดต่อกลับทางอีเมล/Line ภายใน 1–2 วันทำการ</p>
        <Link href="/" className="btn-brand mt-6 inline-block px-6 py-3 text-sm">กลับหน้าหลัก</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <section className="rounded-3xl bg-white p-7 shadow-md">
        <Step n={1} title="เลือกรุ่นและแพ็กเกจ" />
        <div className="mb-4 inline-block rounded-2xl border-2 border-brand bg-orange-50 px-5 py-3">
          <div className="font-bold text-navy-800">{COHORT.name}</div>
          <div className="text-xs text-slate-600">{COHORT.registerLabel}</div>
        </div>
        <div className="space-y-3">
          {PACKAGES.map((p) => (
            <label key={p.id} className={`flex cursor-pointer items-center justify-between rounded-full border-2 px-5 py-3.5 text-sm ${pkg === p.id ? "border-brand bg-orange-50" : "border-slate-200"}`}>
              <span className="flex items-center gap-3">
                <input type="radio" name="packageId" value={p.id} checked={pkg === p.id} onChange={() => setPkg(p.id)} className="accent-brand" />
                {p.label}
              </span>
              <b className="text-navy-800">{baht(p.price)} ฿</b>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-7 shadow-md">
        <Step n={2} title="ข้อมูลผู้สมัคร" />
        <div className="grid gap-4 md:grid-cols-2">
          <div><input name="fullName" placeholder="ชื่อ-นามสกุล *" className={input} /><Err m={fe.fullName} /></div>
          <div><input name="phone" inputMode="tel" placeholder="เบอร์โทร *" className={input} /><Err m={fe.phone} /></div>
          <div><input name="email" type="email" placeholder="อีเมล *" className={input} /><Err m={fe.email} /></div>
          <div><input name="lineId" placeholder="Line ID" className={input} /></div>
          <div className="md:col-span-2"><input name="workplace" placeholder="โรงพยาบาล/คลินิกที่สังกัด" className={input} /></div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-7 shadow-md">
        <Step n={3} title="โอนเงินและแนบสลิป" />
        <div className="flex items-center justify-between gap-4 rounded-3xl bg-sky-card p-5">
          <div className="flex items-center gap-4">
            <Landmark className="size-9 text-navy-800" />
            <div>
              <div className="text-xs text-slate-600">{BANK.name}</div>
              <div className="text-2xl font-bold text-navy-800">{BANK.number}</div>
              <div className="text-xs text-slate-600">{BANK.holder}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-600">ยอดชำระ</div>
            <div className="text-2xl font-bold text-brand">{baht(price)} ฿</div>
          </div>
        </div>
        <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 p-8 text-sm text-slate-600 hover:border-brand">
          <Upload className="size-7 text-navy-800" />
          {fileName || "คลิกเพื่อแนบสลิป (รูปภาพ หรือ PDF ไม่เกิน 5MB)"}
          <input type="file" name="slip" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
        </label>
        <Err m={fe.slip} />
      </section>

      {state.error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-brand w-full py-4 text-lg disabled:opacity-60">
        {pending ? "กำลังส่ง..." : "ยืนยันการสมัคร"}
      </button>
    </form>
  );
}

function Err({ m }: { m?: string }) {
  return m ? <p className="mt-1 px-4 text-xs text-red-600">{m}</p> : null;
}
