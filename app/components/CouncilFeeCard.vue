<script setup lang="ts">
import { CheckCircle2, Download } from "lucide-vue-next";
import { baht } from "#shared/config";

// ค่าตรวจสอบคุณสมบัติ (ชำระให้สัตวแพทยสภา) — แยกจากค่าเรียน ส่งหลักฐานได้ทุกเมื่อหลังส่งใบสมัคร (ก่อน/พร้อม/หลังชำระค่าเรียน)
type Pay = { id: string; status: string; note: string | null; createdAt: string };
export type Council = { amount: number; paid: boolean; pending: boolean; history: Pay[]; info: string; payin: string | null };
const props = defineProps<{ council: Council; cohortId: string }>();
const emit = defineEmits<{ sent: [] }>();
const asset = useAsset();

const slip = ref<File>();
const sending = ref(false);
const msg = ref<{ ok: boolean; text: string } | null>(null);
const lastRejected = computed(() => props.council.history[0]?.status === "rejected" ? props.council.history[0] : null);

async function send() {
  msg.value = null;
  if (!slip.value) return (msg.value = { ok: false, text: "กรุณากดปุ่ม \"แนบหลักฐาน\" แล้วเลือกรูปสลิปหรือ PDF" });
  const fd = new FormData();
  fd.append("kind", "council");
  fd.append("cohort", props.cohortId);
  const f = /^image\//.test(slip.value.type) ? await shrinkImage(slip.value, 2 * 1024 * 1024) : slip.value;
  fd.append("slip", f, f.name);
  sending.value = true;
  try {
    await $fetch("/api/me/payment", { method: "POST", body: fd });
    msg.value = { ok: true, text: "ส่งหลักฐานแล้ว ทีมงานจะตรวจสอบและยืนยันทางอีเมล" };
    slip.value = undefined;
    emit("sent");
  } catch (e: any) {
    msg.value = { ok: false, text: e?.data?.message || "ส่งหลักฐานไม่สำเร็จ" };
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div class="mt-5 rounded-2xl border-2 p-5" :class="council.paid ? 'border-green-300 bg-green-50' : council.pending ? 'border-amber-300 bg-amber-50/50' : 'border-sky-card bg-white'">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="font-bold text-navy-800">ค่าตรวจสอบคุณสมบัติ (ชำระให้สัตวแพทยสภา) {{ baht(council.amount) }} บาท</p>
      <span v-if="council.paid" class="rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white">ชำระแล้ว</span>
      <span v-else-if="council.pending" class="rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white">ส่งหลักฐานแล้ว รอตรวจ</span>
      <span v-else class="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-700">ยังไม่ชำระ</span>
    </div>
    <p v-if="council.paid" class="mt-1 flex items-center gap-2 text-sm text-green-800"><CheckCircle2 class="size-4" />ทีมงานตรวจหลักฐานการชำระเรียบร้อยแล้ว</p>
    <p v-else-if="council.pending" class="mt-1 text-sm text-slate-600">ทีมงานจะตรวจสอบและยืนยันทางอีเมล</p>
    <template v-else>
      <p class="mt-1 text-xs text-slate-500">แยกจากค่าเรียน ชำระและส่งหลักฐานได้เลยตอนนี้ (ก่อน พร้อม หรือหลังชำระค่าเรียนก็ได้)</p>
      <p class="mt-3 whitespace-pre-line rounded-xl bg-sky-soft px-4 py-3 text-sm text-slate-700">{{ council.info }}</p>
      <a v-if="council.payin" :href="council.payin.startsWith('/') ? asset(council.payin) : council.payin" target="_blank" rel="noopener" class="mt-2 inline-flex items-center gap-1 text-sm text-navy-800 underline"><Download class="size-4" />ดาวน์โหลดใบ Pay-in (ชำระที่เคาน์เตอร์)</a>
      <p v-if="lastRejected" class="mt-3 text-xs text-red-700">หลักฐานล่าสุดไม่ผ่าน{{ lastRejected.note ? `: ${lastRejected.note}` : "" }} กรุณาแนบใหม่</p>
      <p class="mt-3 text-xs text-slate-500">ชำระแล้ว แนบสลิปจากแอปธนาคาร หรือรูป/PDF ใบเสร็จ</p>
      <FilePickButton v-model="slip" label="แนบหลักฐาน" accept="image/jpeg,image/png,application/pdf" class="mt-2" />
      <button :disabled="sending" class="btn-brand mt-3 px-6 py-2.5 text-sm disabled:opacity-60" @click="send">{{ sending ? "กำลังส่ง..." : "ส่งหลักฐานค่าตรวจสอบคุณสมบัติ" }}</button>
    </template>
    <p v-if="msg" class="mt-3 text-sm" :class="msg.ok ? 'text-green-700' : 'text-red-700'">{{ msg.text }}</p>
  </div>
</template>
