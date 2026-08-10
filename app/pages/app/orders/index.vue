<template>
  <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <div>
        <span class="text-xs font-semibold text-brand-400 uppercase tracking-widest">Portal Distribuidor</span>
        <h1 class="text-3xl font-extrabold text-white mt-1">Mis Órdenes de Compra</h1>
        <p class="text-slate-400 text-sm mt-1">
          Historial completo de cotizaciones y proformas registradas con MANPA.
        </p>
      </div>

      <NuxtLink
        to="/catalog"
        class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/25 transition-all"
      >
        <Plus class="w-4 h-4" />
        <span>Nuevo Pedido</span>
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 text-brand-400 animate-spin" />
    </div>

    <!-- Orders List -->
    <div v-else-if="orders.length > 0" class="glass-panel border border-slate-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
            <tr>
              <th class="px-6 py-4">N° Orden</th>
              <th class="px-6 py-4">Fecha</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4">Forma de Pago</th>
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
                  <span>Ver Detalle & PDF</span>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="glass-panel py-20 text-center text-slate-500 text-sm space-y-3">
      <p>No tienes órdenes registradas actualmente.</p>
      <NuxtLink to="/catalog" class="text-brand-400 font-bold hover:underline">
        Explorar productos en catálogo →
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Loader2, Eye } from 'lucide-vue-next';
import type { Order } from '~/types';

definePageMeta({
  middleware: 'auth-global',
});

const supabase = useSupabaseClient();
const { user } = useB2BAuth();

const orders = ref<Order[]>([]);
const loading = ref(true);

onMounted(async () => {
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
    console.error('Error fetching distributor orders:', err);
  } finally {
    loading.value = false;
  }
});
</script>
