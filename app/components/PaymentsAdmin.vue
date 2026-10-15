<script setup lang="ts">
import { PACKAGES, baht } from "#shared/config";

// แอดมิน: ตรวจการชำระ แยก 2 ประเภท — ค่าเรียน (ให้ Dr.John) / ค่าตรวจสอบคุณสมบัติ (ให้สัตวแพทยสภา)
// สลิปรอตรวจ / ชำระแล้ว / ไม่ผ่าน / ยังไม่ชำระ
const props = defineProps<{ authHeaders: () => Record<string, string> | undefined }>();
const openFile = useAuthedOpen(props.authHeaders);
const cohorts = useCohortList();

type Who = { applicationId: string; prefix: string; firstName: string; lastName: string; phone: string; cohortId: string; packageId: string; email: string };
type Kind = "tuition" | "council";
type Pay = Who & { id: string; kind: Kind; amount: number; status: "pending" | "paid" | "rejected"; transRef: string | null; verifiedBy: string | null; note: string | null; hasSlip: string | null; createdAt: string; paidAt: string | null };
type Unpaid = Who & { amount: number; approvedAt: string };

const data = ref<{ payments: Pay[]; unpaid: Unpaid[]; councilUnpaid: Unpaid[] }>({ payments: [], unpaid: [], councilUnpaid: [] });
const kind = ref<Kind>("tuition");
const KINDS = [["tuition", "ค่าเรียน (Dr.John)"], ["council", "ค่าตรวจสอบคุณสมบัติ (สัตวแพทยสภา)"]] as const;
const pays = computed(() => data.value.payments.filter((p) => (p.kind || "tuition") === kind.value));
const unpaidList = computed(() => (kind.value === "council" ? data.value.councilUnpaid : data.value.unpaid));
const pendingOf = (k: Kind) => data.value.payments.filter((p) => (p.kind || "tuition") === k && p.status === "pending").length;
const loading = ref(true);
const err = ref("");
const filter = ref<"pending" | "paid" | "rejected" | "unpaid" | "">("pending");
const cohortFilter = ref("");
const q = ref("");
const busyId = ref("");

async function load() {
  loading.value = true;
  err.value = "";
  try {
    data.value = await $fetch("/api/manage/payments", { headers: props.authHeaders() });
  } catch (e: any) {
    err.value = e?.data?.message || "โหลดรายการไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}
onMounted(load);

const FILTERS = [["pending", "สลิปรอตรวจ"], ["unpaid", "ยังไม่ชำระ"], ["paid", "ชำระแล้ว"], ["rejected", "สลิปไม่ผ่าน"], ["", "ทั้งหมด"]] as const;
const STATUS: Record<string, [string, string]> = {
  pending: ["รอตรวจ", "bg-amber-500 text-white"],
  paid: ["ชำระแล้ว", "bg-green-600 text-white"],
  rejected: ["ไม่ผ่าน", "bg-red-100 text-red-700"],
  unpaid: ["ยังไม่ชำระ", "bg-slate-200 text-slate-700"],
};
const cohortName = (id: string) => cohorts.value.find((c) => c.id === id)?.name || id;
const pkgName = (id: string) => PACKAGES.find((p) => p.id === id)?.short || id;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");
const fullName = (r: Who) => `${r.prefix}${r.firstName} ${r.lastName}`;

const match = (r: Who) => {
  const k = q.value.trim().toLowerCase();
  return (!cohortFilter.value || r.cohortId === cohortFilter.value) && (!k || [r.firstName, r.lastName, r.email, r.phone].some((v) => (v || "").toLowerCase().includes(k)));
};
const count = (f: string) => (f === "unpaid" ? unpaidList.value.length : f ? pays.value.filter((p) => p.status === f).length : pays.value.length + unpaidList.value.length);
const shownPays = computed(() => (filter.value === "unpaid" ? [] : pays.value.filter((p) => (!filter.value || p.status === filter.value) && match(p))));
const shownUnpaid = computed(() => (filter.value === "unpaid" || filter.value === "" ? unpaidList.value.filter(match) : []));
const usedCohorts = computed(() => [...new Set([...data.value.payments, ...data.value.unpaid, ...data.value.councilUnpaid].map((r) => r.cohortId))]);
const paidTotal = computed(() => pays.value.filter((p) => p.status === "paid" && match(p)).reduce((s, p) => s + p.amount, 0));
const unpaidTotal = computed(() => unpaidList.value.filter(match).reduce((s, p) => s + p.amount, 0));

async function act(p: Pay, action: "approve" | "reject") {
  let note: string | undefined;
  if (action === "reject") {
    const r = prompt("เหตุผลที่สลิปไม่ผ่าน (ส่งให้ผู้สมัครทางอีเมล)");
    if (r === null) return;
    note = r || undefined;
  } else if (!confirm(p.kind === "council" ? `ยืนยันว่าหลักฐานค่าตรวจสอบคุณสมบัติของ ${fullName(p)} ถูกต้อง (ชำระให้สัตวแพทยสภา ${baht(p.amount)} บาท)?\nระบบจะส่งอีเมลยืนยันให้ผู้สมัคร` : `ยืนยันว่าได้รับเงิน ${baht(p.amount)} บาท จาก ${fullName(p)} แล้ว?\nระบบจะส่งอีเมลยืนยันให้ผู้สมัคร`)) return;
  busyId.value = p.id;
  try {
    await $fetch(`/api/manage/payments/${p.id}`, { method: "POST", body: { action, note }, headers: props.authHeaders() });
    await load();
  } catch (e: any) {
    alert(e?.data?.message || "ไม่สำเร็จ");
  } finally {
    busyId.value = "";
  }
}
async function recordManual(u: Unpaid) {
  const ref = prompt(kind.value === "council" ? `บันทึกว่า ${fullName(u)} ชำระค่าตรวจสอบคุณสมบัติ ${baht(u.amount)} บาท แล้ว (เช่น ส่งหลักฐานทางอีเมล)\nใส่เลขอ้างอิง (ถ้ามี)` : `บันทึกรับเงิน ${baht(u.amount)} บาท จาก ${fullName(u)} (โอนตรง/เงินสด)\nใส่เลขอ้างอิงการโอน (ถ้ามี)`);
  if (ref === null) return;
  busyId.value = u.applicationId;
  try {
    await $fetch("/api/manage/payments", { method: "POST", body: { applicationId: u.applicationId, kind: kind.value, ref: ref.trim() || undefined }, headers: props.authHeaders() });
    await load();
  } catch (e: any) {
    alert(e?.data?.message || "ไม่สำเร็จ");
  } finally {
    busyId.value = "";
  }
}
const kindLabel = computed(() => (kind.value === "council" ? "ค่าตรวจสอบคุณสมบัติ" : "ค่าเรียน"));
const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
function exportCsv() {
  const head = ["ประเภท", "ชื่อ-นามสกุล", "อีเมล", "เบอร์โทร", "รุ่น", "แพ็กเกจ", "ยอด (บาท)", "สถานะ", "เลขอ้างอิง", "ส่งสลิป/อนุมัติเมื่อ", "ชำระเมื่อ", "ตรวจโดย", "หมายเหตุ"];
  const rows = [
    ...shownPays.value.map((p) => [kindLabel.value, fullName(p), p.email, p.phone, cohortName(p.cohortId), pkgName(p.packageId), p.amount, STATUS[p.status]![0], p.transRef, fmt(p.createdAt), fmt(p.paidAt), p.verifiedBy, p.note]),
    ...shownUnpaid.value.map((u) => [kindLabel.value, fullName(u), u.email, u.phone, cohortName(u.cohortId), pkgName(u.packageId), u.amount, "ยังไม่ชำระ", "", fmt(u.approvedAt), "", "", ""]),
  ];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
  a.download = `vpp-${kind.value === "council" ? "council-fee" : "payments"}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}
</script>

<template>
  <section class="mt-6 rounded-3xl bg-white p-6 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-2xl font-bold text-navy-800">ตรวจการชำระเงิน</h2>
      <button class="text-sm text-navy-800 underline" @click="load">รีเฟรช</button>
    </div>
    <div class="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
      <button v-for="[k, label] in KINDS" :key="k" class="rounded-2xl border-2 px-4 py-2" :class="kind === k ? 'border-navy-800 bg-navy-800 text-white' : 'border-sky-card bg-white text-navy-800'" @click="kind = k">
        {{ label }}<span v-if="pendingOf(k)" class="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">รอตรวจ {{ pendingOf(k) }}</span>
      </button>
    </div>
    <p v-if="kind === 'council'" class="mt-2 text-xs text-slate-500">ผู้สมัครโอนเข้าบัญชีสัตวแพทยสภาเอง แล้วแนบหลักฐานในหน้าใบสมัคร (ส่งได้ทุกเมื่อหลังส่งใบสมัคร) · ตรวจว่าชื่อผู้รับเป็นสัตวแพทยสภาและยอดถูกต้อง</p>
    <div class="mt-3 grid gap-3 sm:grid-cols-3">
      <div class="rounded-2xl bg-amber-50 px-4 py-3"><p class="text-xs text-amber-800">สลิปรอตรวจ</p><p class="text-2xl font-bold text-amber-700">{{ count("pending") }}</p></div>
      <div class="rounded-2xl bg-green-50 px-4 py-3"><p class="text-xs text-green-800">ชำระแล้ว (รวม)</p><p class="text-2xl font-bold text-green-700">{{ baht(paidTotal) }} <span class="text-sm font-medium">บาท</span></p></div>
      <div class="rounded-2xl bg-slate-50 px-4 py-3"><p class="text-xs text-slate-600">{{ kind === "council" ? "ส่งใบสมัครแล้ว ยังไม่ส่งหลักฐาน" : "ผ่านคุณสมบัติแล้ว ยังไม่ชำระ" }}</p><p class="text-2xl font-bold text-slate-700">{{ count("unpaid") }} <span class="text-sm font-medium">คน · {{ baht(unpaidTotal) }} บาท</span></p></div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
      <button v-for="[k, label] in FILTERS" :key="k" class="rounded-full px-3 py-1.5" :class="filter === k ? 'bg-navy-800 text-white' : 'bg-sky-soft text-navy-800'" @click="filter = k">{{ label }} ({{ count(k) }})</button>
    </div>
    <div class="mt-3 flex flex-wrap gap-2">
      <input v-model="q" class="field max-w-xs" placeholder="ค้นหาชื่อ / อีเมล / เบอร์" />
      <select v-if="usedCohorts.length > 1" v-model="cohortFilter" class="field max-w-[14rem]">
        <option value="">ทุกรุ่น</option>
        <option v-for="id in usedCohorts" :key="id" :value="id">{{ cohortName(id) }}</option>
      </select>
      <button class="rounded-full border border-navy-800 px-4 py-2 text-xs text-navy-800 hover:bg-navy-800 hover:text-white" @click="exportCsv">ส่งออก CSV</button>
    </div>

    <p v-if="err" class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ err }}</p>
    <p v-else-if="loading" class="mt-4 text-sm text-slate-500">กำลังโหลด...</p>
    <p v-else-if="!shownPays.length && !shownUnpaid.length" class="mt-4 text-sm text-slate-500">ไม่มีรายการ</p>

    <ul class="mt-4 divide-y divide-sky-card">
      <li v-for="p in shownPays" :key="p.id" class="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <div class="min-w-[16rem] flex-1">
          <p><b class="text-navy-800">{{ fullName(p) }}</b> <span class="text-xs text-slate-500">· {{ p.email }} · {{ p.phone }}</span></p>
          <p class="text-xs text-slate-500">{{ cohortName(p.cohortId) }} · {{ pkgName(p.packageId) }} · ส่งเมื่อ {{ fmt(p.createdAt) }}<template v-if="p.paidAt"> · ชำระเมื่อ {{ fmt(p.paidAt) }}</template></p>
          <p v-if="p.transRef || p.verifiedBy || p.note" class="text-xs text-slate-500">
            <template v-if="p.transRef">เลขอ้างอิง {{ p.transRef }} · </template><template v-if="p.verifiedBy">ตรวจโดย {{ p.verifiedBy === "slip-api" ? "ระบบตรวจสลิป" : p.verifiedBy }}</template><template v-if="p.note"> · {{ p.note }}</template>
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <b class="text-navy-800">{{ baht(p.amount) }} บาท</b>
          <span class="rounded-full px-3 py-0.5 text-xs font-semibold" :class="STATUS[p.status]![1]">{{ STATUS[p.status]![0] }}</span>
          <button v-if="p.hasSlip" class="rounded-full border border-navy-800 px-3 py-1 text-xs text-navy-800" @click="openFile(`/api/payments/${p.id}/slip`)">{{ p.hasSlip === "application/pdf" ? "ดูหลักฐาน (PDF)" : "ดูสลิป" }}</button>
          <template v-if="p.status === 'pending'">
            <button :disabled="busyId === p.id" class="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60" @click="act(p, 'approve')">{{ p.kind === "council" ? "หลักฐานถูกต้อง" : "ยืนยันว่าได้รับเงิน" }}</button>
            <button :disabled="busyId === p.id" class="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 disabled:opacity-60" @click="act(p, 'reject')">สลิปไม่ผ่าน</button>
          </template>
        </div>
      </li>
      <li v-for="u in shownUnpaid" :key="u.applicationId" class="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
        <div class="min-w-[16rem] flex-1">
          <p><b class="text-navy-800">{{ fullName(u) }}</b> <span class="text-xs text-slate-500">· {{ u.email }} · {{ u.phone }}</span></p>
          <p class="text-xs text-slate-500">{{ cohortName(u.cohortId) }} · {{ pkgName(u.packageId) }} · {{ kind === "council" ? "ส่งใบสมัครเมื่อ" : "ผ่านคุณสมบัติเมื่อ" }} {{ fmt(u.approvedAt) }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <b class="text-navy-800">{{ baht(u.amount) }} บาท</b>
          <span class="rounded-full px-3 py-0.5 text-xs font-semibold" :class="STATUS.unpaid![1]">ยังไม่ชำระ</span>
          <button :disabled="busyId === u.applicationId" class="rounded-full border border-green-700 px-3 py-1 text-xs font-semibold text-green-700 disabled:opacity-60" @click="recordManual(u)">{{ kind === "council" ? "บันทึกว่าชำระแล้ว" : "บันทึกรับเงินนอกระบบ" }}</button>
        </div>
      </li>
    </ul>
  </section>
</template>
