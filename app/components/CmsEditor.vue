<script setup lang="ts">
import { CMS_COLLECTIONS, type CmsCollection } from "#shared/cms";

const props = defineProps<{ authHeaders: () => Record<string, string> | undefined }>();

type Item = { slug: string; title: string; sort: string | number | null; draft: boolean; sub?: string };
const col = ref<CmsCollection>(CMS_COLLECTIONS[0]!);
const items = ref<Item[]>([]);
const listErr = ref("");
const loading = ref(false);

const editing = ref<null | { slug: string; isNew: boolean; sha?: string }>(null);
const values = ref<Record<string, any>>({});
const newSlug = ref("");
const saving = ref(false);
const msg = ref<{ ok: boolean; text: string } | null>(null);

async function loadList() {
  loading.value = true;
  listErr.value = "";
  items.value = [];
  try {
    items.value = await $fetch<Item[]>(`/api/manage/cms/${col.value.name}`, { headers: props.authHeaders() });
  } catch (e: any) {
    listErr.value = e?.data?.message || "โหลดรายการไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}
function pickCol(c: CmsCollection) {
  col.value = c;
  editing.value = null;
  msg.value = null;
  loadList();
}
function blank() {
  const v: Record<string, any> = {};
  for (const f of col.value.fields) v[f.name] = f.default ?? (f.type === "images" || f.type === "list" ? [] : f.type === "date" ? new Date().toISOString().slice(0, 10) : "");
  return v;
}
function startNew() {
  editing.value = { slug: "", isNew: true };
  newSlug.value = "";
  values.value = blank();
  msg.value = null;
}
async function open(slug: string) {
  msg.value = null;
  try {
    const r = await $fetch<{ sha: string; values: Record<string, any> }>(`/api/manage/cms/${col.value.name}/${slug}`, { headers: props.authHeaders() });
    values.value = { ...blank(), ...r.values };
    editing.value = { slug, isNew: false, sha: r.sha };
  } catch (e: any) {
    msg.value = { ok: false, text: e?.data?.message || "เปิดไม่สำเร็จ" };
  }
}
const stamp = () => new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14).replace(/^(\d{8})/, "$1-");

async function save() {
  if (!editing.value) return;
  const e = editing.value;
  const slug = e.isNew ? newSlug.value.trim() || stamp() : e.slug;
  saving.value = true;
  msg.value = null;
  try {
    await $fetch(`/api/manage/cms/${col.value.name}/${slug}`, { method: "PUT", body: { values: values.value, sha: e.sha }, headers: props.authHeaders() });
    msg.value = { ok: true, text: "บันทึกแล้ว เว็บจะอัปเดตภายใน 1–3 นาที" };
    await loadList();
    await open(slug);
  } catch (ex: any) {
    msg.value = { ok: false, text: ex?.data?.message || "บันทึกไม่สำเร็จ" };
  } finally {
    saving.value = false;
  }
}
async function remove() {
  if (!editing.value || editing.value.isNew || !confirm("ลบรายการนี้ถาวร?")) return;
  try {
    await $fetch(`/api/manage/cms/${col.value.name}/${editing.value.slug}`, { method: "DELETE", headers: props.authHeaders() });
    editing.value = null;
    msg.value = { ok: true, text: "ลบแล้ว เว็บจะอัปเดตภายใน 1–3 นาที" };
    await loadList();
  } catch (ex: any) {
    msg.value = { ok: false, text: ex?.data?.message || "ลบไม่สำเร็จ" };
  }
}
onMounted(loadList);
</script>

<template>
  <div class="mt-6">
    <div class="flex flex-wrap gap-2 text-sm font-semibold">
      <button v-for="c in CMS_COLLECTIONS" :key="c.name" class="rounded-full px-4 py-1.5" :class="col.name === c.name ? 'bg-brand text-white' : 'bg-white text-navy-800 shadow-sm'" @click="pickCol(c)">{{ c.label }}</button>
    </div>

    <p v-if="msg && !editing" class="mt-4 rounded-2xl px-4 py-3 text-sm" :class="msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'">{{ msg.text }}</p>
    <p v-if="listErr" class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ listErr }}</p>

    <!-- รายการ -->
    <section v-if="!editing" class="mt-4 rounded-3xl bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-navy-800">{{ col.label }}</h2>
        <button v-if="col.kind === 'folder'" class="btn-brand px-5 py-2 text-sm" @click="startNew">+ เพิ่ม{{ col.singular }}</button>
      </div>
      <p v-if="loading" class="mt-4 text-sm text-slate-500">กำลังโหลด...</p>
      <ul v-else class="mt-4 divide-y divide-sky-card">
        <li v-for="it in items" :key="it.slug">
          <button class="flex w-full items-center justify-between gap-3 py-3 text-left hover:text-brand" @click="open(it.slug)">
            <span class="font-medium text-navy-800">{{ it.title }}<span v-if="it.draft" class="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">ฉบับร่าง</span></span>
            <span class="whitespace-nowrap text-xs text-slate-500">{{ it.sub ? it.sub + " · " : "" }}{{ it.sort ?? "" }}</span>
          </button>
        </li>
      </ul>
      <p v-if="!loading && !items.length && !listErr" class="mt-4 text-sm text-slate-500">ยังไม่มีรายการ</p>
    </section>

    <!-- ฟอร์มแก้ไข -->
    <section v-else class="mt-4 rounded-3xl bg-white p-6 shadow-sm">
      <button class="text-sm text-slate-500 hover:underline" @click="editing = null; msg = null">← กลับไปรายการ{{ col.label }}</button>
      <h2 class="mt-2 text-xl font-bold text-navy-800">{{ editing.isNew ? `เพิ่ม${col.singular || col.label}` : "แก้ไข" }}</h2>
      <div v-if="editing.isNew && col.name === 'articles'" class="mt-4">
        <label class="block text-sm font-semibold text-navy-800">ชื่อลิงก์ของบทความ (ไม่บังคับ)</label>
        <input v-model="newSlug" class="field mt-1 max-w-sm" placeholder="เช่น course-2570 (a-z 0-9 และ -)" />
        <p class="mt-1 text-xs text-slate-500">ใช้เป็นที่อยู่หน้า /articles/… เว้นว่าง = ตั้งให้อัตโนมัติ</p>
      </div>
      <div class="mt-4 space-y-5">
        <CmsField v-for="f in col.fields" :key="f.name" v-model="values[f.name]" :field="f" :auth-headers="authHeaders" />
      </div>
      <p v-if="msg" class="mt-4 rounded-2xl px-4 py-3 text-sm" :class="msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'">{{ msg.text }}</p>
      <div class="mt-5 flex flex-wrap items-center gap-3">
        <button :disabled="saving" class="btn-brand px-6 py-2.5 text-sm disabled:opacity-60" @click="save">{{ saving ? "กำลังบันทึก..." : "บันทึกและเผยแพร่" }}</button>
        <button v-if="!editing.isNew && col.kind === 'folder'" class="text-sm text-red-600 hover:underline" @click="remove">ลบ{{ col.singular }}นี้ถาวร</button>
      </div>
    </section>
  </div>
</template>
