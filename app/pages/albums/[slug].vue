<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-vue-next";

const route = useRoute();
const asset = useAsset();
const slug = String(route.params.slug);
const { data: album } = await useAsyncData(`album-${slug}`, () =>
  queryCollection("albums").where("stem", "=", `albums/${slug}`).first(),
);
if (!album.value) throw createError({ statusCode: 404, statusMessage: "ไม่พบอัลบั้ม", fatal: true });
useHead({ title: `${album.value.title} · VPP` });

const photos = computed(() => album.value?.photos ?? []);
const date = new Date(album.value.date).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });

// lightbox
const open = ref<number | null>(null);
const go = (d: number) => {
  if (open.value === null || !photos.value.length) return;
  open.value = (open.value + d + photos.value.length) % photos.value.length;
};
const onKey = (e: KeyboardEvent) => {
  if (open.value === null) return;
  if (e.key === "Escape") open.value = null;
  else if (e.key === "ArrowLeft") go(-1);
  else if (e.key === "ArrowRight") go(1);
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <SiteHeader />
  <main v-if="album" class="mx-auto w-full max-w-6xl px-5 py-12">
    <NuxtLink to="/albums" class="flex items-center gap-1 text-sm text-navy-800"><ArrowLeft class="size-4" />อัลบั้มทั้งหมด</NuxtLink>
    <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span v-if="album.cohort" class="rounded-full bg-brand px-2.5 py-0.5 font-semibold text-white">{{ album.cohort }}</span>
      {{ date }} · {{ photos.length }} รูป
    </div>
    <h1 class="mt-2 text-3xl font-bold text-navy-800">{{ album.title }}</h1>
    <p v-if="album.description" class="mt-2 max-w-2xl text-slate-600">{{ album.description }}</p>

    <ul v-if="photos.length" class="mt-8 grid gap-3" :class="album.layout === 'wide' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'">
      <li v-for="(p, i) in photos" :key="p">
        <button type="button" class="block w-full overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md" :aria-label="`ดูรูปที่ ${i + 1}`" @click="open = i">
          <img :src="asset(p)" :alt="`${album.title} รูปที่ ${i + 1}`" loading="lazy" class="w-full object-cover" :class="album.layout === 'wide' ? 'aspect-video' : 'aspect-square'" />
        </button>
      </li>
    </ul>
    <p v-else class="mt-8 text-sm text-slate-500">อัลบั้มนี้ยังไม่มีรูป</p>

    <div v-if="open !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" @click.self="open = null">
      <button type="button" class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="ปิด" @click="open = null"><X class="size-6" /></button>
      <button v-if="photos.length > 1" type="button" class="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="รูปก่อนหน้า" @click="go(-1)"><ChevronLeft class="size-7" /></button>
      <img :src="asset(photos[open]!)" :alt="`${album.title} รูปที่ ${open + 1}`" class="max-h-full max-w-full rounded-lg object-contain" />
      <button v-if="photos.length > 1" type="button" class="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="รูปถัดไป" @click="go(1)"><ChevronRight class="size-7" /></button>
      <div class="absolute bottom-4 text-sm text-white/80">{{ open + 1 }} / {{ photos.length }}</div>
    </div>
  </main>
  <SiteFooter />
</template>
