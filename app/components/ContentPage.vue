<script setup lang="ts">
// หน้าเนื้อหาคงที่จาก content/pages/<slug>.md
const props = defineProps<{ slug: string }>();
const asset = useAsset();
const { data: page } = await useAsyncData(`page-${props.slug}`, () =>
  queryCollection("pages").path(`/pages/${props.slug}`).first(),
);
if (!page.value) throw createError({ statusCode: 404, statusMessage: "ไม่พบหน้านี้", fatal: true });
useHead({ title: `${page.value.title} · VPP` });
</script>

<template>
  <SiteHeader />
  <main v-if="page">
    <section class="bg-gradient-to-br from-navy-900 to-navy-700 py-12 text-white">
      <div class="mx-auto max-w-3xl px-5">
        <h1 class="text-3xl font-bold md:text-4xl">{{ page.title }}</h1>
        <p v-if="page.description" class="mt-3 text-sky-card">{{ page.description }}</p>
      </div>
    </section>
    <article class="mx-auto w-full max-w-3xl px-5 py-10">
      <img v-if="page.cover" :src="asset(page.cover)" :alt="page.title" class="mb-8 w-full rounded-2xl" />
      <div class="prose-vpp"><ContentRenderer :value="page" /></div>
      <div class="mt-10 rounded-2xl bg-sky-soft p-6 text-center">
        <p class="font-semibold text-navy-800">สนใจสมัครเรียนหรืออยากสอบถามเพิ่มเติม?</p>
        <NuxtLink to="/#contact" class="btn-brand mt-3 px-6 py-2.5 text-sm">ติดต่อทีมงาน</NuxtLink>
      </div>
    </article>
  </main>
  <SiteFooter />
</template>
