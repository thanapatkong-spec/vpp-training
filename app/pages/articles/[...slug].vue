<script setup lang="ts">
import { ArrowLeft, Download, FileText } from "lucide-vue-next";

const route = useRoute();
const { data: page } = await useAsyncData(route.path, () => queryCollection("articles").path(route.path).first());
if (!page.value) throw createError({ statusCode: 404, statusMessage: "ไม่พบบทความ", fatal: true });
useHead({ title: `${page.value.title} · VPP` });
const asset = useAsset();
const ext = (p: string) => (p.split(".").pop() ?? "").toUpperCase();
const date = new Date(page.value.date).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
</script>

<template>
  <SiteHeader />
  <main class="mx-auto w-full max-w-3xl px-5 py-12">
    <NuxtLink to="/articles" class="flex items-center gap-1 text-sm text-navy-800"><ArrowLeft class="size-4" />บทความทั้งหมด</NuxtLink>
    <article v-if="page" class="mt-5">
      <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span v-if="page.cohort" class="rounded-full bg-brand px-2.5 py-0.5 font-semibold text-white">{{ page.cohort }}</span>
        {{ date }}
      </div>
      <h1 class="mt-3 text-3xl font-bold text-navy-800">{{ page.title }}</h1>
      <img v-if="page.cover" :src="asset(page.cover)" :alt="page.title" class="mt-5 w-full rounded-2xl" />
      <div class="prose-vpp mt-6"><ContentRenderer :value="page" /></div>
      <section v-if="page.files?.length" class="mt-10">
        <h2 class="flex items-center gap-2 text-xl font-bold text-navy-800"><FileText class="text-brand" />เอกสารดาวน์โหลด</h2>
        <ul class="mt-3 space-y-2">
          <li v-for="f in page.files" :key="f.path">
            <a :href="asset(f.path)" download class="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm hover:shadow-md">
              <span class="min-w-0">
                <span class="block font-semibold text-navy-800">{{ f.title }}</span>
                <span v-if="f.note" class="block text-xs text-slate-500">{{ f.note }}</span>
              </span>
              <span class="flex shrink-0 items-center gap-2 text-sm text-brand-dark"><span class="rounded bg-sky-card px-2 py-0.5 text-xs font-semibold text-navy-800">{{ ext(f.path) }}</span><Download class="size-4" /></span>
            </a>
          </li>
        </ul>
      </section>
    </article>
  </main>
  <SiteFooter />
</template>
