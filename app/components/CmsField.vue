<script setup lang="ts">
import type { CmsField } from "#shared/cms";

const props = defineProps<{ field: CmsField; modelValue: any; authHeaders: () => Record<string, string> | undefined }>();
const emit = defineEmits<{ "update:modelValue": [v: any] }>();
const asset = useAsset();
const { upload, previews } = useCmsUpload(props.authHeaders);
const busy = ref(false);
const err = ref("");
const mdEl = ref<HTMLTextAreaElement>();

const set = (v: any) => emit("update:modelValue", v);
const src = (p: string) => previews.value[p] || (p.startsWith("/") ? asset(p) : p);
const isImg = (p: string) => /\.(jpe?g|png|webp|gif)$/i.test(p);

async function pick(e: Event, apply: (paths: string[]) => void) {
  const input = e.target as HTMLInputElement;
  const files = [...(input.files || [])];
  input.value = "";
  if (!files.length) return;
  busy.value = true;
  err.value = "";
  const out: string[] = [];
  try {
    for (const f of files) out.push(await upload(f));
    apply(out);
  } catch (ex: any) {
    err.value = ex?.data?.message || "อัปโหลดไม่สำเร็จ";
    if (out.length) apply(out);
  } finally {
    busy.value = false;
  }
}
function insertMd(paths: string[]) {
  const el = mdEl.value;
  const text = paths.map((p) => (isImg(p) ? `![คำอธิบายรูป](${p})` : `[ดาวน์โหลดไฟล์](${p})`)).join("\n\n");
  const v: string = props.modelValue || "";
  const pos = el ? el.selectionStart : v.length;
  set(v.slice(0, pos) + (pos && !v.slice(0, pos).endsWith("\n") ? "\n\n" : "") + text + "\n\n" + v.slice(pos));
}
const move = (i: number, d: number) => {
  const a = [...(props.modelValue || [])];
  const j = i + d;
  if (j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
  set(a);
};
function newRow() {
  const o: Record<string, any> = {};
  for (const f of props.field.fields || []) o[f.name] = f.default ?? "";
  return o;
}
</script>

<template>
  <div>
    <label v-if="field.type !== 'boolean'" class="block text-sm font-semibold text-navy-800">
      {{ field.label }}<span v-if="field.required" class="text-red-600"> *</span>
    </label>

    <input v-if="field.type === 'string'" :value="modelValue ?? ''" class="field mt-1" @input="set(($event.target as HTMLInputElement).value)" />
    <textarea v-else-if="field.type === 'text'" :value="modelValue ?? ''" rows="4" class="field mt-1" @input="set(($event.target as HTMLTextAreaElement).value)" />
    <input v-else-if="field.type === 'date'" type="date" :value="modelValue ?? ''" class="field mt-1 max-w-[12rem]" @input="set(($event.target as HTMLInputElement).value)" />
    <input v-else-if="field.type === 'number'" type="number" :value="modelValue ?? ''" class="field mt-1 max-w-[8rem]" @input="set(($event.target as HTMLInputElement).value)" />
    <label v-else-if="field.type === 'boolean'" class="flex items-center gap-2 text-sm font-semibold text-navy-800">
      <input type="checkbox" :checked="!!modelValue" class="size-4" @change="set(($event.target as HTMLInputElement).checked)" />{{ field.label }}
    </label>
    <select v-else-if="field.type === 'select'" :value="modelValue ?? field.default" class="field mt-1 max-w-sm" @change="set(($event.target as HTMLSelectElement).value)">
      <option v-for="o in field.options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>

    <!-- markdown -->
    <div v-else-if="field.type === 'markdown'">
      <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <label class="cursor-pointer rounded-full border border-navy-800 px-3 py-1 text-navy-800 hover:bg-navy-800 hover:text-white">
          แทรกรูป/ไฟล์<input type="file" multiple class="hidden" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.docx,.xlsx,.pptx,.zip" @change="pick($event, insertMd)" />
        </label>
        <span>เขียนแบบ Markdown: <code>## หัวข้อ</code> · <code>**ตัวหนา**</code> · <code>- รายการ</code> · <code>[ข้อความ](ลิงก์)</code></span>
      </div>
      <textarea ref="mdEl" :value="modelValue ?? ''" rows="18" class="field mt-1 font-mono text-sm leading-relaxed" @input="set(($event.target as HTMLTextAreaElement).value)" />
    </div>

    <!-- image / file -->
    <div v-else-if="field.type === 'image' || field.type === 'file'" class="mt-1">
      <div class="flex flex-wrap items-center gap-2">
        <img v-if="modelValue && isImg(modelValue)" :src="src(modelValue)" alt="" class="h-16 w-16 rounded-lg object-cover" />
        <input :value="modelValue ?? ''" class="field max-w-md flex-1" placeholder="/uploads/ชื่อไฟล์ (หรืออัปโหลด)" @input="set(($event.target as HTMLInputElement).value)" />
        <label class="cursor-pointer rounded-full border border-navy-800 px-3 py-1.5 text-xs text-navy-800 hover:bg-navy-800 hover:text-white">
          {{ busy ? "กำลังอัปโหลด..." : "อัปโหลด" }}<input type="file" class="hidden" :accept="field.type === 'image' ? '.jpg,.jpeg,.png,.webp,.gif' : '.pdf,.docx,.xlsx,.pptx,.zip'" @change="pick($event, (p) => set(p[0]))" />
        </label>
        <button v-if="modelValue" type="button" class="text-xs text-red-600 hover:underline" @click="set('')">ล้าง</button>
      </div>
    </div>

    <!-- images (หลายรูป) -->
    <div v-else-if="field.type === 'images'" class="mt-1">
      <ul class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <li v-for="(p, i) in modelValue || []" :key="p + i" class="rounded-xl bg-sky-soft p-2">
          <img :src="src(p)" alt="" class="aspect-square w-full rounded-lg object-cover" />
          <div class="mt-1 flex items-center justify-between text-xs">
            <span class="space-x-1"><button type="button" :disabled="i === 0" class="disabled:opacity-30" @click="move(i, -1)">◀</button><button type="button" :disabled="i === (modelValue || []).length - 1" class="disabled:opacity-30" @click="move(i, 1)">▶</button></span>
            <button type="button" class="text-red-600" @click="set((modelValue || []).filter((_: string, k: number) => k !== i))">ลบ</button>
          </div>
        </li>
      </ul>
      <label class="mt-2 inline-block cursor-pointer rounded-full border border-navy-800 px-4 py-1.5 text-xs text-navy-800 hover:bg-navy-800 hover:text-white">
        {{ busy ? "กำลังอัปโหลด..." : "+ เพิ่มรูป (เลือกได้หลายรูป)" }}<input type="file" multiple class="hidden" accept=".jpg,.jpeg,.png,.webp,.gif" @change="pick($event, (p) => set([...(modelValue || []), ...p]))" />
      </label>
    </div>

    <!-- list ของกลุ่มฟิลด์ -->
    <div v-else-if="field.type === 'list'" class="mt-1 space-y-3">
      <div v-for="(row, i) in modelValue || []" :key="i" class="space-y-3 rounded-2xl bg-sky-soft p-4">
        <CmsField v-for="f in field.fields" :key="f.name" :field="f" :model-value="row[f.name]" :auth-headers="authHeaders"
          @update:model-value="set((modelValue || []).map((r: any, k: number) => (k === i ? { ...r, [f.name]: $event } : r)))" />
        <button type="button" class="text-xs text-red-600 hover:underline" @click="set((modelValue || []).filter((_: any, k: number) => k !== i))">ลบแถวนี้</button>
      </div>
      <button type="button" class="rounded-full border border-navy-800 px-4 py-1.5 text-xs text-navy-800 hover:bg-navy-800 hover:text-white" @click="set([...(modelValue || []), newRow()])">+ เพิ่มรายการ</button>
    </div>

    <p v-if="field.hint" class="mt-1 text-xs text-slate-500">{{ field.hint }}</p>
    <p v-if="err" class="mt-1 text-xs text-red-700">{{ err }}</p>
  </div>
</template>
