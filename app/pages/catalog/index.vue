<template>
  <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 bg-[#F7F9FB] min-h-screen">
    <!-- Header Title & Filters -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-6">
      <div>
        <span class="purity-chip mb-2">Venta Directa de Fábrica</span>
        <h1 class="text-3xl sm:text-4xl font-black text-brand-900">Catálogo Mayorista MANPA</h1>
        <p class="text-slate-500 text-sm mt-1">Precios dinámicos por volumen de empaque. Despacho nacional a distribuidores.</p>
      </div>

      <!-- Search Input -->
      <div class="relative w-full md:w-80">
        <Search class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar producto, SKU..."
          class="purity-input w-full pl-10"
        />
      </div>
    </div>

    <!-- Category Pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        @click="selectedCategory = ''"
        :class="[
          'px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap',
          selectedCategory === ''
            ? 'bg-brand-600 text-white shadow-sm'
            : 'bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
        ]"
      >
        Todas las Categorías
      </button>

      <button
        v-for="cat in categories"
        :key="cat"
        @click="selectedCategory = cat"
        :class="[
          'px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap',
          selectedCategory === cat
            ? 'bg-brand-600 text-white shadow-sm'
            : 'bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
        ]"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 text-brand-600 animate-spin" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredProducts.length === 0" class="purity-card p-12 text-center space-y-4">
      <PackageX class="w-12 h-12 text-slate-300 mx-auto" />
      <h3 class="text-lg font-bold text-brand-900">No se encontraron productos</h3>
      <p class="text-slate-500 text-xs">Intenta modificar los filtros de búsqueda o categoría.</p>
    </div>

    <!-- Product Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="purity-card-hover overflow-hidden flex flex-col justify-between bg-white"
      >
        <!-- Product Image -->
        <div class="relative h-60 bg-slate-50 border-b border-[#E2E8F0] overflow-hidden group">
          <img
            :src="product.images[0] || 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80'"
            :alt="product.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-brand-900 border border-[#E2E8F0] shadow-sm">
            MOQ: {{ product.min_order_qty }} ud
          </div>
          <div v-if="product.qty_step > 1" class="absolute top-3 right-3 bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-brand-200">
            Empaque: +{{ product.qty_step }}
          </div>
        </div>

        <!-- Product Specs & Content -->
        <div class="p-5 space-y-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
              <span class="text-brand-600 font-mono uppercase">{{ product.category }}</span>
              <span class="font-mono">SKU: {{ product.sku }}</span>
            </div>

            <h3 class="font-extrabold text-brand-900 text-base leading-snug line-clamp-2">
              {{ product.name }}
            </h3>

            <p class="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {{ product.description }}
            </p>
          </div>

          <!-- Price & Action -->
          <div class="pt-4 border-t border-[#E2E8F0] space-y-3">
            <div class="flex items-end justify-between">
              <span class="text-[10px] font-bold uppercase text-slate-400">Precio Base Empaque</span>
              <B2BPriceDisplay :price="product.base_price" />
            </div>

            <NuxtLink
              :to="`/catalog/${product.slug}`"
              class="w-full btn-primary py-2.5 text-xs justify-center"
            >
              <span>Ver Opciones & Tier de Precios</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Search, Loader2, PackageX, ArrowRight } from 'lucide-vue-next';
import type { Product } from '~/types';

const supabase = useB2BSupabaseClient();
const products = ref<Product[]>([]);
const categories = ref<string[]>([
  'Papel Higiénico',
  'Servilletas',
  'Toallas de Papel',
  'Faciales y Cuidado Personal'
]);
const selectedCategory = ref('');
const searchQuery = ref('');
const loading = ref(true);

onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (!error && data) {
      products.value = data as Product[];
    }
  } catch (err) {
    console.error('Error loading catalog products:', err);
  } finally {
    loading.value = false;
  }
});

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    const matchesCat = !selectedCategory.value || p.category === selectedCategory.value;
    const matchesSearch =
      !searchQuery.value ||
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.value.toLowerCase()));

    return matchesCat && matchesSearch;
  });
});
</script>
