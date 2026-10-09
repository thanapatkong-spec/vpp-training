<script setup lang="ts">
import { CONTACT } from "#shared/config";
</script>

<template>
  <footer class="mt-auto bg-navy-900 text-white">
    <div class="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
      <div>
        <div class="text-3xl font-bold">VPP</div>
        <p class="mt-2 text-sm text-sky-card">พัฒนาคน เพื่อยกระดับมาตรฐานโรงพยาบาลสัตว์</p>
      </div>
      <div class="text-sm">
        <div class="font-semibold">เหมาะสำหรับ</div>
        <ul class="mt-2 space-y-1 text-sky-card">
          <li>• พนักงานใหม่ของโรงพยาบาลสัตว์</li>
          <li>• ผู้ช่วยแพทย์ที่ต้องการเพิ่มทักษะ</li>
          <li>• โรงพยาบาลสัตว์/คลินิกที่ต้องการพัฒนาทีม</li>
        </ul>
      </div>
      <div class="text-sm">
        <div class="font-semibold">สอบถาม / สมัครเรียน</div>
        <ul class="mt-2 space-y-1 text-sky-card">
          <li>Line: {{ CONTACT.line }}</li>
          <li>{{ CONTACT.email }}</li>
          <li>{{ CONTACT.phone }}</li>
        </ul>
      </div>
    </div>
  </footer>
</template>
