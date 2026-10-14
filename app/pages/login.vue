<script setup lang="ts">
useHead({ title: "เข้าสู่ระบบ · VPP" });
const config = useRuntimeConfig();
const auth = useAuthClient();
const route = useRoute();
const nextQ = String(route.query.next || "");
const nextUrl = nextQ.startsWith("/") && !nextQ.startsWith("//") ? nextQ : "/";
// ล็อกอินอยู่แล้ว (หรือเพิ่งล็อกอินสำเร็จ) → ออกจากหน้านี้ทันที
const sessionState = auth.useSession();
let leaving = false;
const leave = () => {
  if (leaving) return;
  leaving = true;
  navigateTo(nextUrl, { replace: true });
  // สำรอง: ถ้าการเปลี่ยนหน้าค้าง ให้โหลดหน้าใหม่ตรง ๆ
  setTimeout(() => { if (route.path.startsWith("/login")) window.location.replace(config.app.baseURL.replace(/\/$/, "") + nextUrl); }, 2500);
};
watch(() => sessionState.value.data, (d) => { if (d) leave(); }, { immediate: true });

const email = ref("");
const password = ref("");
const pending = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  pending.value = true;
  const { error: err } = await auth.signIn.email({ email: email.value.trim(), password: password.value });
  if (err) {
    pending.value = false;
    error.value =
      err.code === "EMAIL_NOT_VERIFIED" ? "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (ตรวจลิงก์ในอีเมลที่เราส่งให้)"
      : err.status === 401 ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
      : err.code === "INVALID_ORIGIN" ? "ระบบยังไม่รองรับการเข้าสู่ระบบจากที่อยู่เว็บนี้ กรุณาแจ้งทีมงาน"
      : "เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง";
    return;
  }
  leave(); // ปุ่มยังแสดง "กำลังเข้าสู่ระบบ..." จนกว่าจะเปลี่ยนหน้า
}

const google = () => auth.signIn.social({ provider: "google", callbackURL: nextUrl });
</script>

<template>
  <SiteHeader />
  <main class="px-5 py-12">
    <div class="auth-card">
      <h1 class="text-2xl font-bold text-navy-800">เข้าสู่ระบบ</h1>
      <button v-if="config.public.googleLogin" type="button" class="mt-6 w-full rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-semibold text-navy-800 hover:border-brand" @click="google">เข้าสู่ระบบด้วย Google</button>
      <p v-if="config.public.googleLogin" class="my-4 text-center text-xs text-slate-400">หรือใช้อีเมล</p>
      <form class="mt-5 space-y-3" @submit.prevent="submit">
        <input id="email" v-model="email" type="email" class="field" placeholder="อีเมล" required autocomplete="email" />
        <PasswordInput id="password" v-model="password" placeholder="รหัสผ่าน" required autocomplete="current-password" />
        <p v-if="error" class="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{{ error }}</p>
        <button :disabled="pending" class="btn-brand w-full py-3 disabled:opacity-60">{{ pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ" }}</button>
      </form>
      <div class="mt-5 flex justify-between text-sm text-slate-600">
        <NuxtLink to="/forgot-password" class="text-brand-dark">ลืมรหัสผ่าน?</NuxtLink>
        <NuxtLink to="/signup" class="font-semibold text-brand-dark">สมัครสมาชิก</NuxtLink>
      </div>
    </div>
  </main>
  <SiteFooter />
</template>
