<script setup lang="ts">
import { BookOpen } from "lucide-vue-next";

useHead({ title: "บทความ · VPP" });

const { data } = await useAsyncData("articles", () =>
  queryCollection("articles").order("date", "DESC").all().then((r) => r.filter((a) => !a.draft)),
);
const cohorts = computed(() => [...new Set((data.value ?? []).map((a) => a.cohort).filter(Boolean))] as string[]);
const active = ref("");
const list = computed(() => (data.value ?? []).filter((a) => !active.value || a.cohort === active.value));
const fmt = (d: string) => new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
</script>

<template>
  <SiteHeader />
  <main class="mx-auto w-full max-w-4xl px-5 py-12">
    <h1 class="flex items-center gap-2 text-3xl font-bold text-navy-800"><BookOpen class="text-brand" />บทความ</h1>
    <p class="mt-2 text-slate-600">เนื้อหาและสรุปการอบรมของแต่ละรุ่น</p>

    <div v-if="cohorts.length" class="mt-6 flex flex-wrap gap-2 text-sm">
      <button
        v-for="c in ['', ...cohorts]" :key="c"
        class="rounded-full border px-4 py-1.5"
        :class="active === c ? 'border-navy-800 bg-navy-800 text-white' : 'border-sky-card bg-white text-navy-800'"
        @click="active = c"
      >{{ c || "ทั้งหมด" }}</button>
    </div>

    <ul class="mt-6 space-y-4">
      <li v-for="a in list" :key="a.path">
        <NuxtLink :to="a.path" class="block rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
          <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span v-if="a.cohort" class="rounded-full bg-brand px-2.5 py-0.5 font-semibold text-white">{{ a.cohort }}</span>
            {{ fmt(a.date) }}
          </div>
          <h2 class="mt-2 text-lg font-bold text-navy-800">{{ a.title }}</h2>
          <p v-if="a.description" class="mt-1 text-sm text-slate-600">{{ a.description }}</p>
        </NuxtLink>
      </li>
    </ul>
    <p v-if="!list.length" class="mt-6 text-sm text-slate-500">ยังไม่มีบทความที่เผยแพร่</p>
  </main>
  <SiteFooter />
</template>
