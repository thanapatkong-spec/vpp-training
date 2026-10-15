<script setup lang="ts">
import { CheckCircle2, Mail } from "lucide-vue-next";
import { APP_DOCS, APP_STATUS, COUNCIL_CHECK, APPLY_PACKAGES, ApplicationInput, validThaiId, type AppDocKind } from "#shared/application";
import { textsOf } from "#shared/siteSettings";
import { baht } from "#shared/config";
import { cohortPackages } from "#shared/cohorts";
import type { Council } from "~/components/CouncilFeeCard.vue";

useHead({ title: "สมัครเรียน VPP · VPP" });
const auth = useAuthClient();
const sessionState = auth.useSession();
const session = computed(() => sessionState.value.data);
const isPending = computed(() => sessionState.value.isPending);
const route = useRoute();
const [cohorts, site] = await Promise.all([useCohorts(), useSiteSettings()]);
const PREFIXES = computed(() => textsOf(site.value.formPrefixes));
const EDUCATION = computed(() => textsOf(site.value.formEducation));
// ใบสมัครแยกตามรุ่น: /apply?cohort=<รหัส> = ใบของรุ่นนั้น · /apply = รายการใบสมัครของฉัน (หรือฟอร์มถ้ายังไม่เคยสมัคร)
type MyApp = { id: string; cohortId: string; packageId: string; status: string; councilCheck: string | null; updatedAt: string; paid: boolean; council: "paid" | "pending" | null };
const myApps = ref<MyApp[]>([]);
const openCohorts = computed(() => cohorts.value.filter((c) => c.status === "open"));
// รุ่นที่ยังสมัครได้ = เปิดรับ และยังไม่มีใบสมัครที่ใช้งานอยู่ (ไม่ผ่าน = สมัครใหม่ได้)
const canApply = (id: string) => !myApps.value.some((a) => a.cohortId === id && a.status !== "rejected");
const firstCohort = () => openCohorts.value.find((c) => c.id === route.query.cohort)?.id || openCohorts.value.find((c) => canApply(c.id))?.id || "";

type Pay = { id: string; amount: number; status: string; note: string | null; transRef: string | null; createdAt: string; paidAt: string | null };
type Existing = { id: string; status: string; adminNote: string | null; files: { id: string; kind: string; name: string; status: string; note: string | null }[]; payment?: { amount: number; base: number; vat: number; vatRate: number; open: boolean; paid: boolean; pending: boolean; history: Pay[]; promptpay: { payload: string; name: string } | null; autoCheck: boolean }; council?: Council } & Record<string, any>;
const existing = ref<Existing | null>(null);
const cohortCtx = computed(() => String(route.query.cohort || ""));
const appUrl = (cohort: string) => `/api/me/application?cohort=${encodeURIComponent(cohort)}`;
const loaded = ref(false);

const DRAFT_KEY = "vpp-apply-draft";
const blank = () => ({
  cohortId: firstCohort(), packageId: "bundle", prefix: "", firstName: "", lastName: "", nationalId: "", birthDate: "", phone: "", lineId: "", address: "",
  education: "", school: "", workplace: "", position: "", experienceYears: "" as string | number,
  payer: "self", invoiceName: "", invoiceAddress: "", invoiceTaxId: "", consent: false,
});
const f = reactive(blank());
const files = reactive<Partial<Record<AppDocKind, File>>>({});
const errors = ref<Record<string, string>>({});
const step = ref(1);
const sending = ref(false);
const formError = ref("");
const done = ref(false);

const STEPS = ["ข้อมูลส่วนตัว", "การศึกษาและที่ทำงาน", "รุ่นและแพ็กเกจ", "เอกสาร", "ตรวจทานและส่ง"];
const STEP_FIELDS: string[][] = [
  ["prefix", "firstName", "lastName", "nationalId", "birthDate", "phone", "lineId", "address"],
  ["education", "school", "workplace", "position", "experienceYears"],
  ["cohortId", "packageId", "payer", "invoiceName", "invoiceAddress", "invoiceTaxId"],
  [],
  ["consent"],
];

// แก้ไขได้เมื่อยังไม่เคยส่ง, แอดมินขอแก้ไข หรือครั้งก่อนไม่ผ่าน
const editable = computed(() => !existing.value || ["needs_changes", "rejected"].includes(existing.value.status));
const fileState = (kind: string) => existing.value?.status === "needs_changes" ? existing.value.files.find((x) => x.kind === kind) : undefined;
const needsFile = (kind: AppDocKind) => !fileState(kind) || fileState(kind)!.status === "rejected";

const showForm = ref(false); // /apply ที่มีใบสมัครแล้ว: กด "สมัครรุ่นอื่น" เพื่อเปิดฟอร์ม
async function load() {
  existing.value = null;
  done.value = false;
  try {
    if (cohortCtx.value) existing.value = await $fetch<Existing | null>(appUrl(cohortCtx.value));
    myApps.value = await $fetch<MyApp[]>("/api/me/applications");
  } catch {}
  if (existing.value && editable.value) {
    for (const k of Object.keys(blank())) if (k in existing.value && existing.value[k] != null) (f as any)[k] = existing.value[k];
    f.consent = false;
  } else if (!existing.value) {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (d) Object.assign(f, d, { consent: false });
    } catch {}
    if (route.query.cohort || !openCohorts.value.some((c) => c.id === f.cohortId)) f.cohortId = firstCohort(); // ลิงก์ "สมัครรุ่นนี้" / รุ่นในร่างปิดรับแล้ว
    if (!f.firstName && session.value?.user.name) {
      const [a, ...b] = session.value.user.name.trim().split(/\s+/);
      f.firstName = a || "";
      f.lastName = b.join(" ");
    }
  }
  loaded.value = true;
}
// สลับรุ่น (เช่น กดเมนู "สมัครเรียน" ขณะดูใบสมัครของรุ่นหนึ่ง) → โหลดใหม่
watch(cohortCtx, () => {
  if (!session.value) return;
  showForm.value = false;
  Object.assign(f, blank());
  loaded.value = false;
  load();
});
watchEffect(() => {
  if (isPending.value || loaded.value) return;
  if (session.value) load();
  else loaded.value = true;
});
// บันทึกร่างไว้ในเครื่อง (ไม่เก็บเลขบัตร)
watch(f, () => {
  if (existing.value) return;
  try { const { nationalId: _n, consent: _c, ...rest } = f; localStorage.setItem(DRAFT_KEY, JSON.stringify(rest)); } catch {}
}, { deep: true });

function validateStep(n: number) {
  errors.value = {};
  if (n === 4) {
    for (const d of APP_DOCS) if (needsFile(d.kind) && !files[d.kind]) errors.value[d.kind] = `กรุณาแนบ${d.label}`;
    return !Object.keys(errors.value).length;
  }
  const r = ApplicationInput.safeParse({ ...f, experienceYears: f.experienceYears === "" ? undefined : f.experienceYears });
  if (r.success) return true;
  if (!r.error) return true;
  for (const i of r.error.issues) {
    const k = String(i.path[0]);
    if (STEP_FIELDS[n - 1]!.includes(k)) errors.value[k] ||= i.message;
  }
  // เงื่อนไขข้ามช่อง (zod ตรวจหลังฟิลด์อื่นผ่านหมดเท่านั้น จึงตรวจเองที่นี่ด้วย)
  if (n === 3 && f.payer === "employer" && !f.invoiceName.trim()) errors.value.invoiceName = "กรุณากรอกชื่อผู้ออกใบเสร็จ (นายจ้าง)";
  return !Object.keys(errors.value).length;
}
function next() {
  if (validateStep(step.value)) step.value++;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function go(n: number) {
  if (n < step.value) step.value = n;
}

const shrinking = ref<Partial<Record<string, boolean>>>({});
async function pickDoc(kind: AppDocKind, file: File | undefined) {
  if (!file) return (files[kind] = undefined);
  shrinking.value[kind] = true;
  try { files[kind] = await shrinkForUpload(file); } finally { shrinking.value[kind] = false; }
  delete errors.value[kind];
}
const totalSize = computed(() => Object.values(files).reduce((s, x) => s + (x?.size || 0), 0));

async function submit() {
  formError.value = "";
  for (const n of [1, 2, 3, 4, 5]) {
    if (!validateStep(n)) {
      step.value = n;
      return;
    }
  }
  if (totalSize.value > 4 * 1024 * 1024) {
    // ยังใหญ่เกิน: ย่อทุกไฟล์ลงอีกขั้นอัตโนมัติ
    for (const d of APP_DOCS) if (files[d.kind]) files[d.kind] = await shrinkForUpload(files[d.kind]!, 900 * 1024);
    if (totalSize.value > 4 * 1024 * 1024) return (formError.value = "ไฟล์ใหญ่มาก ระบบย่อให้แล้วแต่ยังเกินที่ส่งได้ กรุณาแนบไฟล์ที่มีจำนวนหน้าน้อยลง หรือติดต่อทีมงาน");
  }
  const fd = new FormData();
  fd.append("data", JSON.stringify({ ...f, experienceYears: f.experienceYears === "" ? undefined : f.experienceYears }));
  for (const d of APP_DOCS) if (files[d.kind]) fd.append(d.kind, files[d.kind]!);
  sending.value = true;
  try {
    await $fetch("/api/me/application", { method: "POST", body: fd });
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    const sentCohort = f.cohortId;
    if (cohortCtx.value !== sentCohort) await navigateTo({ query: { cohort: sentCohort } }, { replace: true });
    existing.value = await $fetch<Existing | null>(appUrl(sentCohort));
    myApps.value = await $fetch<MyApp[]>("/api/me/applications").catch(() => myApps.value);
    done.value = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (e: any) {
    const fe = e?.data?.data?.fieldErrors as Record<string, string> | undefined;
    if (fe) {
      errors.value = fe;
      const s = STEP_FIELDS.findIndex((fs) => fs.some((k) => fe[k]));
      if (s >= 0) step.value = s + 1;
    }
    formError.value = e?.status === 413 ? "ไฟล์ใหญ่เกินที่ระบบรับได้" : e?.data?.message || "ส่งใบสมัครไม่สำเร็จ";
  } finally {
    sending.value = false;
  }
}

// รุ่นที่เลือกได้: รุ่นที่เปิดรับ + รุ่นเดิมของใบสมัครที่ขอแก้ไข (แม้ปิดรับแล้ว)
const cohortChoices = computed(() => cohorts.value.filter((c) => (c.status === "open" && canApply(c.id)) || c.id === existing.value?.cohortId));
const selCohort = computed(() => cohorts.value.find((c) => c.id === f.cohortId));
// หัวข้อหน้า: รุ่นของใบสมัครที่ดูอยู่ / รุ่นที่เลือกในฟอร์ม (หน้ารายการใบสมัครของฉันไม่ระบุรุ่น)
const headCohort = computed(() => {
  if (existing.value) return cohorts.value.find((c) => c.id === existing.value!.cohortId);
  if (!cohortCtx.value && myApps.value.length && !showForm.value) return undefined;
  return selCohort.value;
});
const packages = computed(() => cohortPackages(selCohort.value, site.value));
const pkg = computed(() => packages.value.find((p) => p.id === f.packageId));
const vatRate = computed(() => { const n = Number.parseFloat(site.value.vatRate); return Number.isFinite(n) && n >= 0 ? n : 7; });
const applyPackages = computed(() => APPLY_PACKAGES.map((id) => packages.value.find((p) => p.id === id)!));

// ---- ชำระค่าเรียน (พร้อมเพย์ + สลิป) ----
const qrSrc = ref("");
const slip = ref<File>();
const paying = ref(false);
const payMsg = ref<{ ok: boolean; text: string } | null>(null);
watch(() => existing.value?.payment?.promptpay?.payload, async (payload) => {
  if (!payload) return (qrSrc.value = "");
  const QR = await import("qrcode");
  qrSrc.value = await QR.toDataURL(payload, { width: 280, margin: 1 });
}, { immediate: true });
async function sendSlip() {
  payMsg.value = null;
  if (!slip.value) return (payMsg.value = { ok: false, text: "กรุณากดปุ่ม \"แนบสลิป\" แล้วเลือกรูปสลิป" });
  const fd = new FormData();
  fd.append("cohort", existing.value!.cohortId);
  fd.append("slip", await shrinkImage(slip.value, 2 * 1024 * 1024));
  paying.value = true;
  try {
    const r = await $fetch<{ status: string }>("/api/me/payment", { method: "POST", body: fd });
    payMsg.value = { ok: true, text: r.status === "paid" ? "ชำระเงินสำเร็จ ระบบส่งอีเมลยืนยันให้แล้ว" : "ส่งสลิปแล้ว ทีมงานจะตรวจสอบและยืนยันทางอีเมล" };
    slip.value = undefined;
    existing.value = await $fetch<Existing | null>(appUrl(existing.value!.cohortId));
  } catch (e: any) {
    payMsg.value = { ok: false, text: e?.data?.message || "ส่งสลิปไม่สำเร็จ" };
    existing.value = await $fetch<Existing | null>(appUrl(existing.value!.cohortId)).catch(() => existing.value);
  } finally {
    paying.value = false;
  }
}
async function reloadExisting() {
  if (!existing.value) return;
  existing.value = await $fetch<Existing | null>(appUrl(existing.value.cohortId)).catch(() => existing.value);
  myApps.value = await $fetch<MyApp[]>("/api/me/applications").catch(() => myApps.value);
}
const idHint = computed(() => (f.nationalId.replace(/\D/g, "").length === 13 && !validThaiId(f.nationalId.replace(/\D/g, "")) ? "เลขบัตรไม่ถูกต้อง ตรวจสอบอีกครั้ง" : ""));
const cohortName = (id: string) => cohorts.value.find((c) => c.id === id)?.name || id;
const pkgShort = (id: string) => cohortPackages(undefined, site.value).find((p) => p.id === id)?.short || id;
const fmt = (d: string) => (d ? new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-");
</script>

<template>
  <SiteHeader />
  <main class="mx-auto w-full max-w-3xl px-5 py-12">
    <h1 class="text-3xl font-bold text-navy-800">สมัครเรียนหลักสูตร VPP</h1>
    <p class="mt-1 text-sm text-slate-600">หลักสูตรผู้ช่วยสัตวแพทย์ด้านการพยาบาลสัตว์<template v-if="headCohort"> · {{ headCohort.name }}{{ headCohort.dates ? ` (${headCohort.dates})` : "" }}</template></p>

    <!-- ยังไม่ล็อกอิน -->
    <section v-if="loaded && !session" class="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <p class="text-slate-700">กรุณาสมัครสมาชิกหรือเข้าสู่ระบบก่อน เพื่อบันทึกใบสมัครและติดตามสถานะได้</p>
      <div class="mt-4 flex flex-wrap gap-3">
        <NuxtLink :to="`/signup?next=${encodeURIComponent(route.fullPath)}`" class="btn-brand px-6 py-2.5 text-sm">สมัครสมาชิก</NuxtLink>
        <NuxtLink :to="`/login?next=${encodeURIComponent(route.fullPath)}`" class="rounded-full border-2 border-navy-800 px-6 py-2.5 text-sm font-semibold text-navy-800">เข้าสู่ระบบ</NuxtLink>
      </div>
    </section>

    <!-- ใบสมัครของฉัน (ทุกรุ่น) -->
    <section v-else-if="loaded && !cohortCtx && myApps.length && !showForm" class="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-navy-800">ใบสมัครของฉัน</h2>
      <ul class="mt-4 divide-y divide-sky-card">
        <li v-for="a in myApps" :key="a.id">
          <NuxtLink :to="`/apply?cohort=${encodeURIComponent(a.cohortId)}`" class="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-brand">
            <span>
              <b class="text-navy-800">{{ cohortName(a.cohortId) }}</b>
              <span class="text-xs text-slate-500"> · {{ pkgShort(a.packageId) }} · {{ fmt(a.updatedAt) }}</span>
            </span>
            <span class="flex items-center gap-2">
              <span v-if="a.status === 'approved' && !a.paid" class="rounded-full px-3 py-0.5 text-xs font-semibold" :class="COUNCIL_CHECK[a.councilCheck || 'pending']![1]">{{ COUNCIL_CHECK[a.councilCheck || "pending"]![0] }}</span>
              <span v-if="a.paid" class="rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white">ค่าเรียน: ชำระแล้ว</span>
              <span v-if="a.status !== 'rejected'" class="rounded-full px-3 py-0.5 text-xs font-semibold" :class="a.council === 'paid' ? 'bg-green-100 text-green-800' : a.council === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'">ค่าตรวจคุณสมบัติ: {{ a.council === "paid" ? "ชำระแล้ว" : a.council === "pending" ? "รอตรวจ" : "ยังไม่ชำระ" }}</span>
              <span class="rounded-full px-3 py-0.5 text-xs font-semibold" :class="APP_STATUS[a.status]?.[1]">{{ APP_STATUS[a.status]?.[0] }}</span>
              <span class="text-sm text-navy-800">ดู →</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
      <button v-if="openCohorts.some((c) => canApply(c.id))" class="btn-brand mt-5 px-6 py-2.5 text-sm" @click="Object.assign(f, blank()); f.cohortId = firstCohort(); showForm = true">+ สมัครรุ่นอื่น</button>
      <p v-else class="mt-4 text-sm text-slate-500">ยังไม่มีรุ่นอื่นที่เปิดรับสมัครในขณะนี้</p>
    </section>

    <!-- สถานะใบสมัครที่ส่งแล้ว -->
    <section v-else-if="loaded && existing && (!editable || done)" class="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <NuxtLink v-if="myApps.length > 1" to="/apply" class="mb-3 inline-block text-sm text-navy-800">← ใบสมัครของฉันทั้งหมด</NuxtLink>
      <p v-if="done" class="mb-4 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800"><CheckCircle2 class="size-5" />ส่งใบสมัครเรียบร้อยแล้ว ทีมงานจะตรวจสอบและแจ้งผล</p>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-xl font-bold text-navy-800">สถานะใบสมัคร</h2>
        <span class="flex flex-wrap gap-1">
          <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="APP_STATUS[existing.status]?.[1]">{{ existing.status === "approved" ? "เอกสารผ่านการตรวจสอบ" : APP_STATUS[existing.status]?.[0] }}</span>
          <span v-if="existing.status === 'approved'" class="rounded-full px-3 py-1 text-xs font-semibold" :class="COUNCIL_CHECK[existing.councilCheck || 'pending']![1]">{{ COUNCIL_CHECK[existing.councilCheck || "pending"]![0] }}</span>
        </span>
      </div>
      <p class="mt-2 text-sm text-slate-600"><b class="text-navy-800">{{ cohortName(existing.cohortId) }}</b> · {{ existing.prefix }}{{ existing.firstName }} {{ existing.lastName }} · ส่งเมื่อ {{ fmt(existing.updatedAt) }}</p>
      <p v-if="existing.adminNote" class="mt-2 rounded-2xl bg-sky-soft px-4 py-2 text-sm text-slate-700">หมายเหตุจากทีมงาน: {{ existing.adminNote }}</p>
      <!-- ชำระค่าเรียน -->
      <div v-if="existing.status === 'approved' && existing.payment && !existing.payment.open && !existing.payment.paid" class="mt-5 rounded-2xl border-2 p-5" :class="existing.councilCheck === 'failed' ? 'border-red-200 bg-red-50' : 'border-sky-card bg-sky-soft'">
        <template v-if="existing.councilCheck === 'failed'">
          <p class="font-bold text-red-700">ไม่ผ่านการตรวจคุณสมบัติจากสัตวแพทยสภา</p>
          <p v-if="existing.councilNote" class="mt-1 text-sm text-slate-700">{{ existing.councilNote }}</p>
          <p class="mt-1 text-sm text-slate-600">มีข้อสงสัย ติดต่อทีมงานทางอีเมลหรือ LINE @dr.john</p>
        </template>
        <template v-else>
          <p class="font-bold text-navy-800">รอผลตรวจคุณสมบัติจากสัตวแพทยสภา</p>
          <p class="mt-1 text-sm text-slate-600">ทีมงานส่งตรวจคุณสมบัติแล้ว เมื่อผ่าน ระบบจะเปิดให้ชำระค่าเรียน {{ baht(existing.payment.amount) }} บาท (รวม VAT) ในหน้านี้ และแจ้งทางอีเมล</p>
        </template>
      </div>
      <div v-if="existing.status === 'approved' && existing.payment && (existing.payment.open || existing.payment.paid)" class="mt-5 rounded-2xl border-2 p-5" :class="existing.payment.paid ? 'border-green-300 bg-green-50' : 'border-brand bg-orange-50/40'">
        <template v-if="existing.payment.paid">
          <p class="flex items-center gap-2 font-bold text-green-800"><CheckCircle2 class="size-5" />ชำระค่าเรียนแล้ว</p>
          <p class="mt-1 text-sm text-slate-700">{{ baht(existing.payment.amount) }} บาท · เลขอ้างอิง {{ existing.payment.history.find((p) => p.status === "paid")?.transRef || "-" }} · ที่นั่งของคุณได้รับการยืนยันแล้ว</p>
        </template>
        <template v-else-if="existing.payment.pending">
          <p class="font-bold text-navy-800">ส่งสลิปแล้ว รอทีมงานตรวจสอบ</p>
          <p class="mt-1 text-sm text-slate-600">ทีมงานจะยืนยันการชำระทางอีเมล</p>
        </template>
        <template v-else>
          <p class="font-bold text-navy-800">ชำระค่าเรียน {{ baht(existing.payment.amount) }} บาท <span class="text-sm font-normal text-slate-600">(รวม VAT)</span></p>
          <p v-if="existing.payment.vat" class="text-xs text-slate-500">ค่าเรียน {{ baht(existing.payment.base) }} + VAT {{ existing.payment.vatRate }}% {{ baht(existing.payment.vat) }} บาท · ขอใบเสร็จ/ใบกำกับภาษีได้ ระบุข้อมูลในใบสมัครหรือแจ้งทางอีเมล · กรุณาชำระภายใน 7 วัน</p>
          <div v-if="existing.payment.promptpay" class="mt-3 flex flex-wrap items-start gap-5">
            <div class="rounded-2xl bg-white p-3 text-center shadow-sm">
              <img v-if="qrSrc" :src="qrSrc" alt="QR พร้อมเพย์" class="size-48" />
              <p class="mt-1 text-xs text-slate-500">สแกนด้วยแอปธนาคาร</p>
            </div>
            <div class="min-w-[14rem] flex-1 text-sm text-slate-700">
              <p>ชื่อบัญชี: <b>{{ existing.payment.promptpay.name }}</b></p>
              <p v-if="existing.payment.promptpay.bank">บัญชี: <b>{{ existing.payment.promptpay.bank }}</b></p>
              <p>ยอดชำระ: <b>{{ baht(existing.payment.amount) }} บาท</b> (รวม VAT · ยอดอยู่ใน QR แล้ว)</p>
              <p class="mt-3 text-xs text-slate-500">โอนแล้ว บันทึกภาพสลิปจากแอปธนาคาร แล้วแนบด้านล่าง{{ existing.payment.autoCheck ? " ระบบตรวจสลิปและยืนยันให้ทันที" : " ทีมงานจะตรวจและยืนยันทางอีเมล" }}</p>
              <FilePickButton v-model="slip" label="แนบสลิป" accept="image/jpeg,image/png" :max-mb="500" class="mt-2" />
              <button :disabled="paying" class="btn-brand mt-3 px-6 py-2.5 text-sm disabled:opacity-60" @click="sendSlip">{{ paying ? "กำลังตรวจสลิป..." : "ส่งสลิป" }}</button>
            </div>
          </div>
          <p v-else class="mt-2 text-sm text-slate-600">ทีมงานจะแจ้งช่องทางชำระทางอีเมล</p>
          <p v-if="existing.payment.history[0]?.status === 'rejected'" class="mt-3 text-xs text-red-700">สลิปล่าสุดไม่ผ่าน: {{ existing.payment.history[0].note }}</p>
        </template>
        <p v-if="payMsg" class="mt-3 text-sm" :class="payMsg.ok ? 'text-green-700' : 'text-red-700'">{{ payMsg.text }}</p>
      </div>

      <CouncilFeeCard v-if="existing.council && existing.status !== 'rejected'" :council="existing.council" :cohort-id="existing.cohortId" @sent="reloadExisting" />

      <p class="mt-4 flex items-center gap-2 text-xs text-slate-500"><Mail class="size-4" />ทีมงานจะแจ้งทุกขั้นตอนทางอีเมล {{ session?.user.email }} มีข้อสงสัยตอบกลับอีเมลได้เลย</p>

      <div class="mt-5 rounded-2xl border border-sky-card p-4 text-sm text-slate-700">
        <p class="font-semibold text-navy-800">ขั้นตอนต่อไป</p>
        <ol class="mt-2 list-decimal space-y-1 pl-5">
          <li>ชำระ <b>ค่าตรวจสอบคุณสมบัติ</b> ให้สัตวแพทยสภา แล้วแนบหลักฐานในหน้านี้ (ทำได้ทันที แยกจากค่าเรียน)</li>
          <li>ทีมงานตรวจสอบใบสมัครและเอกสาร แล้วส่งตรวจคุณสมบัติกับสัตวแพทยสภา</li>
          <li>เมื่อผ่านการตรวจคุณสมบัติ ชำระ <b>ค่าเรียน</b> (รวม VAT) ให้ Dr.John ผ่าน QR ในหน้านี้ แล้วแนบสลิป ภายใน 7 วัน</li>
        </ol>
      </div>
    </section>

    <!-- ไม่มีรุ่นเปิดรับ -->
    <section v-else-if="loaded && editable && !cohortChoices.length" class="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <p class="font-semibold text-navy-800">ยังไม่มีรุ่นที่เปิดรับสมัครในขณะนี้</p>
      <p class="mt-1 text-sm text-slate-600">ติดตามรุ่นถัดไปได้ที่หน้าแรก หรือสอบถามทีมงานทาง LINE @dr.john</p>
    </section>

    <!-- ฟอร์ม -->
    <template v-else-if="loaded && editable">
      <p v-if="existing?.status === 'needs_changes'" class="mt-6 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-800">ทีมงานขอให้แก้ไข: {{ existing.adminNote || "ดูเอกสารที่ถูกตีกลับในขั้นที่ 4" }}</p>
      <CouncilFeeCard v-if="existing?.status === 'needs_changes' && existing.council" :council="existing.council" :cohort-id="existing.cohortId" @sent="reloadExisting" />
      <p v-else-if="existing?.status === 'rejected'" class="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">ใบสมัครครั้งก่อนไม่ผ่าน{{ existing.adminNote ? `: ${existing.adminNote}` : "" }} สามารถสมัครใหม่ได้</p>

      <ol class="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
        <li v-for="(s, i) in STEPS" :key="s">
          <button type="button" class="rounded-full px-3 py-1.5" :class="step === i + 1 ? 'bg-navy-800 text-white' : step > i + 1 ? 'bg-sky-card text-navy-800' : 'bg-white text-slate-400'" @click="go(i + 1)">{{ i + 1 }}. {{ s }}</button>
        </li>
      </ol>

      <section class="mt-4 rounded-3xl bg-white p-6 shadow-sm">
        <!-- 1 -->
        <div v-show="step === 1" class="grid gap-4 md:grid-cols-2">
          <label class="text-xs text-slate-600">คำนำหน้า *
            <select v-model="f.prefix" class="field mt-1"><option value="" disabled>เลือก</option><option v-for="p in PREFIXES" :key="p">{{ p }}</option></select>
            <span v-if="errors.prefix" class="err">{{ errors.prefix }}</span>
          </label>
          <span class="hidden md:block" />
          <label class="text-xs text-slate-600">ชื่อ *<input v-model="f.firstName" class="field mt-1" /><span v-if="errors.firstName" class="err">{{ errors.firstName }}</span></label>
          <label class="text-xs text-slate-600">นามสกุล *<input v-model="f.lastName" class="field mt-1" /><span v-if="errors.lastName" class="err">{{ errors.lastName }}</span></label>
          <label class="text-xs text-slate-600">เลขบัตรประชาชน 13 หลัก *<input v-model="f.nationalId" inputmode="numeric" maxlength="17" class="field mt-1" autocomplete="off" /><span v-if="errors.nationalId || idHint" class="err">{{ errors.nationalId || idHint }}</span></label>
          <label class="text-xs text-slate-600">วันเกิด<input v-model="f.birthDate" type="date" class="field mt-1" /><span v-if="errors.birthDate" class="err">{{ errors.birthDate }}</span></label>
          <label class="text-xs text-slate-600">เบอร์โทรศัพท์ *<input v-model="f.phone" inputmode="tel" class="field mt-1" placeholder="08x-xxx-xxxx" /><span v-if="errors.phone" class="err">{{ errors.phone }}</span></label>
          <label class="text-xs text-slate-600">LINE ID<input v-model="f.lineId" class="field mt-1" /></label>
          <label class="text-xs text-slate-600 md:col-span-2">ที่อยู่ที่ติดต่อได้<textarea v-model="f.address" rows="3" class="field mt-1" /><span v-if="errors.address" class="err">{{ errors.address }}</span></label>
          <p class="text-xs text-slate-500 md:col-span-2">อีเมลติดต่อ: {{ session?.user.email }}</p>
        </div>

        <!-- 2 -->
        <div v-show="step === 2" class="grid gap-4 md:grid-cols-2">
          <label class="text-xs text-slate-600">วุฒิการศึกษาสูงสุด *
            <select v-model="f.education" class="field mt-1"><option value="" disabled>เลือก</option><option v-for="e in EDUCATION" :key="e">{{ e }}</option></select>
            <span v-if="errors.education" class="err">{{ errors.education }}</span>
          </label>
          <label class="text-xs text-slate-600">สถานศึกษา<input v-model="f.school" class="field mt-1" /></label>
          <label class="text-xs text-slate-600">สถานที่ทำงาน (โรงพยาบาลสัตว์/คลินิก)<input v-model="f.workplace" class="field mt-1" /><span v-if="errors.workplace" class="err">{{ errors.workplace }}</span></label>
          <label class="text-xs text-slate-600">ตำแหน่ง<input v-model="f.position" class="field mt-1" /></label>
          <label class="text-xs text-slate-600">ประสบการณ์ทำงาน (ปี)<input v-model="f.experienceYears" type="number" min="0" class="field mt-1 block max-w-[8rem]" /></label>
          <span class="hidden md:block" />
        </div>

        <!-- 3 -->
        <div v-show="step === 3" class="space-y-4">
          <div>
            <p class="text-xs text-slate-600">รุ่นที่สมัคร *</p>
            <div class="mt-1 space-y-2">
              <label v-for="c in cohortChoices" :key="c.id" class="flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm" :class="f.cohortId === c.id ? 'border-navy-800' : 'border-sky-card'">
                <input v-model="f.cohortId" type="radio" :value="c.id" />
                <span><b class="text-navy-800">{{ c.name }}</b>{{ c.dates ? ` · ${c.dates}` : "" }}</span>
              </label>
            </div>
            <span v-if="errors.cohortId" class="err">{{ errors.cohortId }}</span>
          </div>
          <div>
            <p class="text-xs text-slate-600">แพ็กเกจ *</p>
            <div class="mt-1 grid gap-2 md:grid-cols-2">
              <label v-for="p in applyPackages" :key="p.id" class="flex cursor-pointer flex-col rounded-2xl border-2 px-4 py-3 text-sm" :class="f.packageId === p.id ? 'border-brand bg-orange-50' : 'border-sky-card'">
                <span class="flex items-center gap-2"><input v-model="f.packageId" type="radio" :value="p.id" /><b class="text-navy-800">{{ p.short }}</b></span>
                <span class="mt-1 text-xs text-slate-500">{{ p.sub }}</span>
                <span class="mt-1 font-semibold text-brand">{{ baht(p.price) }} บาท</span>
              </label>
            </div>
            <p class="mt-2 rounded-2xl bg-sky-soft px-4 py-2 text-xs text-navy-800"><b>ใบประกาศนียบัตรสำหรับนำไปขึ้นทะเบียนกับสัตวแพทยสภา ต้องเรียนและสอบผ่านทั้ง 2 ภาค</b> (ทฤษฎี + ปฏิบัติ) · ภาคปฏิบัติสมัครอย่างเดียวไม่ได้</p>
            <p v-if="f.packageId === 'theory'" class="mt-2 rounded-2xl bg-amber-50 px-4 py-2 text-xs text-amber-800">เลือกเฉพาะภาคทฤษฎี: ยังนำใบประกาศไปขึ้นทะเบียนไม่ได้จนกว่าจะเรียนภาคปฏิบัติครบ</p>
            <p class="mt-1 text-xs text-slate-500">ราคานี้เป็นค่าเรียน (ชำระให้ Dr.John) ยังไม่รวม VAT{{ vatRate ? ` ${vatRate}%` : "" }}{{ pkg && vatRate ? ` (ยอดโอน ${baht(Math.round(pkg.price * (100 + vatRate) / 100))} บาท)` : "" }} และไม่รวมค่าตรวจสอบคุณสมบัติที่ชำระให้สัตวแพทยสภา</p>
          </div>
          <div>
            <p class="text-xs text-slate-600">ผู้ชำระค่าเรียน</p>
            <div class="mt-1 flex flex-wrap gap-4 text-sm">
              <label class="flex items-center gap-2"><input v-model="f.payer" type="radio" value="self" />ชำระเอง</label>
              <label class="flex items-center gap-2"><input v-model="f.payer" type="radio" value="employer" />นายจ้าง/โรงพยาบาลชำระ (ออกใบเสร็จในนามนายจ้าง)</label>
            </div>
          </div>
          <div v-if="f.payer === 'employer'" class="grid gap-4 md:grid-cols-2">
            <label class="text-xs text-slate-600 md:col-span-2">ชื่อที่ออกใบเสร็จ *<input v-model="f.invoiceName" class="field mt-1" /><span v-if="errors.invoiceName" class="err">{{ errors.invoiceName }}</span></label>
            <label class="text-xs text-slate-600 md:col-span-2">ที่อยู่ออกใบเสร็จ<textarea v-model="f.invoiceAddress" rows="2" class="field mt-1" /></label>
            <label class="text-xs text-slate-600">เลขประจำตัวผู้เสียภาษี<input v-model="f.invoiceTaxId" inputmode="numeric" class="field mt-1" /></label>
          </div>
        </div>

        <!-- 4 -->
        <div v-show="step === 4" class="space-y-5">
          <p class="text-sm text-slate-600">แนบไฟล์ PDF หรือรูปภาพ (ถ่ายจากมือถือได้) ไฟล์ใหญ่แค่ไหนก็ได้ ระบบย่อขนาดให้อัตโนมัติ</p>
          <div v-for="d in APP_DOCS" :key="d.kind" class="rounded-2xl border border-sky-card p-4">
            <p class="text-sm font-semibold text-navy-800">{{ d.label }} <span v-if="needsFile(d.kind)" class="text-red-600">*</span></p>
            <p v-if="fileState(d.kind)?.status === 'rejected'" class="mt-1 text-xs text-red-700">เอกสารนี้ไม่ผ่าน{{ fileState(d.kind)?.note ? `: ${fileState(d.kind)?.note}` : "" }} กรุณาแนบใหม่</p>
            <p v-else-if="fileState(d.kind)" class="mt-1 text-xs text-green-700">ส่งแล้ว ({{ fileState(d.kind)?.name }}) แนบใหม่ได้ถ้าต้องการเปลี่ยน</p>
            <FilePickButton :model-value="files[d.kind]" class="mt-2" accept="application/pdf,image/jpeg,image/png,image/heic,image/webp" :max-mb="500" @update:model-value="pickDoc(d.kind, $event)" />
            <p v-if="shrinking[d.kind]" class="mt-1 text-xs text-slate-500">กำลังย่อขนาดไฟล์...</p>
            <span v-if="errors[d.kind]" class="err">{{ errors[d.kind] }}</span>
          </div>

        </div>

        <!-- 5 -->
        <div v-show="step === 5" class="space-y-4 text-sm">
          <dl class="grid gap-x-6 gap-y-2 md:grid-cols-2">
            <div><dt class="text-xs text-slate-500">ชื่อ-นามสกุล</dt><dd>{{ f.prefix }}{{ f.firstName }} {{ f.lastName }}</dd></div>
            <div><dt class="text-xs text-slate-500">เบอร์โทร</dt><dd>{{ f.phone }}</dd></div>
            <div><dt class="text-xs text-slate-500">วุฒิการศึกษา</dt><dd>{{ f.education }}</dd></div>
            <div><dt class="text-xs text-slate-500">สถานที่ทำงาน</dt><dd>{{ f.workplace || "-" }}</dd></div>
            <div><dt class="text-xs text-slate-500">รุ่น</dt><dd>{{ selCohort?.name || f.cohortId }}</dd></div>
            <div><dt class="text-xs text-slate-500">แพ็กเกจ</dt><dd>{{ pkg?.short }}{{ pkg ? ` · ${baht(pkg.price)} บาท` : "" }}</dd></div>
            <div class="md:col-span-2"><dt class="text-xs text-slate-500">เอกสาร</dt><dd>{{ APP_DOCS.map((d) => `${d.label}: ${files[d.kind]?.name || (fileState(d.kind) && !needsFile(d.kind) ? "ใช้ไฟล์เดิม" : "-")}`).join(" · ") }}</dd></div>
          </dl>
          <label class="flex items-start gap-2 text-xs text-slate-600">
            <input v-model="f.consent" type="checkbox" class="mt-0.5" />
            <span>ข้าพเจ้ารับรองว่าข้อมูลและเอกสารเป็นความจริง และยินยอมให้เก็บและใช้ข้อมูลเพื่อการรับสมัคร การอบรม และการขึ้นทะเบียนกับสัตวแพทยสภา ตาม<NuxtLink to="/privacy" target="_blank" class="underline">นโยบายความเป็นส่วนตัว</NuxtLink></span>
          </label>
          <span v-if="errors.consent" class="err">{{ errors.consent }}</span>
        </div>

        <p v-if="formError" class="mt-4 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{{ formError }}</p>
        <div class="mt-6 flex flex-wrap gap-3 border-t border-sky-card pt-4">
          <button v-if="step > 1" type="button" class="rounded-full border border-slate-300 px-6 py-2.5 text-sm text-navy-800" @click="step--">ย้อนกลับ</button>
          <button v-if="step < 5" type="button" class="btn-brand px-6 py-2.5 text-sm" @click="next">ถัดไป</button>
          <button v-else type="button" :disabled="sending" class="btn-brand px-6 py-2.5 text-sm disabled:opacity-60" @click="submit">{{ sending ? "กำลังส่ง..." : "ส่งใบสมัคร" }}</button>
        </div>
      </section>
    </template>
    <p v-else class="mt-8 text-sm text-slate-500">กำลังโหลด...</p>
  </main>
  <SiteFooter />
</template>

<style scoped>
.err { display: block; margin-top: 0.25rem; padding-left: 1rem; font-size: 0.75rem; color: #b91c1c; }
</style>
