<script setup lang="ts">
useHead({ title: "สมัครสมาชิก · VPP" });
const config = useRuntimeConfig();
const auth = useAuthClient();
const nextQ = String(useRoute().query.next || "");
const nextUrl = nextQ.startsWith("/") && !nextQ.startsWith("//") ? nextQ : "/account";

const name = ref("");
const email = ref("");
const password = ref("");
const consent = ref(false);
const pending = ref(false);
const error = ref("");
const sentTo = ref("");

async function submit() {
  error.value = "";
  if (!consent.value) return (error.value = "กรุณายอมรับนโยบายความเป็นส่วนตัว");
  pending.value = true;
  const { error: err } = await auth.signUp.email({ name: name.value.trim(), email: email.value.trim(), password: password.value });
  pending.value = false;
  if (err) return (error.value = /exist|already/i.test(`${err.code} ${err.message}`) ? "อีเมลนี้มีบัญชีอยู่แล้ว หากเป็นสมาชิกที่แอดมินสร้างไว้ให้ ใช้ลิงก์เปิดใช้งานบัญชีที่แอดมินส่งให้ หรือเข้าสู่ระบบด้วย Google" : err.message || "สมัครสมาชิกไม่สำเร็จ");
  // ถ้าระบบบังคับยืนยันอีเมล จะยังไม่ได้ล็อกอิน
  const { data } = await auth.getSession();
  if (data) return navigateTo(nextUrl);
  sentTo.value = email.value;
}

const google = () => auth.signIn.social({ provider: "google", callbackURL: nextUrl });
</script>

<template>
  <SiteHeader />
  <main class="px-5 py-12">
    <div class="auth-card">
      <template v-if="sentTo">
        <h1 class="text-2xl font-bold text-navy-800">ตรวจอีเมลของคุณ</h1>
        <p class="mt-3 text-sm text-slate-600">เราส่งลิงก์ยืนยันไปที่ <b>{{ sentTo }}</b> กดลิงก์ในอีเมลเพื่อเริ่มใช้งานบัญชี แล้วกลับมาเข้าสู่ระบบ</p>
        <NuxtLink to="/login" class="btn-brand mt-6 w-full px-6 py-3 text-sm">ไปหน้าเข้าสู่ระบบ</NuxtLink>
      </template>
      <template v-else>
        <h1 class="text-2xl font-bold text-navy-800">สมัครสมาชิก</h1>
        <p class="mt-1 text-sm text-slate-600">สำหรับผู้ที่เคยเรียนกับเรา เพื่อดาวน์โหลดใบประกาศนียบัตร</p>

        <button v-if="config.public.googleLogin" type="button" class="mt-6 w-full rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-semibold text-navy-800 hover:border-brand" @click="google">สมัครด้วย Google</button>
        <p v-if="config.public.googleLogin" class="my-4 text-center text-xs text-slate-400">หรือสมัครด้วยอีเมล</p>

        <form class="mt-5 space-y-3" @submit.prevent="submit">
          <input id="name" v-model="name" class="field" placeholder="ชื่อ-นามสกุล *" required autocomplete="name" />
          <input id="email" v-model="email" type="email" class="field" placeholder="อีเมล *" required autocomplete="email" />
          <input id="password" v-model="password" type="password" class="field" placeholder="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร) *" minlength="8" required autocomplete="new-password" />
          <label class="flex items-start gap-2 px-1 text-xs text-slate-600">
            <input v-model="consent" type="checkbox" class="mt-0.5 accent-brand" />
            <span>ข้าพเจ้ายอมรับ <NuxtLink to="/privacy" target="_blank" class="text-brand-dark underline">นโยบายความเป็นส่วนตัว</NuxtLink> และยินยอมให้เก็บข้อมูลเพื่อยืนยันตัวตนและออกใบประกาศนียบัตร</span>
          </label>
          <p v-if="error" class="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{{ error }}</p>
          <button :disabled="pending" class="btn-brand w-full py-3 disabled:opacity-60">{{ pending ? "กำลังสมัคร..." : "สมัครสมาชิก" }}</button>
        </form>
        <p class="mt-5 text-center text-sm text-slate-600">มีบัญชีแล้ว? <NuxtLink to="/login" class="font-semibold text-brand-dark">เข้าสู่ระบบ</NuxtLink></p>
      </template>
    </div>
  </main>
  <SiteFooter />
</template>
