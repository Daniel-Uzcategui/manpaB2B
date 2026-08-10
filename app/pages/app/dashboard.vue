<template>
  <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 bg-[#F7F9FB] min-h-screen">
    <!-- Distributor Header -->
    <div class="purity-card p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="purity-chip">Portal Distribuidor Autorizado</span>
          <B2BStatusBadge :status="profile?.role || 'distributor_approved'" />
        </div>
        <h1 class="text-3xl font-extrabold text-brand-900">
          {{ company?.legal_name || profile?.full_name }}
        </h1>
        <p class="text-xs font-mono text-slate-500">RIF: {{ company?.tax_id || 'J-00000000-0' }} | {{ profile?.email }}</p>
      </div>

      <NuxtLink to="/catalog" class="btn-primary">
        <span>Nuevo Pedido al Mayor</span>
        <Plus class="w-4 h-4" />
      </NuxtLink>
    </div>

    <!-- Credit Limit Metrics Card -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="purity-card p-6 bg-white space-y-2">
        <span class="text-xs font-bold text-slate-400 uppercase">Límite de Crédito Aprobado</span>
        <div class="text-2xl font-black text-brand-900 font-mono">
          ${{ (company?.credit_limit || 50000).toLocaleString() }} USD
        </div>
        <span class="text-[11px] text-slate-500 font-medium">Plazo comercial: 30 a 60 días</span>
      </div>

      <div class="purity-card p-6 bg-white space-y-2">
        <span class="text-xs font-bold text-slate-400 uppercase">Crédito Consumido</span>
        <div class="text-2xl font-black text-accent-600 font-mono">
          ${{ (company?.credit_used || 0).toLocaleString() }} USD
        </div>
        <span class="text-[11px] text-slate-500 font-medium">En pedidos activos y pendientes</span>
      </div>

      <div class="purity-card p-6 bg-white space-y-2">
        <span class="text-xs font-bold text-slate-400 uppercase">Crédito Disponible</span>
        <div class="text-2xl font-black text-brand-600 font-mono">
          ${{ ((company?.credit_limit || 50000) - (company?.credit_used || 0)).toLocaleString() }} USD
        </div>
        <span class="text-[11px] text-slate-500 font-medium">Disponible para emisión inmediata</span>
      </div>
    </div>

    <!-- Recent Orders Section -->
    <div class="space-y-4">
      <h2 class="text-xl font-extrabold text-brand-900 border-b border-[#E2E8F0] pb-3">
        Historial de Órdenes de Compra
      </h2>

      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 class="w-8 h-8 text-brand-600 animate-spin" />
      </div>

      <div v-else-if="orders.length === 0" class="purity-card p-12 text-center space-y-3 bg-white">
        <Package class="w-12 h-12 text-slate-300 mx-auto" />
        <h3 class="font-bold text-brand-900">Aún no has registrado órdenes de compra</h3>
        <p class="text-xs text-slate-500">Crea tu primera orden mayorista desde el catálogo.</p>
      </div>

      <div v-else class="purity-card bg-white overflow-hidden divide-y divide-[#E2E8F0]">
        <div
          v-for="order in orders"
          :key="order.id"
          class="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <span class="font-mono font-bold text-brand-900 text-base">Orden #{{ order.id.slice(0, 8) }}</span>
              <B2BStatusBadge :status="order.status" />
            </div>
            <p class="text-xs text-slate-500 font-mono">
              Fecha: {{ new Date(order.created_at).toLocaleDateString('es-VE') }}
            </p>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-right">
              <span class="text-[10px] font-bold text-slate-400 uppercase block">Monto Total</span>
              <span class="font-extrabold text-brand-900 font-mono text-lg">${{ order.total_amount.toFixed(2) }} USD</span>
            </div>

            <NuxtLink
              :to="`/app/orders/${order.id}`"
              class="btn-secondary py-2 px-4 text-xs"
            >
              <span>Ver Detalle & Chat</span>
              <ChevronRight class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Package, Loader2, ChevronRight } from 'lucide-vue-next';
import type { Order } from '~/types';

const supabase = useB2BSupabaseClient();
const { profile, company, user } = useB2BAuth();

const orders = ref<Order[]>([]);
const loading = ref(true);

onMounted(async () => {
  if (!user.value) return;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      orders.value = data as Order[];
    }
  } catch (err) {
    console.error('Error fetching dashboard orders:', err);
  } finally {
    loading.value = false;
  }
});
</script>
