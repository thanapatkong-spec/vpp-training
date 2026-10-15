<script setup lang="ts">
import {
  ArrowRight, Award, CalendarDays, ChevronDown, Clock, FileText, GraduationCap, Hospital,
  HeartPulse, Laptop, PawPrint, Scale, Syringe, ShieldCheck, ShieldPlus, Stethoscope, Users, AlertCircle, BookOpen, Download,
} from "lucide-vue-next";
import { baht } from "#shared/config";
import { cohortPackages } from "#shared/cohorts";
import { textsOf } from "#shared/siteSettings";

// ข้อความทั้งหมดแก้ได้ในหน้าแอดมิน > เนื้อหาเว็บ > ตั้งค่าเว็บไซต์ · เนื้อหา/รุ่นดึงสดจากฐานข้อมูล
const site = await useSiteSettings();
const lineUrl = computed(() => `https://line.me/R/ti/p/${encodeURIComponent(site.value.contactLine)}`);
const mailUrl = computed(() => `mailto:${site.value.contactEmail}?subject=${encodeURIComponent("สมัครเรียนหลักสูตรผู้ช่วยสัตวแพทย์ (VPP)")}&body=${encodeURIComponent("ชื่อ-นามสกุล:\nเบอร์โทร:\nแพ็กเกจที่สนใจ (ภาคทฤษฎี / ครบ 2 ภาค):\nโรงพยาบาล/คลินิกที่สังกัด:")}`);

const [latest, faq, docs] = await Promise.all([useContentList("articles"), useContentList("faq"), useContentList("documents")]);

const asset = useAsset();
const applyTo = useRuntimeConfig().public.membersEnabled ? "/apply" : "/#contact";
const latestThree = computed(() => latest.value.slice(0, 3));

const sessionIcons = { theory: Laptop, exam: FileText, practical: Hospital, other: CalendarDays };
const allCohorts = await useCohorts();
const cohorts = computed(() => allCohorts.value.filter((c) => c.status !== "hidden"));
const openCohort = computed(() => cohorts.value.find((c) => c.status === "open"));
// ราคาในส่วน "ค่าอบรมหลักสูตร" ใช้รุ่นแรกที่เปิดรับ (หรือรุ่นแรกที่แสดง)
const priceCohort = computed(() => openCohort.value ?? cohorts.value[0]);
const packages = computed(() => cohortPackages(priceCohort.value, site.value));
const bundle = computed(() => packages.value.find((p) => p.id === "bundle")!);
// แสดงราคาในการ์ดรุ่นเฉพาะเมื่อรุ่นที่เปิดรับมีราคาไม่เท่ากัน
const priceKey = (c: { priceTheory: number; pricePractical: number; priceBundle: number }) => `${c.priceTheory}/${c.pricePractical}/${c.priceBundle}`;
const pricesDiffer = computed(() => new Set(cohorts.value.filter((c) => c.status === "open").map(priceKey)).size > 1);
const applyLink = (id: string) => (applyTo === "/apply" ? `/apply?cohort=${encodeURIComponent(id)}` : applyTo);

const PROBLEMS = computed(() => textsOf(site.value.problems));
const WHY_ICONS = [FileText, Users, Stethoscope, ShieldCheck];
const WHY = computed(() => site.value.why.map((w, i) => ({ icon: WHY_ICONS[i % WHY_ICONS.length], t: w.title, d: w.text })));

</script>

<template>
  <SiteHeader />
  <main>
    <!-- Hero -->
    <section class="bg-gradient-to-b from-white to-sky-soft">
      <div class="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
        <div>
          <div class="flex flex-wrap gap-2 text-sm font-semibold text-white">
            <span v-if="openCohort" class="rounded-full bg-ok px-3 py-1">เปิดรับสมัครแล้ว!</span>
            <span v-if="openCohort" class="rounded-full bg-brand px-3 py-1">{{ openCohort.name }}</span>
          </div>
          <h1 class="mt-5 text-4xl font-bold leading-tight text-navy-800 md:text-5xl">
            {{ site.heroTitle }}
            <span class="block text-brand">{{ site.heroTitle2 }}</span>
          </h1>
          <p class="mt-4 max-w-md text-slate-600">{{ site.heroText }}</p>
          <div class="mt-7 flex flex-wrap gap-3">
            <NuxtLink :to="applyTo" class="btn-brand px-6 py-3"><span class="inline-flex items-center gap-2 whitespace-nowrap">{{ site.heroCta }} <ArrowRight class="size-5" /></span></NuxtLink>
            <a href="#cohorts" class="rounded-full border-2 border-navy-800 px-6 py-3 font-semibold text-navy-800 hover:bg-navy-800 hover:text-white">ดูตารางเรียน</a>
          </div>
          <NuxtLink to="/collaboration" class="mt-8 inline-flex flex-wrap items-center gap-4 rounded-2xl bg-white/90 px-5 py-3 shadow-sm transition hover:shadow-md">
            <span class="text-sm font-semibold text-navy-800">ความร่วมมือระหว่าง</span>
            <img :src="asset('/partners/dr-john-logo.png')" alt="Dr.John Pet Ambulance" class="h-12 w-auto object-contain" />
            <span class="h-8 w-px bg-slate-200" aria-hidden="true" />
            <img :src="asset('/partners/kachavet-logo.jpg')" alt="โรงพยาบาลสัตว์คชาเว็ท" class="h-12 w-auto object-contain" />
          </NuxtLink>
        </div>
        <div class="relative mx-auto w-full max-w-md md:max-w-none">
          <img :src="asset('/hero.jpg')" alt="ทีมสัตวแพทย์และผู้ช่วยสัตวแพทย์กำลังดูแลสุนัข" class="hero-photo relative aspect-[4/4.2] w-full object-cover" />
          <span class="float-badge -left-5 top-8"><PawPrint class="size-7 text-navy-700" /></span>
          <span class="float-badge -right-4 top-2"><ShieldPlus class="size-7 text-navy-700" /></span>
          <span class="float-badge -right-6 top-1/3"><Syringe class="size-7 text-navy-700" /></span>
          <span class="float-badge -right-3 top-[58%]"><HeartPulse class="size-7 text-navy-700" /></span>
          <div class="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
            <Award class="size-7 text-brand" />
            <div class="text-sm">
              <div class="font-semibold text-navy-800">{{ site.heroBadgeTitle }}</div>
              <div class="text-xs text-slate-500">{{ site.heroBadgeText }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Cohorts -->
    <section id="cohorts" class="bg-gradient-to-br from-navy-900 to-navy-700 py-14 text-white">
      <div class="mx-auto max-w-6xl px-5">
        <h2 class="text-3xl font-bold">{{ site.cohortsTitle }}</h2>
        <p class="mt-1 text-sky-card">{{ site.cohortsText }}</p>
        <div v-for="c in cohorts" :key="c.id" class="mt-6 rounded-3xl bg-white p-6 text-navy-900 shadow-xl">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-3">
              <span class="rounded-full px-5 py-2 text-lg font-bold text-white" :class="c.status === 'open' ? 'bg-brand' : 'bg-slate-400'">{{ c.name }}</span>
              <span v-if="c.status === 'open'" class="rounded-full bg-ok/10 px-3 py-1 text-xs font-medium text-ok">● เปิดรับสมัคร{{ c.seats ? ` · ${c.seats} ที่นั่ง` : "" }}</span>
              <span v-else class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">● {{ c.status === "full" ? "เต็มแล้ว" : "ปิดรับสมัคร" }}</span>
            </div>
            <NuxtLink v-if="c.status === 'open'" :to="applyLink(c.id)" class="rounded-full bg-navy-800 px-5 py-2 text-sm font-semibold text-white">สมัครรุ่นนี้ →</NuxtLink>
          </div>
          <div v-if="c.sessions.length" class="mt-5 grid gap-4" :class="c.sessions.length >= 3 ? 'md:grid-cols-3' : c.sessions.length === 2 ? 'md:grid-cols-2' : ''">
            <div v-for="(s, i) in c.sessions" :key="i" class="rounded-2xl bg-sky-card/60 p-4 text-sm">
              <div class="flex items-center gap-2 font-semibold">
                <component :is="sessionIcons[s.icon || 'other']" class="size-4" />{{ s.title }}
              </div>
              <div v-if="s.date" class="mt-3 flex items-center gap-2"><CalendarDays class="size-4 shrink-0 text-brand" />{{ s.date }}</div>
              <div v-if="s.time" class="mt-1 flex items-center gap-2"><Clock class="size-4 shrink-0 text-brand" />{{ s.time }}</div>
              <div v-if="s.extra" class="mt-1 flex items-center gap-2"><GraduationCap class="size-4 shrink-0 text-brand" />{{ s.extra }}</div>
            </div>
          </div>
          <p v-if="pricesDiffer && c.status === 'open'" class="mt-4 text-sm text-slate-600">
            ค่าเรียนรุ่นนี้: ภาคทฤษฎี <b>{{ baht(c.priceTheory) }}</b> · ภาคปฏิบัติ <b>{{ baht(c.pricePractical) }}</b> · ครบ 2 ภาค <b class="text-brand">{{ baht(c.priceBundle) }}</b> บาท/คน<template v-if="Number(site.vatRate) > 0"> (ยังไม่รวม VAT)</template>
          </p>
        </div>
        <div v-if="!cohorts.length" class="mt-6 rounded-3xl bg-white p-6 text-navy-900 shadow-xl">
          <p class="font-semibold">ยังไม่มีรุ่นที่เปิดรับสมัคร</p>
          <p class="mt-1 text-sm text-slate-600">สนใจเรียนรุ่นถัดไป ติดต่อทีมงานทาง LINE {{ site.contactLine }} หรือโทร {{ site.contactPhone }}</p>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="py-14">
      <div class="mx-auto max-w-6xl px-5">
        <h2 class="text-center text-3xl font-bold text-navy-800">{{ site.pricingTitle }}</h2>
        <div class="mt-8 grid gap-5 md:grid-cols-3">
          <template v-for="p in packages" :key="p.id">
            <div v-if="p.id === 'bundle'" class="rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-xl">
              <div class="font-semibold">{{ site.pkgBundleHeadline }}</div>
              <div v-if="bundle.save && bundle.save > 0" class="mt-1 text-xs opacity-90">จาก {{ baht(bundle.full!) }} บาท · ประหยัด {{ baht(bundle.save) }} บาท</div>
              <div class="mt-4 text-5xl font-bold">{{ baht(p.price) }} <span class="text-lg font-medium">บาท/คน</span></div>
              <NuxtLink :to="applyTo" class="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-dark">สมัครแพ็กเกจนี้</NuxtLink>
            </div>
            <div v-else class="rounded-3xl bg-white p-6 shadow-md">
              <component :is="p.id === 'theory' ? Laptop : Hospital" class="size-7 text-navy-800" />
              <div class="mt-3 text-lg font-bold text-navy-800">{{ p.short }}</div>
              <div class="text-xs text-slate-500">{{ p.sub }}</div>
              <div class="mt-4 text-3xl font-bold text-navy-800">{{ baht(p.price) }} <span class="text-sm font-medium">บาท/คน</span></div>
              <div v-if="p.id === 'practical' && site.pkgPracticalNote" class="mt-2 text-xs text-amber-700">{{ site.pkgPracticalNote }}</div>
            </div>
          </template>
        </div>
        <p v-if="Number(site.vatRate) > 0" class="mt-4 text-center text-xs text-slate-500">ราคายังไม่รวม VAT {{ site.vatRate }}% · ออกใบเสร็จรับเงินและใบกำกับภาษีได้</p>
      </div>
    </section>

    <!-- Problems / Why -->
    <section class="bg-sky-soft py-14">
      <div class="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
        <div>
          <h2 class="text-2xl font-bold text-navy-800">{{ site.problemsTitle }}</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="t in PROBLEMS" :key="t" class="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 text-sm shadow-sm">
              <AlertCircle class="size-4 text-brand" />{{ t }}
            </li>
          </ul>
          <p class="mt-5 font-bold text-navy-800">{{ site.problemsFooter }}</p>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-navy-800">{{ site.whyTitle }}</h2>
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
            <div class="font-bold text-navy-800">{{ site.certTitle }}</div>
            <p class="mt-1 text-sm text-slate-600">{{ site.certText }}</p>
          </div>
        </div>
        <div class="flex gap-4 rounded-2xl border border-sky-card bg-white p-5">
          <Scale class="size-8 shrink-0 text-navy-800" />
          <div>
            <div class="font-bold text-navy-800">{{ site.legalTitle }}</div>
            <p class="mt-1 text-sm text-slate-600">{{ site.legalText }}</p>
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
          <li v-for="a in latestThree" :key="a.slug">
            <NuxtLink :to="`/articles/${a.slug}`" class="block h-full overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md">
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
            <details v-for="f in faq" :key="f.slug" class="group py-3">
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
            <li v-for="d in docs" :key="d.slug">
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
        <h2 class="text-3xl font-bold">{{ site.contactTitle }}</h2>
        <p class="mt-3 text-sky-card">{{ site.contactText }}</p>
        <div class="mt-7 flex flex-wrap justify-center gap-3">
          <a :href="lineUrl" target="_blank" rel="noopener" class="btn-brand px-7 py-3">LINE {{ site.contactLine }}</a>
          <a :href="mailUrl" class="rounded-full bg-white px-7 py-3 font-semibold text-navy-800">อีเมล {{ site.contactEmail }}</a>
        </div>
        <p class="mt-4 text-sm text-sky-card">โทร {{ site.contactPhone }}</p>
      </div>
    </section>
  </main>
  <SiteFooter />
</template>
