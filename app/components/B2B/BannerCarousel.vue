<template>
  <div v-if="banners.length > 0" class="relative overflow-hidden rounded-2xl purity-card shadow-lg border border-[#E2E8F0]">
    <div
      class="flex transition-transform duration-700 ease-out"
      :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
    >
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="w-full shrink-0 relative min-h-[420px] lg:min-h-[460px] flex items-center p-8 sm:p-12 lg:p-16 overflow-hidden bg-white"
      >
        <!-- Background Image with Soft Vignette -->
        <img
          :src="banner.image_url"
          :alt="banner.title || 'Banner Manpa'"
          class="absolute inset-0 w-full h-full object-cover object-center opacity-25 filter brightness-95 scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>

        <!-- Text Content -->
        <div class="relative z-10 max-w-2xl space-y-6">
          <div class="purity-chip gap-1.5">
            <Sparkles class="w-3.5 h-3.5 text-brand-600" />
            <span>Abastecimiento Directo de Fábrica MANPA</span>
          </div>

          <h2 class="text-3xl sm:text-5xl font-black text-brand-900 leading-tight">
            {{ banner.title }}
          </h2>

          <p v-if="banner.subtitle" class="text-slate-600 text-base sm:text-lg leading-relaxed">
            {{ banner.subtitle }}
          </p>

          <div class="pt-2 flex items-center gap-4">
            <NuxtLink
              :to="banner.link_url || '/catalog'"
              class="btn-primary"
            >
              <span>{{ banner.cta_text || 'Explorar Catálogo' }}</span>
              <ArrowRight class="w-4 h-4" />
            </NuxtLink>

            <NuxtLink
              to="/auth/register"
              class="btn-secondary hidden sm:inline-flex"
            >
              <span>Registro Mayorista</span>
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
          currentIndex === idx ? 'w-8 bg-brand-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
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
