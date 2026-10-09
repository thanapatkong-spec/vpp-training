<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";

const route = useRoute();
const { data: page } = await useAsyncData(route.path, () => queryCollection("articles").path(route.path).first());
if (!page.value) throw createError({ statusCode: 404, statusMessage: "ไม่พบบทความ", fatal: true });
useHead({ title: `${page.value.title} · VPP` });
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
      <div class="prose-vpp mt-6"><ContentRenderer :value="page" /></div>
    </article>
  </main>
  <SiteFooter />
</template>
