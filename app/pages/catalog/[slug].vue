<template>
  <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 bg-[#F7F9FB] min-h-screen">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-24">
      <Loader2 class="w-12 h-12 text-brand-600 animate-spin" />
    </div>

    <!-- Product Details Container -->
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Left Column: Gallery & Images -->
      <div class="space-y-4">
        <div class="purity-card p-4 rounded-2xl overflow-hidden bg-white border border-[#E2E8F0] shadow-md h-[400px] sm:h-[480px]">
          <img
            :src="selectedImage || product.images[0] || 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80'"
            :alt="product.name"
            class="w-full h-full object-contain"
          />
        </div>

        <div v-if="product.images.length > 1" class="flex items-center gap-3 overflow-x-auto pb-2">
          <button
            v-for="(img, idx) in product.images"
            :key="idx"
            @click="selectedImage = img"
            :class="[
              'w-20 h-20 rounded-lg p-1 bg-white border transition-all overflow-hidden shrink-0',
              selectedImage === img ? 'border-brand-600 ring-2 ring-brand-600/20' : 'border-[#E2E8F0] hover:border-slate-300'
            ]"
          >
            <img :src="img" :alt="`${product.name} ${idx}`" class="w-full h-full object-cover rounded" />
          </button>
        </div>
      </div>

      <!-- Right Column: Specs, Price Tiers & Order Controls -->
      <div class="space-y-6">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="purity-chip">{{ product.category }}</span>
            <span class="text-xs font-mono font-bold text-slate-400">SKU: {{ product.sku }}</span>
          </div>

          <h1 class="text-3xl sm:text-4xl font-extrabold text-brand-900 leading-tight">
            {{ product.name }}
          </h1>

          <p class="text-sm text-slate-600 mt-3 leading-relaxed">
            {{ product.description }}
          </p>
        </div>

        <!-- Pricing Tier Table -->
        <div v-if="product.tiers && product.tiers.length > 0" class="purity-card p-6 bg-white space-y-3">
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <TrendingDown class="w-4 h-4 text-brand-600" />
            <span>Escala de Descuentos por Volumen (Tier B2B)</span>
          </h4>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-[#E2E8F0] font-bold text-slate-700">
                <tr>
                  <th class="p-2.5">Cantidad Mínima</th>
                  <th class="p-2.5">Descuento</th>
                  <th class="p-2.5 text-right">Precio Unitario Estimado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                <tr
                  v-for="tier in product.tiers"
                  :key="tier.min_quantity"
                  :class="{ 'bg-brand-50/50 font-bold': selectedQty >= tier.min_quantity }"
                >
                  <td class="p-2.5">Desde {{ tier.min_quantity }} empaques</td>
                  <td class="p-2.5 text-accent-600 font-bold">-{{ tier.discount_percentage }}%</td>
                  <td class="p-2.5 text-right font-mono font-bold text-brand-900">
                    ${{ (product.base_price * (1 - tier.discount_percentage / 100)).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Price Display -->
        <div class="purity-card p-6 bg-white flex items-center justify-between">
          <div>
            <span class="text-xs font-bold uppercase text-slate-400 block mb-1">Precio Calculado por Empaque</span>
            <B2BPriceDisplay :price="calculatedUnitPrice" />
          </div>

          <div class="text-right">
            <span class="text-xs font-bold uppercase text-slate-400 block mb-1">Subtotal Pedido</span>
            <span class="font-heading font-black text-2xl text-brand-900">
              ${{ (calculatedUnitPrice * selectedQty).toFixed(2) }} USD
            </span>
          </div>
        </div>

        <!-- Quantity & Add to Cart -->
        <div class="space-y-4 pt-2">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-2">
              Seleccionar Cantidad de Empaques
            </label>
            <B2BQuantityStepInput
              v-model="selectedQty"
              :min-qty="product.min_order_qty"
              :step="product.qty_step"
            />
          </div>

          <button
            @click="handleAddToCart"
            class="w-full btn-primary py-4 text-base justify-center shadow-lg"
          >
            <ShoppingCart class="w-5 h-5" />
            <span>Agregar {{ selectedQty }} Empaques al Pedido</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Loader2, TrendingDown, ShoppingCart } from 'lucide-vue-next';
import type { Product } from '~/types';

const route = useRoute();
const supabase = useB2BSupabaseClient();
const { addToCart, resolveUnitPrice } = useB2BCart();

const product = ref<Product | null>(null);
const selectedImage = ref('');
const selectedQty = ref(1);
const calculatedUnitPrice = ref(0);
const loading = ref(true);

onMounted(async () => {
  try {
    const slug = route.params.slug as string;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      product.value = data as Product;
      selectedQty.value = data.min_order_qty || 1;
      if (data.images && data.images.length > 0) {
        selectedImage.value = data.images[0];
      }
      updatePrice();
    }
  } catch (err) {
    console.error('Error fetching product details:', err);
  } finally {
    loading.value = false;
  }
});

const updatePrice = async () => {
  if (product.value) {
    calculatedUnitPrice.value = await resolveUnitPrice(product.value, selectedQty.value);
  }
};

watch(selectedQty, () => {
  updatePrice();
});

const handleAddToCart = async () => {
  if (product.value) {
    await addToCart(product.value, selectedQty.value);
    navigateTo('/cart');
  }
};
</script>
