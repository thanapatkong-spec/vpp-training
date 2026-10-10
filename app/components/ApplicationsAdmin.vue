<script setup lang="ts">
import { APP_DOCS, APP_STATUS } from "#shared/application";
import { PACKAGES } from "#shared/config";

const props = defineProps<{ authHeaders: () => Record<string, string> | undefined }>();
const openFile = useAuthedOpen(props.authHeaders);

type Row = { payStatus: string | null; id: string; cohortId: string; packageId: string; prefix: string; firstName: string; lastName: string; nationalId: string; phone: string; workplace: string; status: string; createdAt: string; updatedAt: string; email: string };
type FileMeta = { id: string; kind: string; name: string; contentType: string; size: number; status: string; note: string | null };
type Detail = Record<string, any> & { files: FileMeta[] };

const rows = ref<Row[]>([]);
const statusFilter = ref("submitted");
const q = ref("");
const openId = ref("");
const detail = ref<Detail | null>(null);
const review = reactive<{ note: string; files: Record<string, { status: string; note: string }> }>({ note: "", files: {} });
const busy = ref(false);
const msg = ref<{ ok: boolean; text: string } | null>(null);

const shown = computed(() => {
  const k = q.value.trim().toLowerCase();
  return rows.value.filter((r) => (!statusFilter.value || r.status === statusFilter.value) && (!k || [r.firstName, r.lastName, r.email, r.phone, r.workplace].some((v) => (v || "").toLowerCase().includes(k))));
});
const count = (s: string) => rows.value.filter((r) => r.status === s).length;

async function load() {
  try {
    rows.value = await $fetch<Row[]>("/api/manage/applications", { headers: props.authHeaders() });
  } catch {}
}
async function toggle(r: Row) {
  if (openId.value === r.id) return (openId.value = "");
  openId.value = r.id;
  detail.value = null;
  msg.value = null;
  detail.value = await $fetch<Detail>(`/api/manage/applications/${r.id}`, { headers: props.authHeaders() });
  review.note = detail.value.adminNote || "";
  review.files = Object.fromEntries(detail.value.files.map((f) => [f.id, { status: f.status, note: f.note || "" }]));
}
async function decide(status: "approved" | "needs_changes" | "rejected") {
  if (!detail.value) return;
  if (status === "rejected" && !confirm("ยืนยันว่าใบสมัครนี้ไม่ผ่าน?")) return;
  busy.value = true;
  msg.value = null;
  try {
    const files = Object.entries(review.files).map(([id, v]) => ({ id, status: status === "approved" ? "ok" : v.status, note: v.note || undefined }));
    await $fetch(`/api/manage/applications/${detail.value.id}/review`, { method: "POST", body: { status, adminNote: review.note || undefined, files }, headers: props.authHeaders() });
    msg.value = { ok: true, text: `บันทึกแล้ว: ${APP_STATUS[status]?.[0]}` };
    await load();
    openId.value = "";
  } catch (e: any) {
    msg.value = { ok: false, text: e?.data?.message || "บันทึกไม่สำเร็จ" };
  } finally {
    busy.value = false;
  }
}
async function payAction(id: string, action: "approve" | "reject") {
  const note = action === "reject" ? prompt("เหตุผลที่สลิปไม่ผ่าน (ส่งให้ผู้สมัครทางอีเมล)") ?? undefined : undefined;
  if (action === "approve" && !confirm("ยืนยันว่าได้รับเงินแล้ว? ระบบจะส่งอีเมลยืนยันให้ผู้สมัคร")) return;
  try {
    await $fetch(`/api/manage/payments/${id}`, { method: "POST", body: { action, note }, headers: props.authHeaders() });
    detail.value = await $fetch<Detail>(`/api/manage/applications/${detail.value!.id}`, { headers: props.authHeaders() });
    await load();
  } catch (e: any) {
    alert(e?.data?.message || "ไม่สำเร็จ");
  }
}
const pkgName = (id: string) => PACKAGES.find((p) => p.id === id)?.short || id;
const docLabel = (k: string) => APP_DOCS.find((d) => d.kind === k)?.label || k;
const fmt = (d: string) => (d ? new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-");
const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
function exportCsv() {
  const head = ["ชื่อ", "นามสกุล", "อีเมล", "เบอร์โทร", "สถานที่ทำงาน", "รุ่น", "แพ็กเกจ", "สถานะ", "ส่งเมื่อ"];
  const body = shown.value.map((r) => [r.prefix + r.firstName, r.lastName, r.email, r.phone, r.workplace, r.cohortId, pkgName(r.packageId), APP_STATUS[r.status]?.[0], fmt(r.updatedAt)].map(csvCell).join(","));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + [head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" }));
  a.download = "applications.csv";
  a.click();
}
onMounted(load);
</script>

<template>
  <section class="mt-6 rounded-3xl bg-white p-6 shadow-sm">
    <h2 class="text-xl font-bold text-navy-800">ใบสมัครเรียน</h2>
    <div class="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
      <button v-for="s in ['submitted', 'needs_changes', 'approved', 'rejected', '']" :key="s" class="rounded-full px-3 py-1.5" :class="statusFilter === s ? 'bg-navy-800 text-white' : 'bg-sky-soft text-navy-800'" @click="statusFilter = s">
        {{ s ? `${APP_STATUS[s]?.[0]} (${count(s)})` : `ทั้งหมด (${rows.length})` }}
      </button>
    </div>
    <div class="mt-3 flex flex-wrap gap-2">
      <input v-model="q" class="field max-w-xs" placeholder="ค้นหาชื่อ / อีเมล / เบอร์ / ที่ทำงาน" />
      <button class="rounded-full border border-navy-800 px-4 py-2 text-xs text-navy-800 hover:bg-navy-800 hover:text-white" @click="exportCsv">ส่งออก CSV</button>
    </div>
    <p v-if="msg" class="mt-3 text-sm" :class="msg.ok ? 'text-green-700' : 'text-red-700'">{{ msg.text }}</p>
    <p v-if="!shown.length" class="mt-4 text-sm text-slate-500">ไม่มีใบสมัคร</p>
    <ul class="mt-4 divide-y divide-sky-card">
      <li v-for="r in shown" :key="r.id">
        <button class="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left" @click="toggle(r)">
          <span><b class="text-navy-800">{{ r.prefix }}{{ r.firstName }} {{ r.lastName }}</b> <span class="text-xs text-slate-500">· {{ r.workplace || "ไม่ระบุที่ทำงาน" }} · {{ pkgName(r.packageId) }} · {{ fmt(r.updatedAt) }}</span></span>
          <span class="flex gap-1">
            <span v-if="r.payStatus === 'paid'" class="rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white">ชำระแล้ว</span>
            <span v-else-if="r.payStatus === 'pending'" class="rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white">สลิปรอตรวจ</span>
            <span class="rounded-full px-3 py-0.5 text-xs font-semibold" :class="APP_STATUS[r.status]?.[1]">{{ APP_STATUS[r.status]?.[0] }}</span>
          </span>
        </button>
        <div v-if="openId === r.id" class="mb-4 rounded-2xl bg-sky-soft p-4 text-sm">
          <p v-if="!detail" class="text-slate-500">กำลังโหลด...</p>
          <template v-else>
            <dl class="grid gap-x-6 gap-y-2 md:grid-cols-2">
              <div><dt class="text-xs text-slate-500">ชื่อ-นามสกุล</dt><dd>{{ detail.prefix }}{{ detail.firstName }} {{ detail.lastName }}</dd></div>
              <div><dt class="text-xs text-slate-500">เลขบัตรประชาชน / วันเกิด</dt><dd>{{ detail.nationalId }} · {{ detail.birthDate ? fmt(detail.birthDate) : "-" }}</dd></div>
              <div><dt class="text-xs text-slate-500">ติดต่อ</dt><dd>{{ detail.phone }} · {{ detail.email }}<span v-if="detail.lineId"> · LINE {{ detail.lineId }}</span></dd></div>
              <div><dt class="text-xs text-slate-500">ที่อยู่</dt><dd class="whitespace-pre-line">{{ detail.address || "-" }}</dd></div>
              <div><dt class="text-xs text-slate-500">วุฒิการศึกษา</dt><dd>{{ detail.education }}<span v-if="detail.school"> · {{ detail.school }}</span></dd></div>
              <div><dt class="text-xs text-slate-500">ที่ทำงาน</dt><dd>{{ detail.workplace || "-" }}<span v-if="detail.position"> · {{ detail.position }}</span><span v-if="detail.experienceYears != null"> · {{ detail.experienceYears }} ปี</span></dd></div>
              <div><dt class="text-xs text-slate-500">รุ่น / แพ็กเกจ / ผู้ชำระ</dt><dd>{{ detail.cohortId }} · {{ pkgName(detail.packageId) }} · {{ detail.payer === "employer" ? `นายจ้าง: ${detail.invoiceName}${detail.invoiceTaxId ? ` (${detail.invoiceTaxId})` : ""}` : "ชำระเอง" }}</dd></div>
            </dl>
            <p class="mt-4 font-semibold text-navy-800">เอกสาร</p>
            <ul class="mt-2 space-y-2">
              <li v-for="fl in detail.files" :key="fl.id" class="flex flex-wrap items-center gap-2 rounded-xl bg-white px-3 py-2">
                <span class="min-w-[11rem] font-medium">{{ docLabel(fl.kind) }}</span>
                <button class="text-xs text-navy-800 underline" @click="openFile(`/api/applications/files/${fl.id}`)">เปิดดู ({{ Math.round(fl.size / 1024) }} KB)</button>
                <select v-model="review.files[fl.id]!.status" class="field max-w-[9rem] py-1 text-xs">
                  <option value="pending">ยังไม่ตรวจ</option><option value="ok">ถูกต้อง</option><option value="rejected">ไม่ผ่าน</option>
                </select>
                <input v-if="review.files[fl.id]!.status === 'rejected'" v-model="review.files[fl.id]!.note" class="field max-w-xs py-1 text-xs" placeholder="เหตุผล เช่น ภาพไม่ชัด" />
              </li>
            </ul>
            <template v-if="detail.status === 'approved'">
              <p class="mt-4 font-semibold text-navy-800">การชำระค่าเรียน ({{ detail.amount?.toLocaleString("th-TH") }} บาท)</p>
              <p v-if="!detail.payments?.length" class="mt-1 text-xs text-slate-500">ยังไม่มีการชำระ</p>
              <ul class="mt-2 space-y-2">
                <li v-for="py in detail.payments" :key="py.id" class="flex flex-wrap items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs">
                  <span class="rounded-full px-2 py-0.5 font-semibold" :class="py.status === 'paid' ? 'bg-green-100 text-green-800' : py.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'">{{ py.status === "paid" ? "ชำระแล้ว" : py.status === "pending" ? "รอตรวจ" : "ไม่ผ่าน" }}</span>
                  <span>{{ fmt(py.createdAt) }} · {{ py.transRef || "-" }} · {{ py.verifiedBy || "" }}</span>
                  <span v-if="py.note" class="text-slate-500">{{ py.note }}</span>
                  <button v-if="py.hasSlip" class="underline" @click="openFile(`/api/payments/${py.id}/slip`)">ดูสลิป</button>
                  <template v-if="py.status !== 'paid'">
                    <button class="rounded-full bg-green-600 px-3 py-1 text-white" @click="payAction(py.id, 'approve')">ยืนยันว่าชำระแล้ว</button>
                    <button v-if="py.status === 'pending'" class="rounded-full border border-red-300 px-3 py-1 text-red-700" @click="payAction(py.id, 'reject')">สลิปไม่ผ่าน</button>
                  </template>
                </li>
              </ul>
            </template>
            <label class="mt-4 block text-xs text-slate-600">หมายเหตุถึงผู้สมัคร
              <textarea v-model="review.note" rows="2" class="field mt-1" placeholder="เช่น กรุณาแนบสำเนาวุฒิที่เห็นชื่อชัดเจน" />
            </label>
            <div class="mt-3 flex flex-wrap gap-2">
              <button :disabled="busy" class="btn-brand px-5 py-2 text-sm disabled:opacity-60" @click="decide('approved')">ผ่านการตรวจสอบ</button>
              <button :disabled="busy" class="rounded-full border-2 border-orange-400 bg-white px-5 py-2 text-sm text-orange-700 disabled:opacity-60" @click="decide('needs_changes')">ขอแก้ไข</button>
              <button :disabled="busy" class="rounded-full border border-red-300 bg-white px-5 py-2 text-sm text-red-700 disabled:opacity-60" @click="decide('rejected')">ไม่ผ่าน</button>
            </div>
          </template>
        </div>
      </li>
    </ul>
  </section>
</template>
