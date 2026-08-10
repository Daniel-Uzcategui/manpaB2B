<template>
  <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 bg-[#F7F9FB] min-h-screen">
    <div class="border-b border-[#E2E8F0] pb-6">
      <span class="purity-chip mb-2">Orden de Compra Mayorista</span>
      <h1 class="text-3xl sm:text-4xl font-black text-brand-900">Carrito de Compra B2B</h1>
    </div>

    <!-- Empty Cart -->
    <div v-if="items.length === 0" class="purity-card p-16 text-center space-y-6 bg-white">
      <ShoppingCart class="w-16 h-16 text-slate-300 mx-auto" />
      <div class="space-y-2">
        <h3 class="text-xl font-extrabold text-brand-900">Tu carrito de pedido está vacío</h3>
        <p class="text-slate-500 text-xs">Explora el catálogo de productos industriales MANPA y agrega empaques al mayor.</p>
      </div>

      <NuxtLink to="/catalog" class="btn-primary inline-flex">
        <span>Ir al Catálogo de Productos</span>
        <ArrowRight class="w-4 h-4" />
      </NuxtLink>
    </div>

    <!-- Active Cart Items Grid & Summary -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Items List -->
      <div class="lg:col-span-2 space-y-4">
        <div
          v-for="item in items"
          :key="item.product.id"
          class="purity-card p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div class="flex items-center gap-4 w-full sm:w-auto">
            <img
              :src="item.product.images[0] || 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80'"
              :alt="item.product.name"
              class="w-20 h-20 object-cover rounded-lg border border-[#E2E8F0] shrink-0"
            />
            <div class="space-y-1">
              <span class="text-[10px] font-bold text-brand-600 uppercase font-mono">{{ item.product.category }}</span>
              <h3 class="font-bold text-brand-900 text-base leading-snug line-clamp-1">
                {{ item.product.name }}
              </h3>
              <div class="text-xs text-slate-500 font-mono">
                Precio Unitario: <strong class="text-brand-900">${{ item.unit_price.toFixed(2) }}</strong> USD
              </div>
            </div>
          </div>

          <!-- Quantity Controls & Subtotal -->
          <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-[#E2E8F0]">
            <B2BQuantityStepInput
              :model-value="item.quantity"
              @update:model-value="(val) => updateQuantity(item.product.id, val)"
              :min-qty="item.product.min_order_qty"
              :step="item.product.qty_step"
            />

            <div class="text-right min-w-[100px]">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Subtotal</span>
              <span class="font-extrabold text-brand-900 text-lg">${{ item.subtotal.toFixed(2) }}</span>
            </div>

            <button
              @click="removeFromCart(item.product.id)"
              class="p-2 text-slate-400 hover:text-accent-600 transition-colors"
              title="Eliminar ítem"
            >
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Checkout Summary Sidebar -->
      <div class="space-y-6">
        <div class="purity-card p-6 bg-white space-y-6">
          <h3 class="text-base font-bold text-brand-900 border-b border-[#E2E8F0] pb-3">
            Resumen del Pedido B2B
          </h3>

          <div class="space-y-3 text-xs font-semibold text-slate-600">
            <div class="flex justify-between">
              <span>Subtotal Empaques</span>
              <span class="font-mono text-brand-900">${{ subtotal.toFixed(2) }} USD</span>
            </div>

            <div class="flex justify-between">
              <span>IVA (16% Estimado)</span>
              <span class="font-mono text-brand-900">${{ taxAmount.toFixed(2) }} USD</span>
            </div>

            <div class="pt-3 border-t border-[#E2E8F0] flex justify-between items-baseline">
              <span class="text-sm font-bold text-brand-900">Total Proforma</span>
              <span class="font-heading font-black text-2xl text-brand-900">${{ grandTotal.toFixed(2) }} USD</span>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <button
              @click="handleCheckout"
              :disabled="loading"
              class="w-full btn-primary py-4 text-sm justify-center shadow-lg"
            >
              <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
              <span>{{ loading ? 'Procesando Pedido...' : 'Emitir Orden de Compra' }}</span>
            </button>

            <button
              @click="clearCart"
              class="w-full text-xs font-bold text-slate-500 hover:text-accent-600 transition-colors text-center block py-1"
            >
              Vaciar Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ShoppingCart, ArrowRight, Trash2, Loader2 } from 'lucide-vue-next';

const { items, updateQuantity, removeFromCart, clearCart, subtotal, taxAmount, grandTotal } = useB2BCart();
const { user, isApprovedDistributor } = useB2BAuth();

const loading = ref(false);

const handleCheckout = async () => {
  if (!user.value) {
    return navigateTo('/auth/login?redirect=/cart');
  }

  if (!isApprovedDistributor.value) {
    return navigateTo('/app/pending');
  }

  try {
    loading.value = true;
    const res = await $fetch('/api/orders/create', {
      method: 'POST',
      body: {
        items: items.value.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        notes: 'Pedido emitido desde Portal B2B Mayorista',
      },
    });

    if (res && res.success && res.order) {
      clearCart();
      navigateTo(`/app/orders/${res.order.id}`);
    }
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Error al emitir el pedido.');
  } finally {
    loading.value = false;
  }
};
</script>
