<script setup lang="ts">
import { ArrowLeft, CheckCircle2, Landmark, Upload } from "lucide-vue-next";
import { BANK, COHORT, PACKAGES, baht, type PackageId } from "#shared/config";

useHead({ title: "สมัครเรียนและชำระเงิน · VPP" });

const q = useRoute().query.package;
const pkg = ref<PackageId>(q === "theory" || q === "practical" ? q : "bundle");
const price = computed(() => PACKAGES.find((p) => p.id === pkg.value)!.price);

const fileName = ref("");
const pending = ref(false);
const done = ref(false);
const error = ref("");
const fieldErrors = ref<Record<string, string>>({});

const input = "w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm outline-none focus:border-brand";

async function submit(e: Event) {
  error.value = "";
  fieldErrors.value = {};
  pending.value = true;
  try {
    await $fetch("/api/register", { method: "POST", body: new FormData(e.target as HTMLFormElement) });
    done.value = true;
    window.scrollTo({ top: 0 });
  } catch (err: any) {
    fieldErrors.value = err?.data?.data?.fieldErrors ?? {};
    error.value = Object.keys(fieldErrors.value).length ? "" : err?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่";
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen">
    <div class="bg-gradient-to-br from-navy-900 to-navy-700 pb-16 pt-10 text-white">
      <div class="mx-auto max-w-3xl px-5">
        <NuxtLink to="/" class="flex items-center gap-1 text-sm text-sky-card"><ArrowLeft class="size-4" />กลับหน้าหลัก</NuxtLink>
        <h1 class="mt-4 text-3xl font-bold">สมัครเรียนและชำระเงิน</h1>
      </div>
    </div>

    <div class="mx-auto -mt-8 max-w-3xl px-5 pb-16">
      <div v-if="done" class="rounded-3xl bg-white p-10 text-center shadow-lg">
        <CheckCircle2 class="mx-auto size-14 text-ok" />
        <h2 class="mt-4 text-2xl font-bold text-navy-800">ส่งใบสมัครเรียบร้อยแล้ว</h2>
        <p class="mt-2 text-sm text-slate-600">ทีมงานจะตรวจสอบสลิปและติดต่อกลับทางอีเมล/Line ภายใน 1–2 วันทำการ</p>
        <NuxtLink to="/" class="btn-brand mt-6 px-6 py-3 text-sm">กลับหน้าหลัก</NuxtLink>
      </div>

      <form v-else class="space-y-6" @submit.prevent="submit">
        <section class="rounded-3xl bg-white p-7 shadow-md">
          <h2 class="mb-5 flex items-center gap-3 text-xl font-bold text-navy-800">
            <span class="flex size-9 items-center justify-center rounded-full bg-navy-800 text-base text-white">1</span>เลือกรุ่นและแพ็กเกจ
          </h2>
          <div class="mb-4 inline-block rounded-2xl border-2 border-brand bg-orange-50 px-5 py-3">
            <div class="font-bold text-navy-800">{{ COHORT.name }}</div>
            <div class="text-xs text-slate-600">{{ COHORT.registerLabel }}</div>
          </div>
          <div class="space-y-3">
            <label
              v-for="p in PACKAGES" :key="p.id"
              class="flex cursor-pointer items-center justify-between rounded-full border-2 px-5 py-3.5 text-sm"
              :class="pkg === p.id ? 'border-brand bg-orange-50' : 'border-slate-200'"
            >
              <span class="flex items-center gap-3">
                <input v-model="pkg" type="radio" name="packageId" :value="p.id" class="accent-brand" />{{ p.label }}
              </span>
              <b class="text-navy-800">{{ baht(p.price) }} ฿</b>
            </label>
          </div>
        </section>

        <section class="rounded-3xl bg-white p-7 shadow-md">
          <h2 class="mb-5 flex items-center gap-3 text-xl font-bold text-navy-800">
            <span class="flex size-9 items-center justify-center rounded-full bg-navy-800 text-base text-white">2</span>ข้อมูลผู้สมัคร
          </h2>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <input name="fullName" placeholder="ชื่อ-นามสกุล *" :class="input" />
              <p v-if="fieldErrors.fullName" class="mt-1 px-4 text-xs text-red-600">{{ fieldErrors.fullName }}</p>
            </div>
            <div>
              <input name="phone" inputmode="tel" placeholder="เบอร์โทร *" :class="input" />
              <p v-if="fieldErrors.phone" class="mt-1 px-4 text-xs text-red-600">{{ fieldErrors.phone }}</p>
            </div>
            <div>
              <input name="email" type="email" placeholder="อีเมล *" :class="input" />
              <p v-if="fieldErrors.email" class="mt-1 px-4 text-xs text-red-600">{{ fieldErrors.email }}</p>
            </div>
            <div><input name="lineId" placeholder="Line ID" :class="input" /></div>
            <div class="md:col-span-2"><input name="workplace" placeholder="โรงพยาบาล/คลินิกที่สังกัด" :class="input" /></div>
          </div>
        </section>

        <section class="rounded-3xl bg-white p-7 shadow-md">
          <h2 class="mb-5 flex items-center gap-3 text-xl font-bold text-navy-800">
            <span class="flex size-9 items-center justify-center rounded-full bg-navy-800 text-base text-white">3</span>โอนเงินและแนบสลิป
          </h2>
          <div class="flex items-center justify-between gap-4 rounded-3xl bg-sky-card p-5">
            <div class="flex items-center gap-4">
              <Landmark class="size-9 text-navy-800" />
              <div>
                <div class="text-xs text-slate-600">{{ BANK.name }}</div>
                <div class="text-2xl font-bold text-navy-800">{{ BANK.number }}</div>
                <div class="text-xs text-slate-600">{{ BANK.holder }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-600">ยอดชำระ</div>
              <div class="text-2xl font-bold text-brand">{{ baht(price) }} ฿</div>
            </div>
          </div>
          <label class="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 p-8 text-sm text-slate-600 hover:border-brand">
            <Upload class="size-7 text-navy-800" />
            {{ fileName || "คลิกเพื่อแนบสลิป (รูปภาพ หรือ PDF ไม่เกิน 5MB)" }}
            <input
              type="file" name="slip" class="hidden" accept="image/jpeg,image/png,image/webp,application/pdf"
              @change="fileName = ($event.target as HTMLInputElement).files?.[0]?.name ?? ''"
            />
          </label>
          <p v-if="fieldErrors.slip" class="mt-1 px-4 text-xs text-red-600">{{ fieldErrors.slip }}</p>
        </section>

        <p v-if="error" class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</p>
        <button :disabled="pending" class="btn-brand w-full py-4 text-lg disabled:opacity-60">
          {{ pending ? "กำลังส่ง..." : "ยืนยันการสมัคร" }}
        </button>
      </form>
    </div>
  </main>
</template>
