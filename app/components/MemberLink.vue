<script setup lang="ts">
const config = useRuntimeConfig();
const sessionState = useAuthClient().useSession();
const session = computed(() => sessionState.value.data);
const name = computed(() => session.value?.user.name?.trim() || session.value?.user.email || "");
const initial = computed(() => name.value.charAt(0).toUpperCase());
</script>

<template>
  <ClientOnly v-if="config.public.membersEnabled">
    <!-- ล็อกอินแล้ว: แสดงชื่อบัญชี (กดไปหน้าบัญชีของฉัน) -->
    <NuxtLink v-if="session" to="/account" :title="`${name} · ${session.user.email}`"
      class="flex max-w-[11rem] items-center gap-2 rounded-full border border-sky-card bg-white p-1 sm:pr-3 text-navy-800 hover:border-brand hover:text-brand">
      <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-white">{{ initial }}</span>
      <span class="hidden truncate sm:inline">{{ name }}</span>
    </NuxtLink>
    <NuxtLink v-else to="/login" class="text-navy-800 hover:text-brand">เข้าสู่ระบบ</NuxtLink>
  </ClientOnly>
</template>
