<template>
  <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <!-- Breadcrumb Nav -->
    <div class="flex items-center gap-2 text-xs font-semibold text-slate-400">
      <NuxtLink to="/" class="hover:text-white">Inicio</NuxtLink>
      <span>/</span>
      <NuxtLink to="/catalog" class="hover:text-white">Catálogo</NuxtLink>
      <span>/</span>
      <span class="text-brand-400 truncate">{{ product?.name }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 text-brand-400 animate-spin" />
    </div>

    <!-- Product Layout Grid -->
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <!-- Left Column: Gallery & Technical Datasheet -->
      <div class="lg:col-span-7 space-y-6">
        <div class="glass-panel overflow-hidden border border-slate-800 relative h-96 sm:h-[480px]">
          <img
            :src="selectedImage || product.images[0] || 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80'"
            :alt="product.name"
            class="w-full h-full object-cover"
          />

          <!-- Out of Stock Overlay -->
          <div v-if="product.stock === 0" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <span class="px-6 py-2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-extrabold text-base uppercase tracking-wider">
              Agotado en Planta
            </span>
          </div>

          <div class="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-300 border border-slate-800">
            SKU: {{ product.sku }}
          </div>
        </div>

        <!-- Thumbnail Selector -->
        <div v-if="product.images.length > 1" class="flex gap-3 overflow-x-auto pb-2">
          <button
            v-for="(img, idx) in product.images"
            :key="idx"
            @click="selectedImage = img"
            :class="[
              'w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0',
              selectedImage === img ? 'border-brand-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
            ]"
          >
            <img :src="img" class="w-full h-full object-cover" />
          </button>
        </div>

        <!-- Technical Sheet PDF Download Box -->
        <div v-if="product.technical_sheet_url" class="glass-panel p-6 border border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0">
              <FileText class="w-6 h-6" />
            </div>
            <div>
              <h4 class="font-bold text-white text-sm">Ficha Técnica Oficial MANPA</h4>
              <p class="text-xs text-slate-400">Especificaciones de gramaje, resistencia y certificaciones ISO.</p>
            </div>
          </div>
          <a
            :href="product.technical_sheet_url"
            target="_blank"
            class="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-brand-400 hover:text-white hover:bg-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <Download class="w-4 h-4" />
            <span>Descargar PDF</span>
          </a>
        </div>
      </div>

      <!-- Right Column: Purchasing Panel & Tier Pricing -->
      <div class="lg:col-span-5 space-y-6">
        <div class="glass-panel p-8 space-y-6 border border-slate-800">
          <div>
            <span class="text-xs font-mono font-bold text-brand-400 uppercase tracking-widest">{{ product.category }}</span>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white mt-1 leading-tight">
              {{ product.name }}
            </h1>
          </div>

          <!-- Price Display -->
          <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span class="text-xs text-slate-400 font-medium block mb-1">Precio Unitario al Mayor:</span>
            <B2BPriceDisplay :price="effectiveUnitPrice" :original-price="product.base_price" />
          </div>

          <!-- Description -->
          <p class="text-sm text-slate-300 leading-relaxed">
            {{ product.description }}
          </p>

          <!-- Volume Discount Tiers Table -->
          <div v-if="product.tiers && product.tiers.length > 0" class="space-y-2">
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Tabla de Descuentos por Volumen (Tier):
            </span>
            <div class="rounded-xl border border-slate-800 overflow-hidden text-xs">
              <div class="grid grid-cols-2 bg-slate-950 px-4 py-2 text-slate-400 font-bold uppercase">
                <span>Volumen Mínimo</span>
                <span class="text-right">Descuento Aplicado</span>
              </div>
              <div
                v-for="tier in product.tiers"
                :key="tier.id"
                :class="[
                  'grid grid-cols-2 px-4 py-2.5 border-t border-slate-800/60 font-medium',
                  quantity >= tier.min_quantity ? 'bg-brand-600/10 text-brand-300 font-bold' : 'text-slate-300'
                ]"
              >
                <span>Desde {{ tier.min_quantity }} unidades</span>
                <span class="text-right text-emerald-400">-{{ tier.discount_percentage }}% Off</span>
              </div>
            </div>
          </div>

          <!-- Quantity Selector -->
          <div v-if="product.stock > 0" class="space-y-3 pt-2">
            <label class="block text-xs font-bold text-slate-300 uppercase">
              Seleccionar Cantidad de Empaques:
            </label>
            <B2BQuantityStepInput
              v-model="quantity"
              :min-qty="product.min_order_qty"
              :step="product.qty_step"
            />
          </div>

          <!-- Action Add to Cart Button -->
          <div class="pt-4 border-t border-slate-800">
            <template v-if="isApprovedDistributor || isAdmin">
              <button
                @click="handleAddToCart"
                :disabled="product.stock === 0 || adding"
                class="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-extrabold text-base shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart class="w-5 h-5" />
                <span>{{ adding ? 'Agregando...' : `Agregar ${quantity} ud al Carrito ($${(quantity * effectiveUnitPrice).toFixed(2)})` }}</span>
              </button>
            </template>

            <template v-else>
              <NuxtLink
                to="/auth/register"
                class="w-full py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-brand-500/40 text-brand-300 font-bold text-sm transition-all flex items-center justify-center gap-2 text-center"
              >
                <Lock class="w-4 h-4" />
                <span>Registrar Empresa para Comprar al Mayor</span>
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Loader2, FileText, Download, ShoppingCart, Lock } from 'lucide-vue-next';
import type { Product } from '~/types';

const route = useRoute();
const supabase = useSupabaseClient();
const { isApprovedDistributor, isAdmin } = useB2BAuth();
const { addToCart, resolveUnitPrice } = useB2BCart();

const product = ref<Product | null>(null);
const loading = ref(true);
const selectedImage = ref('');
const quantity = ref(1);
const effectiveUnitPrice = ref(0);
const adding = ref(false);

const updatePrice = async () => {
  if (product.value) {
    effectiveUnitPrice.value = await resolveUnitPrice(product.value, quantity.value);
  }
};

watch(quantity, () => {
  updatePrice();
});

onMounted(async () => {
  try {
    const slug = route.params.slug as string;
    const { data, error } = await supabase
      .from('products')
      .select('*, tiers:price_tiers(*)')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      product.value = data as Product;
      selectedImage.value = data.images[0] || '';
      quantity.value = data.min_order_qty || 1;
      await updatePrice();
    }
  } catch (err) {
    console.error('Error fetching product:', err);
  } finally {
    loading.value = false;
  }
});

const handleAddToCart = async () => {
  if (!product.value) return;
  adding.value = true;
  await addToCart(product.value, quantity.value);
  adding.value = false;
  navigateTo('/cart');
};
</script>
