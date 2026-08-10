<template>
  <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-widest">
          <ShoppingBag class="w-4 h-4" />
          <span>Administración Manpa</span>
        </div>
        <h1 class="text-3xl font-extrabold text-white mt-1">Gestión Global de Pedidos B2B</h1>
        <p class="text-slate-400 text-sm mt-1">
          Actualiza estados de orden, asigna costos de flete y valida pagos recibidos.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <select v-model="statusFilter" class="glass-input text-xs">
          <option value="all">Todos los Estados</option>
          <option value="pending_approval">Pendientes Aprobación</option>
          <option value="awaiting_payment">Esperando Pago</option>
          <option value="paid">Pago Verificado</option>
          <option value="processing">En Preparación</option>
          <option value="dispatched">Despachados</option>
          <option value="completed">Completados</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 text-brand-400 animate-spin" />
    </div>

    <!-- Orders Management Table -->
    <div v-else-if="filteredOrders.length > 0" class="glass-panel border border-slate-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
            <tr>
              <th class="px-6 py-4">N° Orden</th>
              <th class="px-6 py-4">Empresa / Distribuidor</th>
              <th class="px-6 py-4">Fecha</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4">Flete (USD)</th>
              <th class="px-6 py-4 text-right">Total (USD)</th>
              <th class="px-6 py-4 text-center">Acciones & Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-medium">
            <tr v-for="ord in filteredOrders" :key="ord.id" class="hover:bg-slate-900/60 transition-colors">
              <td class="px-6 py-4 font-mono font-bold text-white">#{{ ord.order_number }}</td>
              <td class="px-6 py-4">
                <span class="font-bold text-white text-sm block">{{ ord.company?.legal_name || 'N/A' }}</span>
                <span class="text-[10px] text-slate-400">RIF: {{ ord.company?.tax_id }}</span>
              </td>
              <td class="px-6 py-4 text-slate-300">{{ new Date(ord.created_at).toLocaleDateString('es-VE') }}</td>
              <td class="px-6 py-4">
                <UIStatusBadge :status="ord.status" />
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5">
                  <span class="font-bold text-slate-200">${{ ord.shipping_cost }}</span>
                  <button @click="promptShippingCost(ord)" class="p-1 text-brand-400 hover:underline text-[10px]">
                    (Editar)
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 text-right font-bold text-white text-sm">${{ ord.total }}</td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <select
                    :value="ord.status"
                    @change="(e) => updateOrderStatus(ord.id, (e.target as HTMLSelectElement).value)"
                    class="glass-input py-1 text-[11px]"
                  >
                    <option value="pending_approval">Pendiente Aprobación</option>
                    <option value="awaiting_payment">Esperando Pago</option>
                    <option value="paid">Pago Verificado</option>
                    <option value="processing">En Preparación</option>
                    <option value="dispatched">Despachado</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>

                  <NuxtLink
                    :to="`/app/orders/${ord.id}`"
                    class="p-2 rounded-lg bg-brand-600/20 text-brand-300 hover:bg-brand-600 hover:text-white transition-colors"
                    title="Ver detalle"
                  >
                    <Eye class="w-4 h-4" />
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="glass-panel py-20 text-center text-slate-500 text-sm">
      No hay órdenes registradas bajo este filtro.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ShoppingBag, Loader2, Eye } from 'lucide-vue-next';
import type { Order } from '~/types';

definePageMeta({
  middleware: 'auth-global',
});

const supabase = useSupabaseClient();
const orders = ref<Order[]>([]);
const loading = ref(true);
const statusFilter = ref('all');

const fetchOrders = async () => {
  try {
    loading.value = true;
    const { data, error } = await supabase
      .from('orders')
      .select('*, company:companies(*), profile:profiles(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      orders.value = data as Order[];
    }
  } catch (err) {
    console.error('Error fetching admin orders:', err);
  } finally {
    loading.value = false;
  }
};

const filteredOrders = computed(() => {
  if (statusFilter.value === 'all') return orders.value;
  return orders.value.filter((o) => o.status === statusFilter.value);
});

const updateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    await fetchOrders();
  } catch (err) {
    console.error('Failed to update status:', err);
  }
};

const promptShippingCost = async (order: Order) => {
  const input = prompt('Ingrese el costo de flete en USD para esta orden:', order.shipping_cost.toString());
  if (input !== null) {
    const val = parseFloat(input);
    if (!isNaN(val)) {
      const newTotal = Number((order.subtotal + order.tax_amount + val).toFixed(2));
      await supabase
        .from('orders')
        .update({ shipping_cost: val, total: newTotal })
        .eq('id', order.id);
      await fetchOrders();
    }
  }
};

onMounted(() => {
  fetchOrders();
});
</script>
