<template>
  <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <div class="border-b border-slate-800 pb-6">
      <span class="text-xs font-semibold text-brand-400 uppercase tracking-widest">Pedido Corporativo</span>
      <h1 class="text-3xl font-extrabold text-white mt-1">Carrito de Compras B2B</h1>
    </div>

    <!-- Empty Cart State -->
    <div v-if="items.length === 0" class="glass-panel py-20 text-center space-y-4">
      <ShoppingCart class="w-16 h-16 text-slate-600 mx-auto" />
      <h3 class="text-xl font-bold text-white">Tu carrito está vacío</h3>
      <p class="text-slate-400 text-sm">Explora nuestro catálogo para agregar lotes de productos al mayor.</p>
      <NuxtLink
        to="/catalog"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all"
      >
        <span>Explorar Catálogo</span>
        <ArrowRight class="w-4 h-4" />
      </NuxtLink>
    </div>

    <!-- Active Cart Layout -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Items List (Left Column) -->
      <div class="lg:col-span-8 space-y-4">
        <div
          v-for="item in items"
          :key="item.product.id"
          class="glass-panel p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <!-- Product Details -->
          <div class="flex items-center gap-4 w-full sm:w-auto">
            <img
              :src="item.product.images[0] || 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80'"
              :alt="item.product.name"
              class="w-20 h-20 rounded-xl object-cover shrink-0 bg-slate-900 border border-slate-800"
            />
            <div>
              <span class="text-[10px] font-mono text-brand-400 font-bold uppercase">SKU: {{ item.product.sku }}</span>
              <h3 class="font-bold text-white text-sm line-clamp-1 mt-0.5">{{ item.product.name }}</h3>
              <p class="text-xs text-slate-400 mt-1">Precio Unit: <strong class="text-white">${{ item.unit_price }} USD</strong></p>
            </div>
          </div>

          <!-- Quantity Controls & Subtotal -->
          <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <B2BQuantityStepInput
              :model-value="item.quantity"
              :min-qty="item.product.min_order_qty"
              :step="item.product.qty_step"
              @change="(newQty) => updateQuantity(item.product.id, newQty)"
            />

            <div class="text-right shrink-0">
              <span class="text-xs text-slate-400 font-medium block">Subtotal</span>
              <span class="font-heading font-extrabold text-white text-base">${{ item.subtotal.toFixed(2) }}</span>
            </div>

            <button
              @click="removeFromCart(item.product.id)"
              class="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
              title="Quitar producto"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Checkout Summary (Right Column) -->
      <div class="lg:col-span-4">
        <div class="glass-panel p-6 space-y-6 border border-slate-800 sticky top-28">
          <h3 class="text-lg font-bold text-white border-b border-slate-800 pb-3">Resumen de Cotización</h3>

          <!-- Breakdown -->
          <div class="space-y-3 text-sm">
            <div class="flex justify-between text-slate-300">
              <span>Subtotal Neto:</span>
              <span class="font-bold text-white">${{ subtotal.toFixed(2) }} USD</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>IVA (16%):</span>
              <span class="font-bold text-white">${{ taxAmount.toFixed(2) }} USD</span>
            </div>
            <div class="flex justify-between text-slate-400 text-xs">
              <span>Flete / Logística:</span>
              <span class="font-mono text-brand-400">Por Cotizar Staff</span>
            </div>
            <div class="pt-3 border-t border-slate-800 flex justify-between items-baseline">
              <span class="font-bold text-white text-base">Total Estimado:</span>
              <span class="font-heading font-black text-2xl text-brand-400">${{ grandTotal.toFixed(2) }} USD</span>
            </div>
          </div>

          <!-- Payment Method Selector -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-300 uppercase">Método de Pago Preferido:</label>
            <select v-model="paymentMethod" class="glass-input w-full text-xs">
              <option value="wire_transfer">Transferencia Bancaria / Pago Móvil</option>
              <option value="credit_30_days">Crédito Comercial (30 Días)</option>
              <option value="credit_60_days">Crédito Comercial (60 Días)</option>
              <option value="cash_on_delivery">Pago Contra Entrega</option>
            </select>
          </div>

          <!-- Shipping Address -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-300 uppercase">Dirección de Despacho:</label>
            <textarea
              v-model="shippingAddress"
              rows="2"
              class="glass-input w-full text-xs"
              placeholder="Indica la dirección completa del depósito o almacén..."
            ></textarea>
          </div>

          <!-- Submit Order Button -->
          <button
            @click="handleCheckout"
            :disabled="submitting"
            class="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="submitting" class="w-5 h-5 animate-spin" />
            <span>{{ submitting ? 'Generando Pedido...' : 'Emitir Orden de Compra B2B' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ShoppingCart, ArrowRight, Trash2, Loader2 } from 'lucide-vue-next';
import type { PaymentMethod } from '~/types';

const supabase = useSupabaseClient();
const { user, isApprovedDistributor, isAdmin } = useB2BAuth();
const { items, updateQuantity, removeFromCart, clearCart, subtotal, taxAmount, grandTotal } = useB2BCart();

const paymentMethod = ref<PaymentMethod>('wire_transfer');
const shippingAddress = ref('');
const submitting = ref(false);

const handleCheckout = async () => {
  if (!user.value) {
    return navigateTo('/auth/login?redirect=/cart');
  }

  if (!isApprovedDistributor.value && !isAdmin.value) {
    return navigateTo('/app/pending');
  }

  try {
    submitting.value = true;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    const response = await $fetch<{ success: boolean; orderId: string }>('/api/orders/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        items: items.value.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        })),
        paymentMethod: paymentMethod.value,
        shippingAddress: shippingAddress.value,
      },
    });

    if (response.success && response.orderId) {
      clearCart();
      navigateTo(`/app/orders/${response.orderId}`);
    }
  } catch (err: any) {
    console.error('Checkout error:', err);
    alert(err.statusMessage || err.message || 'Error al emitir la orden');
  } finally {
    submitting.value = false;
  }
};
</script>
