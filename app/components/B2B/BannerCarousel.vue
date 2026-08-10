<template>
  <div v-if="banners.length > 0" class="relative overflow-hidden rounded-3xl border border-slate-800 glass-panel shadow-2xl">
    <div
      class="flex transition-transform duration-700 ease-out"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="w-full shrink-0 relative min-h-[420px] lg:min-h-[480px] flex items-center p-8 sm:p-12 lg:p-16 overflow-hidden"
      >
        <!-- Background Image with Gradient Overlay -->
        <img
          :src="banner.image_url"
          :alt="banner.title || 'Banner Manpa'"
          class="absolute inset-0 w-full h-full object-cover object-center opacity-40 filter brightness-75 scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>

        <!-- Text Content -->
        <div class="relative z-10 max-w-2xl space-y-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Atención Directa Mayorista</span>
          </div>

          <h2 class="text-3xl sm:text-5xl font-black text-white leading-tight">
            {{ banner.title }}
          </h2>

          <p v-if="banner.subtitle" class="text-slate-300 text-base sm:text-lg leading-relaxed">
            {{ banner.subtitle }}
          </p>

          <div class="pt-2">
            <NuxtLink
              :to="banner.link_url || '/catalog'"
              class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-base shadow-xl shadow-brand-600/30 transition-all hover:scale-105"
            >
              <span>{{ banner.cta_text || 'Ver Catálogo' }}</span>
              <ArrowRight class="w-5 h-5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Carousel Dots Navigation -->
    <div v-if="banners.length > 1" class="absolute bottom-6 right-8 z-20 flex gap-2">
      <button
        v-for="(_, idx) in banners"
        :key="idx"
        @click="currentIndex = idx"
        :class="[
          'h-2.5 rounded-full transition-all duration-300',
          currentIndex === idx ? 'w-8 bg-brand-400' : 'w-2.5 bg-slate-700 hover:bg-slate-500'
        ]"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Sparkles, ArrowRight } from 'lucide-vue-next';
import type { Banner } from '~/types';

const props = defineProps({
  banners: {
    type: Array as () => Banner[],
    default: () => [],
  },
});

const currentIndex = ref(0);
let timer: any = null;

const startAutoplay = () => {
  if (props.banners.length > 1) {
    timer = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % props.banners.length;
    }, 6000);
  }
};

onMounted(() => {
  startAutoplay();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
