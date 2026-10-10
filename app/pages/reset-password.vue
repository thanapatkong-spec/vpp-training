<script setup lang="ts">
useHead({ title: "ตั้งรหัสผ่านใหม่ · VPP" });
const auth = useAuthClient();
const token = useRoute().query.token as string | undefined;
const password = ref("");
const pending = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  pending.value = true;
  const { error: err } = await auth.resetPassword({ newPassword: password.value, token });
  pending.value = false;
  if (err) return (error.value = "ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่");
  await navigateTo("/login");
}
</script>

<template>
  <SiteHeader />
  <main class="px-5 py-12">
    <div class="auth-card">
      <h1 class="text-2xl font-bold text-navy-800">ตั้งรหัสผ่านใหม่</h1>
      <p v-if="!token" class="mt-4 text-sm text-red-700">ลิงก์ไม่ถูกต้อง <NuxtLink to="/forgot-password" class="underline">ขอลิงก์ใหม่</NuxtLink></p>
      <form v-else class="mt-5 space-y-3" @submit.prevent="submit">
        <input id="password" v-model="password" type="password" class="field" placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)" minlength="8" required autocomplete="new-password" />
        <p v-if="error" class="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{{ error }}</p>
        <button :disabled="pending" class="btn-brand w-full py-3 disabled:opacity-60">{{ pending ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่" }}</button>
      </form>
    </div>
  </main>
  <SiteFooter />
</template>
