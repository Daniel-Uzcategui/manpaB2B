<template>
  <div class="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <!-- Hero Banner Carousel -->
    <B2BBannerCarousel :banners="banners" />

    <!-- Value Propositions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="glass-panel p-8 space-y-4 border border-slate-800 hover:border-brand-500/40 transition-all">
        <div class="w-12 h-12 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold">
          <Factory class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-white">Venta Directa de Fábrica</h3>
        <p class="text-slate-400 text-sm leading-relaxed">
          Sin intermediarios. Accede a lotes de producción directa de papel higiénico institucional, toallas y servilletas.
        </p>
      </div>

      <div class="glass-panel p-8 space-y-4 border border-slate-800 hover:border-brand-500/40 transition-all">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
          <TrendingDown class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-white">Descuentos por Volumen (Tier)</h3>
        <p class="text-slate-400 text-sm leading-relaxed">
          Precios dinámicos decrecientes según el volumen de empaques ordenado. Mayor volumen, mayor margen comercial.
        </p>
      </div>

      <div class="glass-panel p-8 space-y-4 border border-slate-800 hover:border-brand-500/40 transition-all">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
          <Truck class="w-6 h-6" />
        </div>
        <h3 class="text-xl font-bold text-white">Logística & Crédito 30-60 Días</h3>
        <p class="text-slate-400 text-sm leading-relaxed">
          Despacho a nivel nacional para distribuidores calificados con opciones de crédito comercial aprobadas.
        </p>
      </div>
    </div>

    <!-- Featured B2B Products Section -->
    <div class="space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span class="text-xs font-semibold text-brand-400 uppercase tracking-widest">Catálogo Industrial</span>
          <h2 class="text-3xl font-extrabold text-white mt-1">Productos Destacados al Mayor</h2>
        </div>
        <NuxtLink to="/catalog" class="text-sm font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1">
          <span>Ver todo el catálogo</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-16">
        <Loader2 class="w-10 h-10 text-brand-400 animate-spin" />
      </div>

      <!-- Products Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="product in featuredProducts"
          :key="product.id"
          class="glass-panel overflow-hidden flex flex-col group border border-slate-800 hover:border-brand-500/40 transition-all duration-300"
        >
          <!-- Product Image -->
          <div class="relative h-56 bg-slate-900 overflow-hidden">
            <img
              :src="product.images[0] || 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80'"
              :alt="product.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-300 border border-slate-800">
              MOQ: {{ product.min_order_qty }} ud
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <span class="text-[10px] font-mono text-brand-400 font-bold uppercase">{{ product.category }}</span>
              <h3 class="font-bold text-white text-base mt-1 line-clamp-2">
                {{ product.name }}
              </h3>
              <p class="text-xs text-slate-400 mt-2 line-clamp-2">
                {{ product.description }}
              </p>
            </div>

            <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <B2BPriceDisplay :price="product.base_price" />

              <NuxtLink
                :to="`/catalog/${product.slug}`"
                class="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-md"
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
    <div class="glass-panel p-10 rounded-3xl border border-brand-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/40 relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
      <div class="space-y-2 max-w-xl">
        <h3 class="text-3xl font-extrabold text-white">¿Eres Distribuidor o Cadena Comercial?</h3>
        <p class="text-slate-300 text-sm leading-relaxed">
          Crea tu cuenta corporativa adjuntando RIF y Registro Mercantil para habilitar compras al mayor con listas de precios preferenciales.
        </p>
      </div>

      <NuxtLink
        to="/auth/register"
        class="px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-base shadow-xl shadow-brand-600/30 transition-all hover:scale-105 shrink-0"
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
