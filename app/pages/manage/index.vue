<script setup lang="ts">
useHead({ title: "จัดการคำขอใบประกาศ · VPP" });
const auth = useAuthClient();
const sessionState = auth.useSession(); // Ref<{ data, isPending, error }>
const session = computed(() => sessionState.value.data);
const isPending = computed(() => sessionState.value.isPending);

type Row = { id: string; fullName: string; cohort: string; completedOn: string | null; note: string | null; status: "pending" | "approved" | "rejected"; adminNote: string | null; createdAt: string; email: string; accountName: string };
const rows = ref<Row[]>([]);
const forbidden = ref(false);
const loaded = ref(false);

// รหัสแอดมินพิเศษ (เก็บในแท็บนี้เท่านั้น ปิดแท็บแล้วหาย)
const adminKey = ref("");
const keyInput = ref("");
const authHeaders = () => (adminKey.value ? { "x-admin-key": adminKey.value } : undefined);
onMounted(() => {
  try { adminKey.value = sessionStorage.getItem("vpp-admin-key") || ""; } catch {}
});
async function submitKey() {
  adminKey.value = keyInput.value.trim();
  try { sessionStorage.setItem("vpp-admin-key", adminKey.value); } catch {}
  forbidden.value = false;
  await load();
}

async function load() {
  try {
    rows.value = await $fetch<Row[]>("/api/manage/claims", { headers: authHeaders() });
  } catch (e: any) {
    rows.value = [];
    if (e?.status === 403 || e?.statusCode === 403) forbidden.value = true;
  }
  loaded.value = true;
}
watchEffect(() => {
  if (isPending.value) return;
  if (!session.value) navigateTo("/login");
  else load();
});

const files = reactive<Record<string, File | undefined>>({});
const certNo = reactive<Record<string, string>>({});
const issuedOn = reactive<Record<string, string>>({});
const note = reactive<Record<string, string>>({});
const busy = ref("");
const error = ref<Record<string, string>>({});

async function approve(id: string) {
  error.value[id] = "";
  const file = files[id];
  if (!file) return (error.value[id] = "กรุณาเลือกไฟล์ PDF ใบประกาศ");
  busy.value = id;
  const fd = new FormData();
  fd.append("file", file);
  if (certNo[id]) fd.append("certNo", certNo[id]);
  if (issuedOn[id]) fd.append("issuedOn", issuedOn[id]);
  if (note[id]) fd.append("adminNote", note[id]);
  try {
    await $fetch(`/api/manage/claims/${id}/approve`, { method: "POST", body: fd, headers: authHeaders() });
    await load();
  } catch (e: any) {
    error.value[id] = e?.data?.message || "อนุมัติไม่สำเร็จ";
  } finally {
    busy.value = "";
  }
}

async function reject(id: string) {
  error.value[id] = "";
  busy.value = id;
  try {
    await $fetch(`/api/manage/claims/${id}/reject`, { method: "POST", body: { adminNote: note[id] }, headers: authHeaders() });
    await load();
  } catch (e: any) {
    error.value[id] = e?.data?.message || "ดำเนินการไม่สำเร็จ";
  } finally {
    busy.value = "";
  }
}

const status = { pending: ["รอตรวจสอบ", "bg-amber-100 text-amber-800"], approved: ["อนุมัติแล้ว", "bg-green-100 text-green-800"], rejected: ["ไม่อนุมัติ", "bg-red-100 text-red-700"] } as const;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-");
</script>

<template>
  <SiteHeader />
  <main class="mx-auto w-full max-w-4xl px-5 py-12">
    <h1 class="text-3xl font-bold text-navy-800">จัดการคำขอใบประกาศนียบัตร</h1>
    <div v-if="forbidden" class="mt-6 rounded-2xl bg-red-50 px-4 py-4 text-sm text-red-700">
      <p>หน้านี้สำหรับแอดมินเท่านั้น: อีเมลต้องอยู่ในรายชื่อแอดมิน และยืนยันอีเมลแล้ว หรือกรอกรหัสแอดมินด้านล่าง</p>
      <form class="mt-3 flex flex-wrap gap-2" @submit.prevent="submitKey">
        <input v-model="keyInput" type="password" autocomplete="off" class="field max-w-xs" placeholder="รหัสแอดมิน (ADMIN_KEY)" />
        <button class="btn-brand px-5 py-2 text-sm">เข้าใช้งาน</button>
      </form>
    </div>
    <p v-else-if="loaded && !rows.length" class="mt-6 text-sm text-slate-500">ยังไม่มีคำขอ</p>

    <ul class="mt-6 space-y-4">
      <li v-for="r in rows" :key="r.id" class="rounded-3xl bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="font-bold text-navy-800">{{ r.fullName }} · {{ r.cohort }}</div>
          <span class="rounded-full px-3 py-0.5 text-xs font-semibold" :class="status[r.status][1]">{{ status[r.status][0] }}</span>
        </div>
        <div class="mt-1 text-sm text-slate-600">บัญชี: {{ r.accountName }} ({{ r.email }}) · เรียนจบ: {{ fmt(r.completedOn) }} · ยื่นเมื่อ {{ fmt(r.createdAt) }}</div>
        <p v-if="r.note" class="mt-1 text-sm text-slate-600">หมายเหตุผู้ยื่น: {{ r.note }}</p>
        <p v-if="r.adminNote" class="mt-1 text-sm text-slate-600">หมายเหตุแอดมิน: {{ r.adminNote }}</p>

        <div v-if="r.status === 'pending'" class="mt-4 grid gap-3 border-t border-sky-card pt-4 md:grid-cols-2">
          <label class="text-xs text-slate-600">ไฟล์ PDF ใบประกาศ (ไม่เกิน 4MB) *
            <input type="file" accept="application/pdf" class="mt-1 block w-full text-sm" @change="files[r.id] = ($event.target as HTMLInputElement).files?.[0]" />
          </label>
          <input v-model="certNo[r.id]" class="field" placeholder="เลขที่ใบประกาศ (ถ้ามี)" />
          <label class="text-xs text-slate-600">วันที่ออกใบ
            <input v-model="issuedOn[r.id]" type="date" class="field mt-1" />
          </label>
          <input v-model="note[r.id]" class="field self-end" placeholder="หมายเหตุถึงผู้เรียน (ถ้ามี)" />
          <p v-if="error[r.id]" class="text-sm text-red-700 md:col-span-2">{{ error[r.id] }}</p>
          <div class="flex gap-2 md:col-span-2">
            <button :disabled="busy === r.id" class="btn-brand px-5 py-2 text-sm disabled:opacity-60" @click="approve(r.id)">อนุมัติและส่งใบประกาศ</button>
            <button :disabled="busy === r.id" class="rounded-full border border-red-300 px-5 py-2 text-sm text-red-700 disabled:opacity-60" @click="reject(r.id)">ไม่อนุมัติ</button>
          </div>
        </div>
      </li>
    </ul>
  </main>
  <SiteFooter />
</template>
