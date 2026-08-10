<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div class="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
            <Sliders class="w-4 h-4" />
            <span>Gestión CMS</span>
          </div>
          <h1 class="text-3xl font-extrabold text-white mt-1">Banners Promocionales</h1>
          <p class="text-slate-400 text-sm mt-1">
            Administra los carruseles y banners publicitarios visibles en la página principal.
          </p>
        </div>

        <button
          @click="openModal()"
          class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/25 transition-all"
        >
          <Plus class="w-5 h-5" />
          <span>Nuevo Banner</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-20">
        <Loader2 class="w-10 h-10 text-brand-400 animate-spin" />
      </div>

      <!-- Banner Cards Grid -->
      <div v-else-if="banners.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="banner in banners"
          :key="banner.id"
          class="glass-panel overflow-hidden flex flex-col group relative border border-slate-800 hover:border-brand-500/40 transition-all duration-300"
        >
          <!-- Image Preview Header -->
          <div class="relative h-48 w-full bg-slate-900 overflow-hidden">
            <img
              :src="banner.image_url"
              :alt="banner.title || 'Banner'"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

            <!-- Position Badge -->
            <div class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-xs font-bold text-slate-300">
              Posición #{{ banner.position }}
            </div>

            <!-- Status Toggle Badge -->
            <div class="absolute top-3 right-3">
              <button
                @click="toggleActive(banner)"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5',
                  banner.is_active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                ]"
              >
                <span class="w-2 h-2 rounded-full" :class="banner.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'"></span>
                {{ banner.is_active ? 'Activo' : 'Inactivo' }}
              </button>
            </div>
          </div>

          <!-- Content Body -->
          <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <h3 class="text-lg font-bold text-white line-clamp-1">
                {{ banner.title || 'Sin Título' }}
              </h3>
              <p class="text-xs text-slate-400 mt-1 line-clamp-2">
                {{ banner.subtitle || 'Sin descripción adicional.' }}
              </p>
              <div v-if="banner.link_url" class="mt-3 text-xs text-brand-400 font-mono flex items-center gap-1">
                <LinkIcon class="w-3.5 h-3.5" />
                <span class="truncate">{{ banner.link_url }}</span>
              </div>
            </div>

            <!-- Action Controls -->
            <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div class="flex items-center gap-1">
                <button
                  @click="movePosition(banner, -1)"
                  class="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Subir posición"
                >
                  <ArrowUp class="w-4 h-4" />
                </button>
                <button
                  @click="movePosition(banner, 1)"
                  class="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Bajar posición"
                >
                  <ArrowDown class="w-4 h-4" />
                </button>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="openModal(banner)"
                  class="p-2 rounded-lg bg-brand-600/20 text-brand-300 hover:bg-brand-600 hover:text-white transition-colors"
                  title="Editar banner"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="deleteBanner(banner.id)"
                  class="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors"
                  title="Eliminar banner"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="glass-panel py-16 text-center">
        <ImageOff class="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 class="text-lg font-bold text-white">No hay banners creados</h3>
        <p class="text-slate-400 text-sm mt-1">Comienza agregando el primer banner promocional.</p>
      </div>

      <!-- Create / Edit Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div class="glass-panel w-full max-w-lg p-6 space-y-6 border border-slate-800 shadow-2xl relative">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-xl font-bold text-white">
              {{ editingId ? 'Editar Banner' : 'Crear Nuevo Banner' }}
            </h3>
            <button @click="showModal = false" class="text-slate-400 hover:text-white">
              <X class="w-6 h-6" />
            </button>
          </div>

          <form @submit.prevent="saveBanner" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Título del Banner</label>
              <input v-model="form.title" type="text" class="glass-input w-full" placeholder="Ej: Promoción Especial Papel Kraft" required />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Subtítulo / Bajada</label>
              <textarea v-model="form.subtitle" rows="2" class="glass-input w-full" placeholder="Ej: 15% de descuento en pedidos mayores a 100 bultos"></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">URL de Imagen HD</label>
              <input v-model="form.image_url" type="url" class="glass-input w-full" placeholder="https://..." required />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Enlace de Destino (Opcional)</label>
              <input v-model="form.link_url" type="text" class="glass-input w-full" placeholder="/catalog/papel-kraft" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Texto del Botón</label>
                <input v-model="form.cta_text" type="text" class="glass-input w-full" placeholder="Ver Promoción" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 uppercase mb-1">Posición de Orden</label>
                <input v-model.number="form.position" type="number" min="0" class="glass-input w-full" required />
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input v-model="form.is_active" id="modalActive" type="checkbox" class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-brand-500" />
              <label for="modalActive" class="text-sm font-medium text-slate-200">Publicar inmediatamente como Activo</label>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button type="button" @click="showModal = false" class="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold">
                Cancelar
              </button>
              <button type="submit" :disabled="saving" class="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-600/20">
                <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
                <span>{{ saving ? 'Guardando...' : 'Guardar Banner' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Sliders, Plus, Loader2, Link as LinkIcon, ArrowUp, ArrowDown, Pencil, Trash2, ImageOff, X } from 'lucide-vue-next';
import type { Banner } from '~/types';

definePageMeta({
  middleware: 'auth-global',
});

const supabase = useSupabaseClient();
const banners = ref<Banner[]>([]);
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const editingId = ref<string | null>(null);

const form = ref({
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  cta_text: 'Ver Catálogo',
  position: 0,
  is_active: true,
});

const fetchBanners = async () => {
  try {
    loading.value = true;
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('position', { ascending: true });

    if (!error && data) {
      banners.value = data as Banner[];
    }
  } catch (err) {
    console.error('Error fetching banners:', err);
  } finally {
    loading.value = false;
  }
};

const openModal = (banner?: Banner) => {
  if (banner) {
    editingId.value = banner.id;
    form.value = {
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      cta_text: banner.cta_text || 'Ver Catálogo',
      position: banner.position,
      is_active: banner.is_active,
    };
  } else {
    editingId.value = null;
    form.value = {
      title: '',
      subtitle: '',
      image_url: '',
      link_url: '',
      cta_text: 'Ver Catálogo',
      position: banners.value.length + 1,
      is_active: true,
    };
  }
  showModal.value = true;
};

const saveBanner = async () => {
  try {
    saving.value = true;
    if (editingId.value) {
      await supabase
        .from('banners')
        .update(form.value)
        .eq('id', editingId.value);
    } else {
      await supabase
        .from('banners')
        .insert([form.value]);
    }
    showModal.value = false;
    await fetchBanners();
  } catch (err) {
    console.error('Error saving banner:', err);
  } finally {
    saving.value = false;
  }
};

const toggleActive = async (banner: Banner) => {
  try {
    const updatedState = !banner.is_active;
    banner.is_active = updatedState;
    await supabase
      .from('banners')
      .update({ is_active: updatedState })
      .eq('id', banner.id);
  } catch (err) {
    console.error('Error toggling banner status:', err);
  }
};

const movePosition = async (banner: Banner, direction: number) => {
  const newPos = Math.max(0, banner.position + direction);
  banner.position = newPos;
  await supabase
    .from('banners')
    .update({ position: newPos })
    .eq('id', banner.id);
  await fetchBanners();
};

const deleteBanner = async (id: string) => {
  if (confirm('¿Estás seguro de eliminar este banner promocional?')) {
    await supabase.from('banners').delete().eq('id', id);
    await fetchBanners();
  }
};

onMounted(() => {
  fetchBanners();
});
</script>
