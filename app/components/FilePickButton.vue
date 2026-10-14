<script setup lang="ts">
import { Paperclip } from "lucide-vue-next";

// ปุ่มเลือกไฟล์ที่มองเห็นชัด (ช่อง <input type=file> ของเบราว์เซอร์ถูก Tailwind ล้างสไตล์จนปุ่มกลืนกับพื้นหลัง)
const props = withDefaults(defineProps<{ modelValue?: File; accept?: string; label?: string; maxMb?: number }>(), {
  accept: "application/pdf,image/jpeg,image/png",
  label: "แนบไฟล์",
  maxMb: 4,
});
const emit = defineEmits<{ "update:modelValue": [f: File | undefined]; picked: [f: File] }>();
const err = ref("");

const shrinking = ref(false);
const isPhoto = (f: File) => /^image\/(jpeg|png|webp|heic|heif)$/i.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name);

async function onChange(e: Event) {
  const input = e.target as HTMLInputElement;
  let f = input.files?.[0];
  input.value = ""; // เลือกไฟล์เดิมซ้ำได้
  if (!f) return;
  const limit = props.maxMb * 1024 * 1024;
  // รูปใหญ่เกิน: ย่อให้อัตโนมัติ (ไม่ต้องย่อเอง)
  if (f.size > limit && isPhoto(f)) {
    shrinking.value = true;
    try { f = await shrinkImage(f, Math.min(limit * 0.9, 1.5 * 1024 * 1024)); } catch {} finally { shrinking.value = false; }
  }
  if (f.size > limit) {
    err.value = `ไฟล์ใหญ่เกิน ${props.maxMb}MB (ไฟล์นี้ ${(f.size / 1024 / 1024).toFixed(1)}MB) กรุณาย่อขนาดก่อน`;
    return;
  }
  err.value = "";
  emit("update:modelValue", f);
  emit("picked", f);
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-3">
      <label class="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-navy-800 bg-white px-5 py-2 text-sm font-semibold text-navy-800 hover:bg-navy-800 hover:text-white">
        <Paperclip class="size-4" />{{ modelValue ? "เปลี่ยนไฟล์" : label }}
        <input type="file" :accept="accept" class="sr-only" @change="onChange" />
      </label>
      <span v-if="shrinking" class="text-sm text-slate-500">กำลังย่อรูป...</span>
      <span v-else class="text-sm" :class="modelValue ? 'font-medium text-navy-800' : 'text-slate-500'">{{ modelValue ? `${modelValue.name} (${Math.max(1, Math.round(modelValue.size / 1024))} KB)` : "ยังไม่ได้เลือกไฟล์" }}</span>
      <button v-if="modelValue" type="button" class="text-xs text-red-600 hover:underline" @click="emit('update:modelValue', undefined)">เอาออก</button>
    </div>
    <p v-if="err" class="mt-1 text-xs text-red-700">{{ err }}</p>
  </div>
</template>
