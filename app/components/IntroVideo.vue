<script setup lang="ts">
// วิดีโอแนะนำการเรียน (หน้าแรก) — ตั้งค่าที่ ตั้งค่าเว็บไซต์ > วิดีโอแนะนำ: ไฟล์ .mp4 หรือ ลิงก์ YouTube
const props = defineProps<{ url: string; title: string }>();
const asset = useAsset();
const youtube = computed(() => {
  const m = props.url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0` : "";
});
const src = computed(() => (youtube.value ? "" : asset(props.url)));
const poster = computed(() => (/^\/videos\/.+\.mp4$/i.test(props.url) ? asset(props.url.replace(/\.mp4$/i, ".jpg")) : undefined));
</script>

<template>
  <div class="aspect-video w-full overflow-hidden rounded-3xl bg-navy-900 shadow-xl">
    <iframe v-if="youtube" :src="youtube" :title="title" class="size-full" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen />
    <video v-else :src="src" :poster="poster" controls playsinline preload="none" class="size-full bg-black object-contain" :aria-label="title" />
  </div>
</template>
