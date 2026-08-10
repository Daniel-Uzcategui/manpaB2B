<template>
  <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
    <UIHeader />
    <main class="flex-1">
      <slot />
    </main>
    <UIFooter />
  </div>
</template>

<script setup lang="ts">
// Default layout
</script>
