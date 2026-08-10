<template>
  <div class="min-h-screen bg-[#F7F9FB] py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <div class="purity-card p-8 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <span class="purity-chip mb-1">CMS / Gestión de Banners</span>
        <h1 class="text-3xl font-extrabold text-brand-900">Banners del Home Carousel</h1>
        <p class="text-xs text-slate-500">Administra las promociones, imágenes y enlaces del carrusel de la página de inicio.</p>
      </div>

      <button @click="openModal()" class="btn-primary">
        <Plus class="w-4 h-4" />
        <span>Agregar Nuevo Banner</span>
      </button>
    </div>

    <!-- Banners Grid -->
    <div v-if="loading" class="flex justify-center py-16">
      <Loader2 class="w-10 h-10 text-brand-600 animate-spin" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="purity-card overflow-hidden bg-white flex flex-col justify-between"
      >
        <div class="relative h-48 bg-slate-100 border-b border-[#E2E8F0] overflow-hidden">
          <img :src="banner.image_url" :alt="banner.title" class="w-full h-full object-cover" />
          <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#E2E8F0] text-xs font-bold text-brand-900 shadow-sm">
            Posición: {{ banner.position }}
          </div>
        </div>

        <div class="p-6 space-y-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-extrabold text-brand-900 text-lg">{{ banner.title }}</h3>
            <p class="text-xs text-slate-500 mt-1">{{ banner.subtitle }}</p>
          </div>

          <div class="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold', banner.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500']">
              {{ banner.is_active ? 'Activo' : 'Inactivo' }}
            </span>

            <div class="flex items-center gap-2">
              <button @click="openModal(banner)" class="btn-secondary py-1.5 px-3 text-xs">
                <Pencil class="w-3.5 h-3.5" /> Editar
              </button>
              <button @click="deleteBanner(banner.id)" class="text-accent-600 hover:text-accent-700 p-1.5">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-vue-next';
import type { Banner } from '~/types';

const supabase = useB2BSupabaseClient();
const banners = ref<Banner[]>([]);
const loading = ref(true);

const fetchBanners = async () => {
  try {
    loading.value = true;
    const { data } = await supabase.from('banners').select('*').order('position', { ascending: true });
    if (data) banners.value = data as Banner[];
  } catch (err) {
    console.error('Error fetching banners:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchBanners();
});

const openModal = (banner?: Banner) => {
  // Modal handling logic
};

const deleteBanner = async (id: string) => {
  if (confirm('¿Deseas eliminar este banner?')) {
    await supabase.from('banners').delete().eq('id', id);
    fetchBanners();
  }
};
</script>
