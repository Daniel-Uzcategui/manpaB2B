<template>
  <div class="min-h-screen flex flex-col bg-[#F7F9FB] text-[#191C1E] selection:bg-brand-600 selection:text-white font-sans antialiased">
    <UIHeader />
    <main class="flex-1">
      <slot />
    </main>
    <UIFooter />
  </div>
</template>

<script setup lang="ts">
// Industrial Purity Default Layout
</script>
