<script setup lang="ts">
import { CheckCircle2 } from "lucide-vue-next";
import { APP_DOCS, APP_STATUS, ApplicationInput, EDUCATION, PREFIXES, validThaiId, type AppDocKind } from "#shared/application";
import { COHORT, PACKAGES, baht } from "#shared/config";

useHead({ title: "สมัครเรียน VPP · VPP" });
const auth = useAuthClient();
const sessionState = auth.useSession();
const session = computed(() => sessionState.value.data);
const isPending = computed(() => sessionState.value.isPending);

type Existing = { id: string; status: string; adminNote: string | null; files: { id: string; kind: string; name: string; status: string; note: string | null }[] } & Record<string, any>;
const existing = ref<Existing | null>(null);
const loaded = ref(false);

const DRAFT_KEY = "vpp-apply-draft";
const blank = () => ({
  cohortId: COHORT.id, packageId: "bundle", prefix: "", firstName: "", lastName: "", nameEn: "", nationalId: "", birthDate: "", phone: "", lineId: "", address: "",
  education: "", school: "", workplace: "", position: "", experienceYears: "" as string | number, vetName: "", vetLicense: "", vetPhone: "",
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
  ["prefix", "firstName", "lastName", "nameEn", "nationalId", "birthDate", "phone", "lineId", "address"],
  ["education", "school", "workplace", "position", "experienceYears", "vetName", "vetLicense", "vetPhone"],
  ["cohortId", "packageId", "payer", "invoiceName", "invoiceAddress", "invoiceTaxId"],
  [],
  ["consent"],
];

// แก้ไขได้เมื่อยังไม่เคยส่ง, แอดมินขอแก้ไข หรือครั้งก่อนไม่ผ่าน
const editable = computed(() => !existing.value || ["needs_changes", "rejected"].includes(existing.value.status));
const fileState = (kind: string) => existing.value?.status === "needs_changes" ? existing.value.files.find((x) => x.kind === kind) : undefined;
const needsFile = (kind: AppDocKind) => !fileState(kind) || fileState(kind)!.status === "rejected";

async function load() {
  try {
    existing.value = await $fetch<Existing | null>("/api/me/application");
  } catch {}
  if (existing.value && editable.value) {
    for (const k of Object.keys(blank())) if (k in existing.value && existing.value[k] != null) (f as any)[k] = existing.value[k];
    f.consent = false;
  } else if (!existing.value) {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (d) Object.assign(f, d, { consent: false });
    } catch {}
    if (!f.firstName && session.value?.user.name) {
      const [a, ...b] = session.value.user.name.trim().split(/\s+/);
      f.firstName = a || "";
      f.lastName = b.join(" ");
    }
  }
  loaded.value = true;
}
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

// ย่อรูปจากมือถือก่อนส่ง (ให้ไฟล์รวมไม่เกิน 4MB)
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png)$/.test(file.type) || file.size < 900 * 1024) return file;
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.85));
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}
async function pickDoc(kind: AppDocKind, file: File | undefined) {
  if (!file) return (files[kind] = undefined);
  files[kind] = await shrink(file);
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
  if (totalSize.value > 4 * 1024 * 1024) return (formError.value = "ไฟล์รวมกันใหญ่เกิน 4MB กรุณาสแกนหรือถ่ายรูปความละเอียดต่ำลง");
  const fd = new FormData();
  fd.append("data", JSON.stringify({ ...f, experienceYears: f.experienceYears === "" ? undefined : f.experienceYears }));
  for (const d of APP_DOCS) if (files[d.kind]) fd.append(d.kind, files[d.kind]!);
  sending.value = true;
  try {
    await $fetch("/api/me/application", { method: "POST", body: fd });
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    done.value = true;
    existing.value = await $fetch<Existing | null>("/api/me/application");
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

const pkg = computed(() => PACKAGES.find((p) => p.id === f.packageId));
const idHint = computed(() => (f.nationalId.replace(/\D/g, "").length === 13 && !validThaiId(f.nationalId.replace(/\D/g, "")) ? "เลขบัตรไม่ถูกต้อง ตรวจสอบอีกครั้ง" : ""));
const fmt = (d: string) => (d ? new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-");
</script>

<template>
  <SiteHeader />
  <main class="mx-auto w-full max-w-3xl px-5 py-12">
    <h1 class="text-3xl font-bold text-navy-800">สมัครเรียนหลักสูตร VPP</h1>
    <p class="mt-1 text-sm text-slate-600">หลักสูตรผู้ช่วยสัตวแพทย์ด้านการพยาบาลสัตว์ · {{ COHORT.name }} ({{ COHORT.registerLabel }})</p>

    <!-- ยังไม่ล็อกอิน -->
    <section v-if="loaded && !session" class="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <p class="text-slate-700">กรุณาสมัครสมาชิกหรือเข้าสู่ระบบก่อน เพื่อบันทึกใบสมัครและติดตามสถานะได้</p>
      <div class="mt-4 flex flex-wrap gap-3">
        <NuxtLink to="/signup?next=/apply" class="btn-brand px-6 py-2.5 text-sm">สมัครสมาชิก</NuxtLink>
        <NuxtLink to="/login?next=/apply" class="rounded-full border-2 border-navy-800 px-6 py-2.5 text-sm font-semibold text-navy-800">เข้าสู่ระบบ</NuxtLink>
      </div>
    </section>

    <!-- สถานะใบสมัครที่ส่งแล้ว -->
    <section v-else-if="loaded && existing && (!editable || done)" class="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <p v-if="done" class="mb-4 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800"><CheckCircle2 class="size-5" />ส่งใบสมัครเรียบร้อยแล้ว ทีมงานจะตรวจสอบและแจ้งผล</p>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-xl font-bold text-navy-800">สถานะใบสมัคร</h2>
        <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="APP_STATUS[existing.status]?.[1]">{{ APP_STATUS[existing.status]?.[0] }}</span>
      </div>
      <p class="mt-2 text-sm text-slate-600">{{ existing.prefix }}{{ existing.firstName }} {{ existing.lastName }} · ส่งเมื่อ {{ fmt(existing.updatedAt) }}</p>
      <p v-if="existing.adminNote" class="mt-2 rounded-2xl bg-sky-soft px-4 py-2 text-sm text-slate-700">หมายเหตุจากทีมงาน: {{ existing.adminNote }}</p>
      <div class="mt-5 rounded-2xl border border-sky-card p-4 text-sm text-slate-700">
        <p class="font-semibold text-navy-800">ขั้นตอนต่อไป</p>
        <ol class="mt-2 list-decimal space-y-1 pl-5">
          <li>ทีมงานตรวจสอบใบสมัครและเอกสาร</li>
          <li>เมื่อผ่านการตรวจสอบ ชำระ <b>ค่าเรียน</b> ให้ Dr.John (ทีมงานแจ้งช่องทางชำระ)</li>
          <li>ชำระ <b>ค่าตรวจสอบคุณสมบัติ</b> ให้สัตวแพทยสภา ตามช่องทางที่สัตวแพทยสภากำหนด</li>
        </ol>
      </div>
    </section>

    <!-- ฟอร์ม -->
    <template v-else-if="loaded && editable">
      <p v-if="existing?.status === 'needs_changes'" class="mt-6 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-800">ทีมงานขอให้แก้ไข: {{ existing.adminNote || "ดูเอกสารที่ถูกตีกลับในขั้นที่ 4" }}</p>
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
          <label class="text-xs text-slate-600">ชื่อ (ภาษาไทย) *<input v-model="f.firstName" class="field mt-1" /><span v-if="errors.firstName" class="err">{{ errors.firstName }}</span></label>
          <label class="text-xs text-slate-600">นามสกุล (ภาษาไทย) *<input v-model="f.lastName" class="field mt-1" /><span v-if="errors.lastName" class="err">{{ errors.lastName }}</span></label>
          <label class="text-xs text-slate-600 md:col-span-2">ชื่อ-นามสกุล ภาษาอังกฤษ (สำหรับใบประกาศ)<input v-model="f.nameEn" class="field mt-1" placeholder="เช่น Miss Somsri Jaidee" /></label>
          <label class="text-xs text-slate-600">เลขบัตรประชาชน 13 หลัก *<input v-model="f.nationalId" inputmode="numeric" maxlength="17" class="field mt-1" autocomplete="off" /><span v-if="errors.nationalId || idHint" class="err">{{ errors.nationalId || idHint }}</span></label>
          <label class="text-xs text-slate-600">วันเกิด *<input v-model="f.birthDate" type="date" class="field mt-1" /><span v-if="errors.birthDate" class="err">{{ errors.birthDate }}</span></label>
          <label class="text-xs text-slate-600">เบอร์โทรศัพท์ *<input v-model="f.phone" inputmode="tel" class="field mt-1" placeholder="08x-xxx-xxxx" /><span v-if="errors.phone" class="err">{{ errors.phone }}</span></label>
          <label class="text-xs text-slate-600">LINE ID<input v-model="f.lineId" class="field mt-1" /></label>
          <label class="text-xs text-slate-600 md:col-span-2">ที่อยู่ที่ติดต่อได้ *<textarea v-model="f.address" rows="3" class="field mt-1" /><span v-if="errors.address" class="err">{{ errors.address }}</span></label>
          <p class="text-xs text-slate-500 md:col-span-2">อีเมลติดต่อ: {{ session?.user.email }}</p>
        </div>

        <!-- 2 -->
        <div v-show="step === 2" class="grid gap-4 md:grid-cols-2">
          <label class="text-xs text-slate-600">วุฒิการศึกษาสูงสุด *
            <select v-model="f.education" class="field mt-1"><option value="" disabled>เลือก</option><option v-for="e in EDUCATION" :key="e">{{ e }}</option></select>
            <span v-if="errors.education" class="err">{{ errors.education }}</span>
          </label>
          <label class="text-xs text-slate-600">สถานศึกษา<input v-model="f.school" class="field mt-1" /></label>
          <label class="text-xs text-slate-600">สถานที่ทำงาน (โรงพยาบาลสัตว์/คลินิก) *<input v-model="f.workplace" class="field mt-1" /><span v-if="errors.workplace" class="err">{{ errors.workplace }}</span></label>
          <label class="text-xs text-slate-600">ตำแหน่ง<input v-model="f.position" class="field mt-1" /></label>
          <label class="text-xs text-slate-600">ประสบการณ์ทำงาน (ปี)<input v-model="f.experienceYears" type="number" min="0" class="field mt-1 max-w-[8rem]" /></label>
          <span class="hidden md:block" />
          <p class="text-sm font-semibold text-navy-800 md:col-span-2">สัตวแพทย์ผู้ควบคุม (ผู้ประกอบวิชาชีพการสัตวแพทย์ชั้นหนึ่ง)</p>
          <label class="text-xs text-slate-600">ชื่อ-นามสกุล *<input v-model="f.vetName" class="field mt-1" /><span v-if="errors.vetName" class="err">{{ errors.vetName }}</span></label>
          <label class="text-xs text-slate-600">เลขที่ใบอนุญาต *<input v-model="f.vetLicense" class="field mt-1" /><span v-if="errors.vetLicense" class="err">{{ errors.vetLicense }}</span></label>
          <label class="text-xs text-slate-600">เบอร์โทร<input v-model="f.vetPhone" inputmode="tel" class="field mt-1" /></label>
        </div>

        <!-- 3 -->
        <div v-show="step === 3" class="space-y-4">
          <div>
            <p class="text-xs text-slate-600">รุ่นที่สมัคร</p>
            <label class="mt-1 flex items-center gap-3 rounded-2xl border-2 border-navy-800 px-4 py-3 text-sm">
              <input v-model="f.cohortId" type="radio" :value="COHORT.id" />
              <span><b class="text-navy-800">{{ COHORT.name }}</b> · {{ COHORT.registerLabel }}</span>
            </label>
          </div>
          <div>
            <p class="text-xs text-slate-600">แพ็กเกจ *</p>
            <div class="mt-1 grid gap-2 md:grid-cols-3">
              <label v-for="p in PACKAGES" :key="p.id" class="flex cursor-pointer flex-col rounded-2xl border-2 px-4 py-3 text-sm" :class="f.packageId === p.id ? 'border-brand bg-orange-50' : 'border-sky-card'">
                <span class="flex items-center gap-2"><input v-model="f.packageId" type="radio" :value="p.id" /><b class="text-navy-800">{{ p.short }}</b></span>
                <span class="mt-1 text-xs text-slate-500">{{ p.sub }}</span>
                <span class="mt-1 font-semibold text-brand">{{ baht(p.price) }} บาท</span>
              </label>
            </div>
            <p class="mt-1 text-xs text-slate-500">ราคานี้เป็นค่าเรียน (ชำระให้ Dr.John) ไม่รวมค่าตรวจสอบคุณสมบัติที่ชำระให้สัตวแพทยสภา</p>
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
          <p class="text-sm text-slate-600">แนบไฟล์ PDF, JPG หรือ PNG (ถ่ายรูปจากมือถือได้ ระบบย่อขนาดให้อัตโนมัติ) รวมกันไม่เกิน 4MB</p>
          <div v-for="d in APP_DOCS" :key="d.kind" class="rounded-2xl border border-sky-card p-4">
            <p class="text-sm font-semibold text-navy-800">{{ d.label }} <span v-if="needsFile(d.kind)" class="text-red-600">*</span></p>
            <p v-if="fileState(d.kind)?.status === 'rejected'" class="mt-1 text-xs text-red-700">เอกสารนี้ไม่ผ่าน{{ fileState(d.kind)?.note ? `: ${fileState(d.kind)?.note}` : "" }} กรุณาแนบใหม่</p>
            <p v-else-if="fileState(d.kind)" class="mt-1 text-xs text-green-700">ส่งแล้ว ({{ fileState(d.kind)?.name }}) แนบใหม่ได้ถ้าต้องการเปลี่ยน</p>
            <FilePickButton :model-value="files[d.kind]" class="mt-2" accept="application/pdf,image/jpeg,image/png" :max-mb="10" @update:model-value="pickDoc(d.kind, $event)" />
            <span v-if="errors[d.kind]" class="err">{{ errors[d.kind] }}</span>
          </div>
          <p class="text-xs text-slate-500">ขนาดรวม {{ (totalSize / 1024 / 1024).toFixed(1) }} MB / 4 MB</p>
        </div>

        <!-- 5 -->
        <div v-show="step === 5" class="space-y-4 text-sm">
          <dl class="grid gap-x-6 gap-y-2 md:grid-cols-2">
            <div><dt class="text-xs text-slate-500">ชื่อ-นามสกุล</dt><dd>{{ f.prefix }}{{ f.firstName }} {{ f.lastName }}</dd></div>
            <div><dt class="text-xs text-slate-500">เบอร์โทร</dt><dd>{{ f.phone }}</dd></div>
            <div><dt class="text-xs text-slate-500">วุฒิการศึกษา</dt><dd>{{ f.education }}</dd></div>
            <div><dt class="text-xs text-slate-500">สถานที่ทำงาน</dt><dd>{{ f.workplace }}</dd></div>
            <div><dt class="text-xs text-slate-500">สัตวแพทย์ผู้ควบคุม</dt><dd>{{ f.vetName }} ({{ f.vetLicense }})</dd></div>
            <div><dt class="text-xs text-slate-500">แพ็กเกจ</dt><dd>{{ pkg?.short }}</dd></div>
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
