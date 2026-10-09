<script setup lang="ts">
import { Images } from "lucide-vue-next";

useHead({ title: "อัลบั้มรูป · VPP" });

const asset = useAsset();
const { data } = await useAsyncData("albums", () => queryCollection("albums").order("date", "DESC").all());
const slugOf = (stem: string) => stem.replace(/^albums\//, "");
const thumb = (a: { cover?: string; photos: string[] }) => a.cover || a.photos[0];
const fmt = (d: string) => new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
</script>

<template>
  <SiteHeader />
  <main class="mx-auto w-full max-w-6xl px-5 py-12">
    <h1 class="flex items-center gap-2 text-3xl font-bold text-navy-800"><Images class="text-brand" />อัลบั้มรูป</h1>
    <p class="mt-2 text-slate-600">ภาพบรรยากาศการอบรมแต่ละรุ่น</p>

    <ul v-if="data?.length" class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="a in data" :key="a.stem">
        <NuxtLink :to="`/albums/${slugOf(a.stem)}`" class="block overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md">
          <img v-if="thumb(a)" :src="asset(thumb(a)!)" :alt="a.title" loading="lazy" class="aspect-[4/3] w-full object-cover" />
          <div v-else class="flex aspect-[4/3] w-full items-center justify-center bg-sky-card"><Images class="size-10 text-navy-700/40" /></div>
          <div class="p-4">
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span v-if="a.cohort" class="rounded-full bg-brand px-2.5 py-0.5 font-semibold text-white">{{ a.cohort }}</span>
              {{ fmt(a.date) }} · {{ a.photos.length }} รูป
            </div>
            <h2 class="mt-2 font-bold text-navy-800">{{ a.title }}</h2>
          </div>
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="mt-8 text-sm text-slate-500">ยังไม่มีอัลบั้ม</p>
  </main>
  <SiteFooter />
</template>
