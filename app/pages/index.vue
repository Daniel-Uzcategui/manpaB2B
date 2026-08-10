<template>
  <div class="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <!-- Hero Banner Carousel -->
    <B2BBannerCarousel :banners="banners" />

    <!-- Value Propositions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="purity-card-hover p-8 space-y-4">
        <div class="w-12 h-12 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold border border-brand-200">
          <Factory class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-brand-900">Venta Directa de Fábrica</h3>
        <p class="text-slate-600 text-sm leading-relaxed">
          Sin intermediarios. Accede a lotes de producción directa de papel higiénico institucional, toallas y servilletas MANPA.
        </p>
      </div>

      <div class="purity-card-hover p-8 space-y-4">
        <div class="w-12 h-12 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center font-bold border border-accent-200">
          <TrendingDown class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-brand-900">Descuentos por Volumen (Tier)</h3>
        <p class="text-slate-600 text-sm leading-relaxed">
          Precios dinámicos decrecientes según el volumen de empaques ordenado. Mayor volumen, mayor margen comercial.
        </p>
      </div>

      <div class="purity-card-hover p-8 space-y-4">
        <div class="w-12 h-12 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold border border-brand-200">
          <Truck class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-brand-900">Logística & Crédito 30-60 Días</h3>
        <p class="text-slate-600 text-sm leading-relaxed">
          Despacho a nivel nacional para distribuidores calificados con opciones de crédito comercial aprobadas.
        </p>
      </div>
    </div>

    <!-- Featured B2B Products Section -->
    <div class="space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <span class="text-xs font-bold text-brand-600 uppercase tracking-widest">Catálogo Industrial</span>
          <h2 class="text-3xl font-extrabold text-brand-900 mt-1">Productos Destacados MANPA</h2>
        </div>
        <NuxtLink to="/catalog" class="text-sm font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1">
          <span>Ver todo el catálogo</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-16">
        <Loader2 class="w-10 h-10 text-brand-600 animate-spin" />
      </div>

      <!-- Products Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="product in featuredProducts"
          :key="product.id"
          class="purity-card-hover overflow-hidden flex flex-col group"
        >
          <!-- Product Image -->
          <div class="relative h-56 bg-slate-50 overflow-hidden border-b border-[#E2E8F0]">
            <img
              :src="product.images[0] || 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80'"
              :alt="product.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-brand-900 border border-[#E2E8F0] shadow-sm">
              MOQ: {{ product.min_order_qty }} ud
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <span class="text-[10px] font-mono text-brand-600 font-bold uppercase">{{ product.category }}</span>
              <h3 class="font-bold text-brand-900 text-base mt-1 line-clamp-2">
                {{ product.name }}
              </h3>
              <p class="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {{ product.description }}
              </p>
            </div>

            <div class="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
              <B2BPriceDisplay :price="product.base_price" />

              <NuxtLink
                :to="`/catalog/${product.slug}`"
                class="p-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all shadow-sm"
                title="Ver producto"
              >
                <Eye class="w-4 h-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Registration CTA Banner -->
    <div class="purity-card p-10 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg">
      <div class="space-y-2 max-w-xl">
        <h3 class="text-3xl font-extrabold text-brand-900">¿Eres Distribuidor o Cadena Comercial?</h3>
        <p class="text-slate-600 text-sm leading-relaxed">
          Crea tu cuenta corporativa adjuntando RIF y Registro Mercantil para habilitar compras al mayor con listas de precios preferenciales.
        </p>
      </div>

      <NuxtLink
        to="/auth/register"
        class="btn-accent text-base py-4 px-8 shrink-0"
      >
        Registrar Mi Empresa →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Factory, TrendingDown, Truck, ArrowRight, Eye, Loader2 } from 'lucide-vue-next';
import type { Banner, Product } from '~/types';

const supabase = useSupabaseClient();
const banners = ref<Banner[]>([]);
const featuredProducts = ref<Product[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    // Fetch active banners
    const { data: bannerData } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (bannerData) banners.value = bannerData as Banner[];

    // Fetch active products
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(4);

    if (prodData) featuredProducts.value = prodData as Product[];
  } catch (err) {
    console.error('Error fetching home data:', err);
  } finally {
    loading.value = false;
  }
});
</script>
