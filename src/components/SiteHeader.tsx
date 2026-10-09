import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-sky-card bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl font-bold text-navy-800">VPP</span>
          <span className="hidden text-[11px] leading-tight text-slate-500 sm:block">
            Training &amp; Competency System
            <br />
            for Veterinary Hospital
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/#cohorts" className="text-navy-800 hover:text-brand">รุ่นที่เปิด</Link>
          <Link href="/#pricing" className="text-navy-800 hover:text-brand">ค่าอบรม</Link>
          <Link href="/register" className="btn-brand px-4 py-2 text-sm">สมัครเรียน</Link>
        </nav>
      </div>
    </header>
  );
}
