<template>
  <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <!-- Header Title & Filter Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
      <div>
        <span class="text-xs font-semibold text-brand-400 uppercase tracking-widest">Catálogo al Mayor</span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-white mt-1">Líneas de Producción MANPA</h1>
        <p class="text-slate-400 text-sm mt-1">
          Productos de papel higiénico institucional, toallas y servilletas con empaque de fábrica.
        </p>
      </div>

      <!-- Search & Category Filters -->
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <div class="relative w-full sm:w-64">
          <Search class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por SKU o nombre..."
            class="glass-input w-full pl-10 text-xs"
          />
        </div>

        <select
          v-model="selectedCategory"
          class="glass-input text-xs w-full sm:w-auto"
        >
          <option value="all">Todas las Categorías</option>
          <option value="Institucional">Institucional</option>
          <option value="Alimentos & Horeca">Alimentos & Horeca</option>
          <option value="Oficina & Imprenta">Oficina & Imprenta</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 text-brand-400 animate-spin" />
    </div>

    <!-- Products Grid -->
    <div v-else-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="glass-panel overflow-hidden flex flex-col group border border-slate-800 hover:border-brand-500/40 transition-all duration-300"
      >
        <!-- Product Thumbnail -->
        <div class="relative h-64 bg-slate-900 overflow-hidden">
          <img
            :src="product.images[0] || 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80'"
            :alt="product.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <!-- Out of Stock Badge -->
          <div v-if="product.stock === 0" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <span class="px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-sm uppercase tracking-wider">
              Agotado
            </span>
          </div>

          <div class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-800">
            MOQ: {{ product.min_order_qty }} ud
          </div>

          <div class="absolute top-3 right-3 bg-brand-950/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-brand-400 border border-brand-500/30">
            SKU: {{ product.sku }}
          </div>
        </div>

        <!-- Details Body -->
        <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span class="font-semibold text-brand-400 uppercase tracking-wider">{{ product.category }}</span>
              <span>Incremento: +{{ product.qty_step }} ud</span>
            </div>

            <h2 class="text-lg font-bold text-white mt-1 group-hover:text-brand-300 transition-colors">
              {{ product.name }}
            </h2>

            <p class="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
              {{ product.description }}
            </p>
          </div>

          <!-- Technical PDF Link & Actions -->
          <div class="space-y-4 pt-4 border-t border-slate-800/80">
            <div class="flex items-center justify-between">
              <a
                v-if="product.technical_sheet_url"
                :href="product.technical_sheet_url"
                target="_blank"
                class="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                <FileText class="w-3.5 h-3.5 text-brand-400" />
                <span>Ficha Técnica PDF</span>
              </a>

              <span v-else class="text-[11px] text-slate-500 italic">Ficha Técnica bajo solicitud</span>
            </div>

            <div class="flex items-center justify-between pt-2">
              <B2BPriceDisplay :price="product.base_price" />

              <NuxtLink
                :to="`/catalog/${product.slug}`"
                class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center gap-1.5"
              >
                <span>Ver Detalle</span>
                <ChevronRight class="w-4 h-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty Filter State -->
    <div v-else class="glass-panel py-20 text-center space-y-3">
      <PackageX class="w-12 h-12 text-slate-600 mx-auto" />
      <h3 class="text-lg font-bold text-white">No se encontraron productos</h3>
      <p class="text-slate-400 text-sm">Intenta ajustar tu búsqueda o filtro de categoría.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, Loader2, FileText, ChevronRight, PackageX } from 'lucide-vue-next';
import type { Product } from '~/types';

const supabase = useSupabaseClient();
const products = ref<Product[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedCategory = ref('all');

onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, tiers:price_tiers(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      products.value = data as Product[];
    }
  } catch (err) {
    console.error('Error loading catalog:', err);
  } finally {
    loading.value = false;
  }
});

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory =
      selectedCategory.value === 'all' || p.category === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
});
</script>
