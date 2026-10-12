<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";

const members = useRuntimeConfig().public.membersEnabled;
// ปุ่ม "สมัครเรียน": เลือกรุ่นจากรุ่นที่เปิดรับสมัครอยู่ (แก้รุ่นในแอดมินแล้วเปลี่ยนตามทันที)
const cohorts = members ? useCohortList() : computed(() => []);
const openCohorts = computed(() => cohorts.value.filter((c) => c.status === "open"));
const applyLink = (id: string) => `/apply?cohort=${encodeURIComponent(id)}`;
const applyTo = computed(() => (!members ? "/#contact" : openCohorts.value.length === 1 ? applyLink(openCohorts.value[0]!.id) : "/apply"));

const menu = ref(false);
const box = ref<HTMLElement>();
const route = useRoute();
watch(() => route.fullPath, () => (menu.value = false));
function onDoc(e: MouseEvent) {
  if (menu.value && box.value && !box.value.contains(e.target as Node)) menu.value = false;
}
onMounted(() => document.addEventListener("click", onDoc));
onBeforeUnmount(() => document.removeEventListener("click", onDoc));
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-sky-card bg-white/90 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
      <NuxtLink to="/" class="flex items-center gap-3">
        <span class="text-2xl font-bold text-navy-800">VPP</span>
        <span class="hidden text-[11px] leading-tight text-slate-500 sm:block">
          Training &amp; Competency System<br />for Veterinary Hospital
        </span>
      </NuxtLink>
      <nav class="flex items-center gap-5 text-sm">
        <NuxtLink to="/" class="text-navy-800 hover:text-brand">หน้าแรก</NuxtLink>
        <NuxtLink to="/about" class="hidden text-navy-800 hover:text-brand md:inline">เกี่ยวกับ VPP</NuxtLink>
        <NuxtLink to="/collaboration" class="hidden text-navy-800 hover:text-brand md:inline">ความร่วมมือ</NuxtLink>
        <NuxtLink to="/albums" class="hidden text-navy-800 hover:text-brand md:inline">อัลบั้มรูป</NuxtLink>
        <NuxtLink to="/articles" class="text-navy-800 hover:text-brand">บทความ</NuxtLink>
        <MemberLink />
        <div v-if="openCohorts.length > 1" ref="box" class="relative">
          <button type="button" class="btn-brand px-4 py-2 text-sm" :aria-expanded="menu" @click="menu = !menu">
            <span class="flex items-center gap-1 whitespace-nowrap">สมัครเรียน<ChevronDown class="size-4 transition" :class="menu && 'rotate-180'" /></span>
          </button>
          <div v-if="menu" class="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-sky-card">
            <p class="px-4 pt-3 text-xs text-slate-500">เลือกรุ่นที่ต้องการสมัคร</p>
            <NuxtLink v-for="c in openCohorts" :key="c.id" :to="applyLink(c.id)" class="block px-4 py-2.5 hover:bg-sky-soft">
              <b class="text-navy-800">{{ c.name }}</b>
              <span v-if="c.dates" class="block text-xs text-slate-500">{{ c.dates }}</span>
            </NuxtLink>
            <NuxtLink to="/apply" class="block border-t border-sky-card px-4 py-2.5 text-xs text-navy-800 hover:bg-sky-soft">ใบสมัครของฉัน →</NuxtLink>
          </div>
        </div>
        <NuxtLink v-else :to="applyTo" class="btn-brand px-4 py-2 text-sm">สมัครเรียน</NuxtLink>
      </nav>
    </div>
  </header>
</template>
