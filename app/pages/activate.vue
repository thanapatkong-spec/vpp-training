<script setup lang="ts">
useHead({ title: "เปิดใช้งานบัญชี · VPP" });
const token = String(useRoute().query.token || "");
const info = ref<{ name: string; needsEmail: boolean; maskedEmail: string } | null>(null);
const loadError = ref("");
const email = ref("");
const password = ref("");
const confirm = ref("");
const consent = ref(false);
const pending = ref(false);
const error = ref("");
const done = ref(false);

onMounted(async () => {
  if (!token) return (loadError.value = "ลิงก์ไม่ถูกต้อง");
  try {
    info.value = await $fetch("/api/activate", { query: { token } });
  } catch (e: any) {
    loadError.value = e?.data?.message || "ลิงก์ไม่ถูกต้องหรือหมดอายุ";
  }
});

async function submit() {
  error.value = "";
  if (password.value !== confirm.value) return (error.value = "รหัสผ่านทั้งสองช่องไม่ตรงกัน");
  if (!consent.value) return (error.value = "กรุณายอมรับนโยบายความเป็นส่วนตัว");
  pending.value = true;
  try {
    await $fetch("/api/activate", { method: "POST", body: { token, password: password.value, email: email.value || undefined, consent: true } });
    done.value = true;
  } catch (e: any) {
    error.value = e?.data?.message || "เปิดใช้งานไม่สำเร็จ";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <SiteHeader />
  <main class="px-5 py-12">
    <div class="auth-card">
      <h1 class="text-2xl font-bold text-navy-800">เปิดใช้งานบัญชีสมาชิก</h1>
      <p v-if="loadError" class="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ loadError }}</p>
      <div v-else-if="done" class="mt-4">
        <p class="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">เปิดใช้งานบัญชีเรียบร้อยแล้ว เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ตั้งไว้</p>
        <NuxtLink to="/login" class="btn-brand mt-4 inline-block px-6 py-3 text-sm">ไปหน้าเข้าสู่ระบบ</NuxtLink>
      </div>
      <form v-else-if="info" class="mt-4 space-y-3" @submit.prevent="submit">
        <p class="text-sm text-slate-600">สวัสดีคุณ <b class="text-navy-800">{{ info.name }}</b><span v-if="!info.needsEmail"> · อีเมลของคุณ {{ info.maskedEmail }}</span><br />ตั้งรหัสผ่านเพื่อเริ่มใช้งานบัญชีนี้ (ดาวน์โหลดใบประกาศ ฯลฯ)</p>
        <input v-if="info.needsEmail" id="email" v-model="email" type="email" class="field" placeholder="อีเมลที่ใช้เข้าสู่ระบบ *" required autocomplete="email" />
        <input id="password" v-model="password" type="password" class="field" placeholder="ตั้งรหัสผ่าน (อย่างน้อย 8 ตัวอักษร) *" minlength="8" required autocomplete="new-password" />
        <input id="confirm" v-model="confirm" type="password" class="field" placeholder="ยืนยันรหัสผ่านอีกครั้ง *" minlength="8" required autocomplete="new-password" />
        <label class="flex items-start gap-2 text-xs text-slate-600">
          <input v-model="consent" type="checkbox" class="mt-0.5" />
          <span>ฉันได้อ่านและยอมรับ <NuxtLink to="/privacy" target="_blank" class="underline">นโยบายความเป็นส่วนตัว</NuxtLink></span>
        </label>
        <p v-if="error" class="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{{ error }}</p>
        <button :disabled="pending" class="btn-brand w-full py-3 disabled:opacity-60">{{ pending ? "กำลังบันทึก..." : "เปิดใช้งานบัญชี" }}</button>
      </form>
      <p v-else class="mt-4 text-sm text-slate-500">กำลังตรวจสอบลิงก์...</p>
    </div>
  </main>
  <SiteFooter />
</template>
