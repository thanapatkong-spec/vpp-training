<script setup lang="ts">
const config = useRuntimeConfig();
const sessionState = useAuthClient().useSession();
const session = computed(() => sessionState.value.data);
</script>

<template>
  <ClientOnly v-if="config.public.membersEnabled">
    <NuxtLink v-if="session" to="/account" class="text-navy-800 hover:text-brand">บัญชีของฉัน</NuxtLink>
    <NuxtLink v-else to="/login" class="text-navy-800 hover:text-brand">เข้าสู่ระบบ</NuxtLink>
  </ClientOnly>
</template>
