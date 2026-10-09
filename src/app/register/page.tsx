import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "สมัครเรียนและชำระเงิน · VPP" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen">
      <div className="bg-gradient-to-br from-navy-900 to-navy-700 pb-16 pt-10 text-white">
        <div className="mx-auto max-w-3xl px-5">
          <Link href="/" className="flex items-center gap-1 text-sm text-sky-card"><ArrowLeft className="size-4" />กลับหน้าหลัก</Link>
          <h1 className="mt-4 text-3xl font-bold">สมัครเรียนและชำระเงิน</h1>
        </div>
      </div>
      <div className="mx-auto -mt-8 max-w-3xl px-5 pb-16">
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
