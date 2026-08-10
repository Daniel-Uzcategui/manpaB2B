<template>
  <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <!-- Header Summary -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
      <div>
        <div class="flex items-center gap-2">
          <UIStatusBadge status="distributor_approved" />
          <span class="text-xs font-mono text-slate-400">RIF: {{ company?.tax_id }}</span>
        </div>
        <h1 class="text-3xl font-extrabold text-white mt-1">{{ company?.legal_name }}</h1>
        <p class="text-slate-400 text-sm mt-1">Portal Oficial de Pedidos al Mayor y Estado de Cuenta.</p>
      </div>

      <NuxtLink
        to="/catalog"
        class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-xl shadow-brand-600/30 transition-all shrink-0"
      >
        <Plus class="w-5 h-5" />
        <span>Nuevo Pedido al Mayor</span>
      </NuxtLink>
    </div>

    <!-- Quick Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="glass-panel p-6 space-y-2 border border-slate-800">
        <div class="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
          <span>Órdenes Emitidas</span>
          <ShoppingBag class="w-4 h-4 text-brand-400" />
        </div>
        <div class="text-3xl font-black text-white font-heading">{{ orders.length }}</div>
        <span class="text-[11px] text-slate-500">Historial completo en sistema</span>
      </div>

      <div class="glass-panel p-6 space-y-2 border border-slate-800">
        <div class="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
          <span>Límite de Crédito</span>
          <CreditCard class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-3xl font-black text-emerald-400 font-heading">
          ${{ company?.credit_limit || '0.00' }} USD
        </div>
        <span class="text-[11px] text-slate-500">Crédito a 30 / 60 días</span>
      </div>

      <div class="glass-panel p-6 space-y-2 border border-slate-800">
        <div class="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
          <span>Órdenes Activas</span>
          <Clock class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-3xl font-black text-amber-400 font-heading">
          {{ activeOrdersCount }}
        </div>
        <span class="text-[11px] text-slate-500">En proceso de aprobación o pago</span>
      </div>
    </div>

    <!-- Recent Orders Table -->
    <div class="glass-panel border border-slate-800 overflow-hidden">
      <div class="p-6 border-b border-slate-800 flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">Historial de Pedidos Recientes</h2>
        <NuxtLink to="/catalog" class="text-xs font-bold text-brand-400 hover:underline">
          Ver Catálogo Completo →
        </NuxtLink>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <Loader2 class="w-8 h-8 text-brand-400 animate-spin" />
      </div>

      <div v-else-if="orders.length > 0" class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
            <tr>
              <th class="px-6 py-4">N° Orden</th>
              <th class="px-6 py-4">Fecha</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4">Método de Pago</th>
              <th class="px-6 py-4 text-right">Total (USD)</th>
              <th class="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-900/60 transition-colors">
              <td class="px-6 py-4 font-mono font-bold text-white">#{{ order.order_number }}</td>
              <td class="px-6 py-4 text-slate-300">{{ new Date(order.created_at).toLocaleDateString('es-VE') }}</td>
              <td class="px-6 py-4">
                <UIStatusBadge :status="order.status" />
              </td>
              <td class="px-6 py-4 text-slate-300 uppercase font-mono">{{ order.payment_method }}</td>
              <td class="px-6 py-4 text-right font-bold text-white text-sm">${{ order.total }}</td>
              <td class="px-6 py-4 text-center">
                <NuxtLink
                  :to="`/app/orders/${order.id}`"
                  class="px-3 py-1.5 rounded-lg bg-brand-600/20 text-brand-300 hover:bg-brand-600 hover:text-white font-bold transition-all inline-flex items-center gap-1"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>Ver Detalle</span>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="py-16 text-center text-slate-500 text-sm">
        No has emitido órdenes de compra aún.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, ShoppingBag, CreditCard, Clock, Loader2, Eye } from 'lucide-vue-next';
import type { Order } from '~/types';

definePageMeta({
  middleware: 'auth-global',
});

const supabase = useSupabaseClient();
const { company, user } = useB2BAuth();

const orders = ref<Order[]>([]);
const loading = ref(true);

const fetchOrders = async () => {
  if (!user.value) return;
  try {
    loading.value = true;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      orders.value = data as Order[];
    }
  } catch (err) {
    console.error('Error fetching dashboard orders:', err);
  } finally {
    loading.value = false;
  }
};

const activeOrdersCount = computed(() => {
  return orders.value.filter((o) =>
    ['pending_approval', 'awaiting_payment', 'processing', 'dispatched'].includes(o.status)
  ).length;
});

onMounted(() => {
  fetchOrders();
});
</script>
