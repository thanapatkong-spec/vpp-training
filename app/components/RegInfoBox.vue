<script setup lang="ts">
import { ClipboardList, Copy } from "lucide-vue-next";

// ข้อมูลสำหรับกรอกแบบคำขอขึ้นทะเบียน ศ.ศ.สพ.013-1 (ผู้ที่ผ่านการอบรมกับเรา) — แก้ข้อความได้ที่ ตั้งค่าเว็บไซต์
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });
const site = useSiteSettingsNow();
const copied = ref("");
async function copy(key: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = key;
    setTimeout(() => copied.value === key && (copied.value = ""), 1500);
  } catch {}
}
</script>

<template>
  <div class="rounded-2xl border-2 border-brand/40 bg-orange-50/60 p-5 text-sm">
    <p class="flex items-center gap-2 font-bold text-navy-800"><ClipboardList class="size-5 text-brand" />ผ่านการอบรมกับเรา: ข้อมูลสำหรับกรอกแบบคำขอขึ้นทะเบียน (ศ.ศ.สพ.013-1)</p>
    <p v-if="!compact" class="mt-1 text-xs text-slate-600">ในช่อง "ผ่านการอบรมหลักสูตรผู้ช่วยผู้ประกอบวิชาชีพการสัตวแพทย์" ของแบบคำขอ ให้กรอกดังนี้</p>
    <dl class="mt-3 space-y-2">
      <div v-for="row in [{ k: 'course', label: 'เรื่อง (อบรมหลักสูตร)', v: site.regCourse }, { k: 'org', label: 'จัดโดยหน่วยงาน', v: site.regOrganizer }]" :key="row.k" class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-4 py-2">
        <dt class="w-40 shrink-0 text-xs text-slate-500">{{ row.label }}</dt>
        <dd class="flex-1 font-semibold text-navy-800">{{ row.v }}</dd>
        <button type="button" class="flex items-center gap-1 text-xs text-navy-800 hover:text-brand" @click="copy(row.k, row.v)"><Copy class="size-3.5" />{{ copied === row.k ? "คัดลอกแล้ว" : "คัดลอก" }}</button>
      </div>
      <div class="flex flex-wrap gap-x-3 rounded-xl bg-white px-4 py-2">
        <dt class="w-40 shrink-0 text-xs text-slate-500">วันที่</dt>
        <dd class="flex-1 text-slate-700">ตามวันที่อบรมในใบประกาศนียบัตรของคุณ</dd>
      </div>
    </dl>
  </div>
</template>
