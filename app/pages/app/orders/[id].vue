<template>
  <div class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 bg-[#F7F9FB] min-h-screen">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 text-brand-600 animate-spin" />
    </div>

    <!-- Order Content -->
    <div v-else-if="order" class="space-y-8">
      <!-- Order Header Banner -->
      <div class="purity-card p-8 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="font-mono font-black text-2xl text-brand-900">Orden #{{ order.id.slice(0, 8) }}</span>
            <B2BStatusBadge :status="order.status" />
          </div>
          <p class="text-xs text-slate-500 font-mono">
            Emisión: {{ new Date(order.created_at).toLocaleString('es-VE') }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            :href="`/api/pdf/generate-po?orderId=${order.id}`"
            target="_blank"
            class="btn-secondary py-2.5 px-4 text-xs"
          >
            <FileText class="w-4 h-4" />
            <span>Descargar Proforma PDF</span>
          </a>
        </div>
      </div>

      <!-- Main 2-Column Section: Items & Realtime Chat -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left 2 Cols: Items & Pricing -->
        <div class="lg:col-span-2 space-y-6">
          <div class="purity-card p-6 bg-white space-y-4">
            <h3 class="font-extrabold text-brand-900 text-lg border-b border-[#E2E8F0] pb-3">
              Detalle de Productos Solicitados
            </h3>

            <div class="divide-y divide-[#E2E8F0]">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="py-4 flex items-center justify-between gap-4"
              >
                <div class="space-y-1">
                  <span class="text-[10px] font-bold text-brand-600 uppercase font-mono">{{ item.product?.category }}</span>
                  <h4 class="font-bold text-brand-900 text-sm">{{ item.product?.name }}</h4>
                  <p class="text-xs text-slate-500 font-mono">
                    {{ item.quantity }} empaques x ${{ item.unit_price.toFixed(2) }} USD
                  </p>
                </div>

                <div class="text-right">
                  <span class="font-mono font-black text-brand-900 text-base">${{ item.subtotal.toFixed(2) }} USD</span>
                </div>
              </div>
            </div>

            <!-- Order Total Summary -->
            <div class="pt-4 border-t border-[#E2E8F0] space-y-2 text-xs font-semibold text-slate-600">
              <div class="flex justify-between">
                <span>Subtotal Empaques</span>
                <span class="font-mono text-brand-900">${{ order.subtotal.toFixed(2) }} USD</span>
              </div>
              <div class="flex justify-between">
                <span>IVA (16%)</span>
                <span class="font-mono text-brand-900">${{ order.tax_amount.toFixed(2) }} USD</span>
              </div>
              <div class="pt-2 border-t border-[#E2E8F0] flex justify-between items-baseline">
                <span class="font-bold text-brand-900 text-sm">Total Orden de Compra</span>
                <span class="font-heading font-black text-2xl text-brand-900">${{ order.total_amount.toFixed(2) }} USD</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right 1 Col: Realtime Thread -->
        <div>
          <ChatRealtimeThread :order-id="order.id" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Loader2, FileText } from 'lucide-vue-next';

const route = useRoute();
const supabase = useB2BSupabaseClient();

const order = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const orderId = route.params.id as string;
    const { data, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(*))')
      .eq('id', orderId)
      .single();

    if (!error && data) {
      order.value = data;
    }
  } catch (err) {
    console.error('Error fetching order details:', err);
  } finally {
    loading.value = false;
  }
});
</script>
