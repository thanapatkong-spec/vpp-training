<script setup lang="ts">
// รูป/ข้อความตอนแชร์ลิงก์เว็บ (Facebook, LINE ฯลฯ) — หน้าบทความที่มีรูปปกจะใช้รูปปกแทน
const site = useRuntimeConfig().public.siteUrl.replace(/\/$/, "");
const route = useRoute();
const desc = "หลักสูตรผู้ช่วยสัตวแพทย์ด้านการพยาบาลสัตว์ สร้างทีมที่มีพื้นฐาน ลดภาระการสอนงาน ยกระดับมาตรฐานโรงพยาบาลสัตว์";
useSeoMeta({
  ogType: "website",
  ogSiteName: "VPP · Training & Competency System for Veterinary Hospital",
  ogTitle: "VPP · ระบบฝึกอบรมและประเมินสมรรถนะสำหรับทีมโรงพยาบาลสัตว์",
  ogDescription: desc,
  ogUrl: () => site + route.path,
  ogImage: `${site}/og-image.jpg`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: "VPP ระบบฝึกอบรมและประเมินสมรรถนะสำหรับทีมโรงพยาบาลสัตว์",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <NuxtPage />
  </div>
</template>
