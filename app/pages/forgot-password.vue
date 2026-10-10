<script setup lang="ts">
useHead({ title: "ลืมรหัสผ่าน · VPP" });
const auth = useAuthClient();
const email = ref("");
const pending = ref(false);
const sent = ref(false);

async function submit() {
  pending.value = true;
  await auth.requestPasswordReset({ email: email.value.trim(), redirectTo: "/reset-password" });
  pending.value = false;
  sent.value = true; // ไม่บอกว่าอีเมลนี้มีในระบบหรือไม่
}
</script>

<template>
  <SiteHeader />
  <main class="px-5 py-12">
    <div class="auth-card">
      <h1 class="text-2xl font-bold text-navy-800">ลืมรหัสผ่าน</h1>
      <p v-if="sent" class="mt-4 text-sm text-slate-600">หากอีเมลนี้มีบัญชีอยู่ เราส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจอีเมล</p>
      <form v-else class="mt-5 space-y-3" @submit.prevent="submit">
        <input id="email" v-model="email" type="email" class="field" placeholder="อีเมลที่ใช้สมัคร" required autocomplete="email" />
        <button :disabled="pending" class="btn-brand w-full py-3 disabled:opacity-60">{{ pending ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่" }}</button>
      </form>
      <NuxtLink to="/login" class="mt-5 block text-center text-sm text-brand-dark">กลับไปเข้าสู่ระบบ</NuxtLink>
    </div>
  </main>
  <SiteFooter />
</template>
