<template>
  <header class="sticky top-0 z-30 border-b border-sky-card bg-white/90 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
      <NuxtLink to="/" class="flex items-center gap-3">
        <span class="text-2xl font-bold text-navy-800">VPP</span>
        <span class="hidden text-[11px] leading-tight text-slate-500 sm:block">
          Training &amp; Competency System<br />for Veterinary Hospital
        </span>
      </NuxtLink>
      <nav class="flex items-center gap-5 text-sm">
        <NuxtLink to="/about" class="hidden text-navy-800 hover:text-brand md:inline">เกี่ยวกับ VPP</NuxtLink>
        <NuxtLink to="/collaboration" class="hidden text-navy-800 hover:text-brand md:inline">ความร่วมมือ</NuxtLink>
        <NuxtLink to="/albums" class="hidden text-navy-800 hover:text-brand md:inline">อัลบั้มรูป</NuxtLink>
        <NuxtLink to="/articles" class="text-navy-800 hover:text-brand">บทความ</NuxtLink>
        <NuxtLink to="/#contact" class="btn-brand px-4 py-2 text-sm">สมัครเรียน</NuxtLink>
      </nav>
    </div>
  </header>
</template>
