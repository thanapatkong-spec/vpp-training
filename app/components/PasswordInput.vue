<script setup lang="ts">
import { Eye, EyeOff } from "lucide-vue-next";

// ช่องรหัสผ่านพร้อมปุ่มแสดง/ซ่อน — attribute อื่น (id, placeholder, autocomplete, minlength…) ส่งต่อให้ <input>
defineOptions({ inheritAttrs: false });
defineProps<{ wrapClass?: string }>();
const model = defineModel<string>({ default: "" });
const show = ref(false);
</script>

<template>
  <div class="relative" :class="wrapClass">
    <input v-model="model" v-bind="$attrs" :type="show ? 'text' : 'password'" class="field pr-12" />
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-full text-slate-400 hover:text-brand"
      :aria-label="show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
      :title="show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
      @click="show = !show"
    >
      <EyeOff v-if="show" class="h-5 w-5" />
      <Eye v-else class="h-5 w-5" />
    </button>
  </div>
</template>
