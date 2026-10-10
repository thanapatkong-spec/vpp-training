<script setup lang="ts">
import { Download, FileCheck2, LogOut } from "lucide-vue-next";
import { APP_STATUS } from "#shared/application";

useHead({ title: "บัญชีของฉัน · VPP" });
const auth = useAuthClient();
const sessionState = auth.useSession(); // Ref<{ data, isPending, error }>
const session = computed(() => sessionState.value.data);
const isPending = computed(() => sessionState.value.isPending);

type Cert = { id: string; title: string; certNo: string | null; issuedOn: string | null };

const me = ref<{ isAdmin: boolean; adminCandidate: boolean; phone: string; cohort: string } | null>(null);
const certs = ref<Cert[]>([]);
const app = ref<{ status: string; adminNote: string | null } | null>(null);

async function load() {
  $fetch<{ status: string; adminNote: string | null } | null>("/api/me/application").then((a) => (app.value = a)).catch(() => {});
  [me.value, certs.value] = await Promise.all([
    $fetch<{ isAdmin: boolean; adminCandidate: boolean; phone: string; cohort: string }>("/api/me"),
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

async function signOut() {
  await auth.signOut();
  await navigateTo("/");
}

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
        <NuxtLink v-if="me?.isAdmin || me?.adminCandidate" to="/manage" class="rounded-full bg-navy-800 px-4 py-2 text-sm font-semibold text-white">ระบบแอดมิน</NuxtLink>
        <button type="button" class="flex items-center gap-1 rounded-full border border-slate-300 px-4 py-2 text-sm text-navy-800" @click="signOut"><LogOut class="size-4" />ออกจากระบบ</button>
      </div>
    </div>

    <section v-if="app" class="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-6 shadow-sm">
      <div>
        <h2 class="text-xl font-bold text-navy-800">ใบสมัครเรียน VPP</h2>
        <p v-if="app.adminNote" class="mt-1 text-sm text-slate-600">หมายเหตุจากทีมงาน: {{ app.adminNote }}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="APP_STATUS[app.status]?.[1]">{{ APP_STATUS[app.status]?.[0] }}</span>
        <NuxtLink to="/apply" class="text-sm text-navy-800 underline">{{ app.status === "needs_changes" ? "แก้ไขใบสมัคร" : "ดูรายละเอียด" }}</NuxtLink>
      </div>
    </section>

    <section class="mt-6 rounded-3xl bg-white p-6 shadow-sm">
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
      <p v-else class="mt-3 text-sm text-slate-500">ยังไม่มีใบประกาศนียบัตรหรือไฟล์ในบัญชีนี้ แอดมินจะแนบให้หลังจบการอบรม หากมีข้อสงสัยติดต่อทีมงาน</p>
    </section>

  </main>
  <SiteFooter />
</template>
