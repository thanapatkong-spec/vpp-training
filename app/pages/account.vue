<script setup lang="ts">
import { Download, FileCheck2, LogOut } from "lucide-vue-next";

useHead({ title: "บัญชีของฉัน · VPP" });
const auth = useAuthClient();
const sessionState = auth.useSession(); // Ref<{ data, isPending, error }>
const session = computed(() => sessionState.value.data);
const isPending = computed(() => sessionState.value.isPending);

type Claim = { id: string; fullName: string; cohort: string; completedOn: string | null; status: "pending" | "approved" | "rejected"; adminNote: string | null; createdAt: string };
type Cert = { id: string; title: string; certNo: string | null; issuedOn: string | null };

const me = ref<{ isAdmin: boolean; adminCandidate: boolean; phone: string; cohort: string } | null>(null);
const claims = ref<Claim[]>([]);
const certs = ref<Cert[]>([]);

async function load() {
  [me.value, claims.value, certs.value] = await Promise.all([
    $fetch<{ isAdmin: boolean; adminCandidate: boolean; phone: string; cohort: string }>("/api/me"),
    $fetch<Claim[]>("/api/me/claims"),
    $fetch<Cert[]>("/api/me/certificates"),
  ]);
  if (!profLoaded.value && me.value) {
    prof.name = session.value?.user.name || "";
    prof.phone = me.value.phone || "";
    profLoaded.value = true;
  }
}

const prof = reactive({ name: "", phone: "" });
const profLoaded = ref(false);
const profMsg = ref<{ ok: boolean; text: string } | null>(null);
const profBusy = ref(false);
async function saveProfile() {
  profMsg.value = null;
  profBusy.value = true;
  try {
    await $fetch("/api/me", { method: "PATCH", body: { ...prof } });
    profMsg.value = { ok: true, text: "บันทึกโปรไฟล์แล้ว" };
    await auth.getSession({ fetchOptions: { cache: "no-store" } }).catch(() => {});
  } catch (e: any) {
    profMsg.value = { ok: false, text: e?.data?.message || "บันทึกไม่สำเร็จ" };
  } finally {
    profBusy.value = false;
  }
}

watchEffect(() => {
  if (isPending.value) return;
  if (!session.value) navigateTo("/login");
  else load();
});

const form = reactive({ fullName: "", cohort: "", completedOn: "", note: "" });
watch(() => session.value?.user.name, (n) => { if (n && !form.fullName) form.fullName = n; }, { immediate: true });
const sending = ref(false);
const formError = ref("");
const fieldErrors = ref<Record<string, string>>({});
const sent = ref(false);

async function submitClaim() {
  formError.value = "";
  fieldErrors.value = {};
  sending.value = true;
  try {
    await $fetch("/api/me/claims", { method: "POST", body: { ...form } });
    form.cohort = ""; form.completedOn = ""; form.note = "";
    sent.value = true;
    await load();
  } catch (e: any) {
    fieldErrors.value = e?.data?.data?.fieldErrors ?? {};
    formError.value = Object.keys(fieldErrors.value).length ? "" : e?.data?.message || "ส่งคำขอไม่สำเร็จ";
  } finally {
    sending.value = false;
  }
}

async function signOut() {
  await auth.signOut();
  await navigateTo("/");
}

const status = { pending: ["รอตรวจสอบ", "bg-amber-100 text-amber-800"], approved: ["อนุมัติแล้ว", "bg-green-100 text-green-800"], rejected: ["ไม่อนุมัติ", "bg-red-100 text-red-700"] } as const;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "");
</script>

<template>
  <SiteHeader />
  <main v-if="session" class="mx-auto w-full max-w-3xl px-5 py-12">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold text-navy-800">บัญชีของฉัน</h1>
        <p class="mt-1 text-sm text-slate-600">{{ session.user.name }} · {{ session.user.email }}</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink v-if="me?.isAdmin || me?.adminCandidate" to="/manage" class="rounded-full bg-navy-800 px-4 py-2 text-sm font-semibold text-white">จัดการคำขอ (แอดมิน)</NuxtLink>
        <button type="button" class="flex items-center gap-1 rounded-full border border-slate-300 px-4 py-2 text-sm text-navy-800" @click="signOut"><LogOut class="size-4" />ออกจากระบบ</button>
      </div>
    </div>

    <section class="mt-8 rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-navy-800">โปรไฟล์ของฉัน</h2>
      <form class="mt-4 grid gap-3 md:grid-cols-2" @submit.prevent="saveProfile">
        <label class="text-xs text-slate-600">ชื่อ-นามสกุล
          <input v-model="prof.name" class="field mt-1" />
        </label>
        <label class="text-xs text-slate-600">เบอร์โทรศัพท์
          <input v-model="prof.phone" class="field mt-1" placeholder="เช่น 081-234-5678" />
        </label>
        <p class="text-xs text-slate-500 md:col-span-2">อีเมลเข้าสู่ระบบ: {{ session.user.email }}<span v-if="me?.cohort"> · รุ่น: {{ me.cohort }}</span> (หากต้องการเปลี่ยนอีเมลหรือรุ่น ติดต่อแอดมิน)</p>
        <div class="md:col-span-2">
          <p v-if="profMsg" class="mb-2 text-sm" :class="profMsg.ok ? 'text-green-700' : 'text-red-700'">{{ profMsg.text }}</p>
          <button :disabled="profBusy" class="btn-brand px-6 py-2.5 text-sm disabled:opacity-60">บันทึกโปรไฟล์</button>
        </div>
      </form>
    </section>

    <section class="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="flex items-center gap-2 text-xl font-bold text-navy-800"><FileCheck2 class="text-brand" />ใบประกาศนียบัตรและไฟล์ของฉัน</h2>
      <ul v-if="certs.length" class="mt-4 space-y-2">
        <li v-for="c in certs" :key="c.id" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-soft px-4 py-3">
          <div class="min-w-0">
            <div class="font-semibold text-navy-800">{{ c.title }}</div>
            <div class="text-xs text-slate-500">{{ [c.certNo ? `เลขที่ ${c.certNo}` : "", fmt(c.issuedOn)].filter(Boolean).join(" · ") }}</div>
          </div>
          <a :href="`/api/certificates/${c.id}/file`" download class="btn-brand px-4 py-2 text-sm"><span class="flex items-center gap-1"><Download class="size-4" />ดาวน์โหลด</span></a>
        </li>
      </ul>
      <p v-else class="mt-3 text-sm text-slate-500">ยังไม่มีใบประกาศนียบัตร หากเคยเรียนกับเรา ให้ยื่นคำขอด้านล่าง แอดมินจะตรวจสอบและส่งใบให้ในบัญชีนี้</p>
    </section>

    <section class="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-navy-800">ยื่นคำขอรับใบประกาศนียบัตร</h2>
      <p class="mt-1 text-sm text-slate-600">กรอกข้อมูลการเรียนของคุณ แอดมินจะตรวจสอบกับทะเบียนผู้เรียน</p>
      <p v-if="sent" class="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">ส่งคำขอแล้ว กรุณารอแอดมินตรวจสอบ ดูสถานะได้ด้านล่าง</p>
      <form class="mt-4 grid gap-3 md:grid-cols-2" @submit.prevent="submitClaim">
        <div>
          <input id="fullName" v-model="form.fullName" class="field" placeholder="ชื่อ-นามสกุลที่ใช้ตอนเรียน *" />
          <p v-if="fieldErrors.fullName" class="mt-1 px-4 text-xs text-red-600">{{ fieldErrors.fullName }}</p>
        </div>
        <div>
          <input id="cohort" v-model="form.cohort" class="field" placeholder="รุ่นที่เรียน เช่น รุ่นที่ 3 *" />
          <p v-if="fieldErrors.cohort" class="mt-1 px-4 text-xs text-red-600">{{ fieldErrors.cohort }}</p>
        </div>
        <div>
          <input id="completedOn" v-model="form.completedOn" type="date" class="field" aria-label="วันที่เรียนจบ" />
          <p v-if="fieldErrors.completedOn" class="mt-1 px-4 text-xs text-red-600">{{ fieldErrors.completedOn }}</p>
        </div>
        <textarea id="note" v-model="form.note" rows="2" class="field" placeholder="หมายเหตุ (ถ้ามี) เช่น ที่ทำงานตอนเรียน" />
        <div class="md:col-span-2">
          <p v-if="formError" class="mb-2 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{{ formError }}</p>
          <button :disabled="sending" class="btn-brand px-6 py-3 text-sm disabled:opacity-60">{{ sending ? "กำลังส่ง..." : "ส่งคำขอ" }}</button>
        </div>
      </form>

      <h3 v-if="claims.length" class="mt-6 font-bold text-navy-800">คำขอของฉัน</h3>
      <ul class="mt-2 space-y-2">
        <li v-for="c in claims" :key="c.id" class="rounded-2xl border border-sky-card px-4 py-3 text-sm">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-semibold text-navy-800">{{ c.fullName }} · {{ c.cohort }}</span>
            <span class="rounded-full px-3 py-0.5 text-xs font-semibold" :class="status[c.status][1]">{{ status[c.status][0] }}</span>
          </div>
          <p v-if="c.adminNote" class="mt-1 text-xs text-slate-600">หมายเหตุจากแอดมิน: {{ c.adminNote }}</p>
        </li>
      </ul>
    </section>
  </main>
  <SiteFooter />
</template>
