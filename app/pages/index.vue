<script setup lang="ts">
import {
  ArrowRight, Award, CalendarDays, ChevronDown, Clock, FileText, GraduationCap, Hospital,
  HeartPulse, Laptop, PawPrint, Scale, Syringe, ShieldCheck, ShieldPlus, Stethoscope, Users, AlertCircle, BookOpen, Download,
} from "lucide-vue-next";
import { CONTACT, COHORT, PACKAGES, baht } from "#shared/config";

const lineUrl = `https://line.me/R/ti/p/${encodeURIComponent(CONTACT.line)}`;
const mailUrl = `mailto:${CONTACT.email}?subject=${encodeURIComponent("สมัครเรียนหลักสูตรผู้ช่วยสัตวแพทย์ (VPP)")}&body=${encodeURIComponent("ชื่อ-นามสกุล:\nเบอร์โทร:\nแพ็กเกจที่สนใจ (ภาคทฤษฎี / ภาคปฏิบัติ / ครบ 2 ภาค):\nโรงพยาบาล/คลินิกที่สังกัด:")}`;

const { data: latest } = await useAsyncData("latest-articles", () =>
  queryCollection("articles").order("date", "DESC").all().then((r) => r.filter((a) => !a.draft)),
);

const asset = useAsset();
const latestThree = computed(() => (latest.value ?? []).slice(0, 3));
const { data: faq } = await useAsyncData("faq", () => queryCollection("faq").order("order", "ASC").all());
const { data: docs } = await useAsyncData("documents", () => queryCollection("documents").order("order", "ASC").all());

const sessionIcons = [Laptop, FileText, Hospital];

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

</script>

<template>
  <SiteHeader />
  <main>
    <!-- Hero -->
    <section class="bg-gradient-to-b from-white to-sky-soft">
      <div class="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
        <div>
          <div class="flex flex-wrap gap-2 text-sm font-semibold text-white">
            <span class="rounded-full bg-ok px-3 py-1">เปิดรับสมัครแล้ว!</span>
            <span class="rounded-full bg-brand px-3 py-1">รุ่นที่เปิดรับบัตร</span>
          </div>
          <h1 class="mt-5 text-4xl font-bold leading-tight text-navy-800 md:text-5xl">
            หลักสูตรผู้ช่วยสัตวแพทย์
            <span class="block text-brand">ด้านการพยาบาลสัตว์</span>
          </h1>
          <p class="mt-4 max-w-md text-slate-600">
            สร้างทีมที่มีพื้นฐาน ลดภาระการสอนงาน ยกระดับมาตรฐานโรงพยาบาลสัตว์ พร้อมเป็นส่วนหนึ่งของทีมอย่างมั่นใจ
          </p>
          <div class="mt-7 flex flex-wrap gap-3">
            <a href="#contact" class="btn-brand inline-flex items-center gap-2 px-6 py-3">สมัครเรียน / สอบถาม <ArrowRight class="size-5" /></a>
            <a href="#cohorts" class="rounded-full border-2 border-navy-800 px-6 py-3 font-semibold text-navy-800 hover:bg-navy-800 hover:text-white">ดูตารางเรียน</a>
          </div>
        </div>
        <div class="relative mx-auto w-full max-w-md md:max-w-none">
          <div class="absolute -inset-4 -z-0 rounded-[3rem] bg-gradient-to-br from-sky-card via-sky-soft to-white" aria-hidden="true" />
          <img :src="asset('/hero.jpg')" alt="ทีมสัตวแพทย์และผู้ช่วยสัตวแพทย์กำลังดูแลสุนัข" class="relative aspect-[4/4.2] w-full rounded-[2.5rem] object-cover shadow-xl" />
          <span class="float-badge -left-5 top-8"><PawPrint class="size-7 text-navy-700" /></span>
          <span class="float-badge -right-4 top-2"><ShieldPlus class="size-7 text-navy-700" /></span>
          <span class="float-badge -right-6 top-1/3"><Syringe class="size-7 text-navy-700" /></span>
          <span class="float-badge -right-3 top-[58%]"><HeartPulse class="size-7 text-navy-700" /></span>
          <div class="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
            <Award class="size-7 text-brand" />
            <div class="text-sm">
              <div class="font-semibold text-navy-800">ใบประกาศนียบัตร</div>
              <div class="text-xs text-slate-500">รับรองจากสัตวแพทยสภา</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cohorts -->
    <section id="cohorts" class="bg-gradient-to-br from-navy-900 to-navy-700 py-14 text-white">
      <div class="mx-auto max-w-6xl px-5">
        <h2 class="text-3xl font-bold">รุ่นที่เปิดรับสมัคร</h2>
        <p class="mt-1 text-sky-card">เลือกรุ่นที่สะดวก แล้วสมัครผ่าน LINE หรืออีเมลได้ทันที</p>
        <div class="mt-6 rounded-3xl bg-white p-6 text-navy-900 shadow-xl">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-3">
              <span class="rounded-full bg-brand px-5 py-2 text-lg font-bold text-white">{{ COHORT.name }}</span>
              <span class="rounded-full bg-ok/10 px-3 py-1 text-xs font-medium text-ok">● เปิดรับสมัคร · {{ COHORT.seatsLeft }} ที่นั่ง</span>
            </div>
            <a href="#contact" class="rounded-full bg-navy-800 px-5 py-2 text-sm font-semibold text-white">สมัครรุ่นนี้ →</a>
          </div>
          <div class="mt-5 grid gap-4 md:grid-cols-3">
            <div v-for="(s, i) in COHORT.sessions" :key="s.title" class="rounded-2xl bg-sky-card/60 p-4 text-sm">
              <div class="flex items-center gap-2 font-semibold">
                <component :is="sessionIcons[i]" class="size-4" />{{ s.title }}
              </div>
              <div class="mt-3 flex items-center gap-2"><CalendarDays class="size-4 text-brand" />{{ s.date }}</div>
              <div class="mt-1 flex items-center gap-2"><Clock class="size-4 text-brand" />{{ s.time }}</div>
              <div v-if="'extra' in s && s.extra" class="mt-1 flex items-center gap-2"><GraduationCap class="size-4 text-brand" />{{ s.extra }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="py-14">
      <div class="mx-auto max-w-6xl px-5">
        <h2 class="text-center text-3xl font-bold text-navy-800">ค่าอบรมหลักสูตร</h2>
        <div class="mt-8 grid gap-5 md:grid-cols-3">
          <template v-for="p in PACKAGES" :key="p.id">
            <div v-if="p.id === 'bundle'" class="rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-xl">
              <div class="font-semibold">★ พิเศษ! สมัครครบทั้ง 2 ภาค</div>
              <div class="mt-1 text-xs opacity-90">จาก 17,000 บาท · ประหยัด 2,000 บาท</div>
              <div class="mt-4 text-5xl font-bold">{{ baht(p.price) }} <span class="text-lg font-medium">บาท/คน</span></div>
              <a href="#contact" class="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-dark">สมัครแพ็กเกจนี้</a>
            </div>
            <div v-else class="rounded-3xl bg-white p-6 shadow-md">
              <component :is="p.id === 'theory' ? Laptop : Hospital" class="size-7 text-navy-800" />
              <div class="mt-3 text-lg font-bold text-navy-800">{{ p.short }}</div>
              <div class="text-xs text-slate-500">{{ p.sub }}</div>
              <div class="mt-4 text-3xl font-bold text-navy-800">{{ baht(p.price) }} <span class="text-sm font-medium">บาท/คน</span></div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Problems / Why -->
    <section class="bg-sky-soft py-14">
      <div class="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
        <div>
          <h2 class="text-2xl font-bold text-navy-800">คุณกำลังเจอปัญหาเหล่านี้อยู่หรือเปล่า?</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="t in PROBLEMS" :key="t" class="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 text-sm shadow-sm">
              <AlertCircle class="size-4 text-brand" />{{ t }}
            </li>
          </ul>
          <p class="mt-5 font-bold text-navy-800">ส่งพนักงานมาเรียนพื้นฐานก่อน แล้วกลับไปฝึกต่อกับทีมของคุณ</p>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-navy-800">ทำไมโรงพยาบาลสัตว์ควรส่งพนักงานมาเรียนกับ VPP?</h2>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div v-for="w in WHY" :key="w.t" class="rounded-2xl bg-white p-4 shadow-sm">
              <component :is="w.icon" class="size-6 text-brand" />
              <div class="mt-2 text-sm font-bold text-navy-800">{{ w.t }}</div>
              <p class="mt-1 text-xs text-slate-600">{{ w.d }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Certificate / legal -->
    <section class="py-10">
      <div class="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-2">
        <div class="flex gap-4 rounded-2xl border border-sky-card bg-white p-5">
          <Award class="size-8 shrink-0 text-brand" />
          <div>
            <div class="font-bold text-navy-800">ใบประกาศนียบัตรรับรองจากสัตวแพทยสภา</div>
            <p class="mt-1 text-sm text-slate-600">เพิ่มความน่าเชื่อถือของบุคลากร และสนับสนุนการบริหารทีมในระบบของโรงพยาบาลสัตว์</p>
          </div>
        </div>
        <div class="flex gap-4 rounded-2xl border border-sky-card bg-white p-5">
          <Scale class="size-8 shrink-0 text-navy-800" />
          <div>
            <div class="font-bold text-navy-800">ถูกต้องตามกฎหมาย</div>
            <p class="mt-1 text-sm text-slate-600">การอบรมไม่ได้ทำให้ผู้ช่วยสัตวแพทย์สามารถเป็นสัตวแพทย์ หรือทำหัตถการในขอบเขตวิชาชีพสัตวแพทย์ได้</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Articles -->
    <section class="py-10">
      <div class="mx-auto max-w-6xl px-5">
        <div class="flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-2xl font-bold text-navy-800"><BookOpen class="text-brand" />บทความ</h2>
          <NuxtLink to="/articles" class="text-sm text-navy-800">ดูทั้งหมด →</NuxtLink>
        </div>
        <ul v-if="latestThree.length" class="mt-4 grid gap-4 md:grid-cols-3">
          <li v-for="a in latestThree" :key="a.path">
            <NuxtLink :to="a.path" class="block h-full overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md">
              <img v-if="a.cover" :src="asset(a.cover)" :alt="a.title" class="h-36 w-full object-cover" />
              <div class="p-5">
              <span v-if="a.cohort" class="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">{{ a.cohort }}</span>
              <div class="mt-2 font-bold text-navy-800">{{ a.title }}</div>
              <p v-if="a.description" class="mt-1 text-sm text-slate-600">{{ a.description }}</p>
              </div>
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="mt-4 text-sm text-slate-500">ยังไม่มีบทความที่เผยแพร่</p>
      </div>
    </section>

    <!-- FAQ -->
    <section class="bg-sky-soft py-14">
      <div class="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[2fr_1fr]">
        <div>
          <h2 class="text-2xl font-bold text-navy-800">คำถามที่ถามบ่อย</h2>
          <div class="mt-4 divide-y divide-sky-card border-y border-sky-card">
            <details v-for="f in faq ?? []" :key="f.id" class="group py-3">
              <summary class="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                {{ f.question }}<ChevronDown class="size-4 text-slate-400 transition group-open:rotate-180" />
              </summary>
              <p class="mt-2 whitespace-pre-line text-sm text-slate-600">{{ f.answer }}</p>
            </details>
          </div>
        </div>
        <div>
          <h2 class="flex items-center gap-2 text-2xl font-bold text-navy-800"><FileText class="text-brand" />เอกสารแนบ</h2>
          <ul v-if="docs?.length" class="mt-4 space-y-2">
            <li v-for="d in docs" :key="d.id">
              <a :href="asset(d.file)" download class="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-navy-800 shadow-sm hover:shadow-md">
                <Download class="size-4 shrink-0 text-brand" /><span class="min-w-0"><span class="block truncate">{{ d.title }}</span><span v-if="d.note" class="block truncate text-xs text-slate-500">{{ d.note }}</span></span>
              </a>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-slate-500">ยังไม่มีเอกสารที่เผยแพร่</p>
        </div>
      </div>
    </section>
    <!-- Contact -->
    <section id="contact" class="bg-gradient-to-br from-navy-900 to-navy-700 py-14 text-white">
      <div class="mx-auto max-w-3xl px-5 text-center">
        <h2 class="text-3xl font-bold">สมัครเรียน / สอบถาม</h2>
        <p class="mt-3 text-sky-card">
          ส่งชื่อ-นามสกุล เบอร์โทร แพ็กเกจที่สนใจ และโรงพยาบาล/คลินิกที่สังกัด
          ทาง LINE หรืออีเมล ทีมงานจะแจ้งขั้นตอนการชำระเงินกลับไป
        </p>
        <div class="mt-7 flex flex-wrap justify-center gap-3">
          <a :href="lineUrl" target="_blank" rel="noopener" class="btn-brand px-7 py-3">LINE {{ CONTACT.line }}</a>
          <a :href="mailUrl" class="rounded-full bg-white px-7 py-3 font-semibold text-navy-800">อีเมล {{ CONTACT.email }}</a>
        </div>
        <p class="mt-4 text-sm text-sky-card">โทร {{ CONTACT.phone }}</p>
      </div>
    </section>
  </main>
  <SiteFooter />
</template>
