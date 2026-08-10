<template>
  <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
    <!-- Breadcrumb Nav -->
    <div class="flex items-center gap-2 text-xs font-semibold text-slate-400">
      <NuxtLink to="/app/dashboard" class="hover:text-white">Portal Distribuidor</NuxtLink>
      <span>/</span>
      <span class="text-brand-400">Orden #{{ order?.order_number }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 text-brand-400 animate-spin" />
    </div>

    <div v-else-if="order" class="space-y-8">
      <!-- Order Header Banner -->
      <div class="glass-panel p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-3xl font-extrabold text-white">Orden de Compra #{{ order.order_number }}</h1>
            <UIStatusBadge :status="order.status" />
          </div>
          <p class="text-xs text-slate-400 font-mono mt-1">
            Emitida el {{ new Date(order.created_at).toLocaleDateString('es-VE') }} • ID: {{ order.id }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Download PDF Proforma Button -->
          <a
            :href="`/api/pdf/generate-po?id=${order.id}`"
            target="_blank"
            class="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/20 transition-all flex items-center gap-2"
          >
            <Download class="w-4 h-4" />
            <span>Descargar Proforma PDF</span>
          </a>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left Column: Items & Payment Receipt -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Order Items Card -->
          <div class="glass-panel border border-slate-800 overflow-hidden">
            <div class="p-5 border-b border-slate-800 font-bold text-white text-sm">
              Productos Solicitados
            </div>
            <div class="divide-y divide-slate-800">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="p-4 flex items-center justify-between gap-4"
              >
                <div class="flex items-center gap-3">
                  <img
                    :src="item.product?.images[0] || 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80'"
                    class="w-14 h-14 rounded-lg object-cover bg-slate-900 border border-slate-800"
                  />
                  <div>
                    <h4 class="font-bold text-white text-xs">{{ item.product?.name }}</h4>
                    <span class="text-[10px] text-slate-400 font-mono">SKU: {{ item.product?.sku }}</span>
                  </div>
                </div>

                <div class="text-right">
                  <span class="text-xs text-slate-300 font-semibold">{{ item.quantity }} ud x ${{ item.unit_price }}</span>
                  <span class="font-bold text-white block text-sm">${{ item.total_price }} USD</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Upload Payment Proof Box -->
          <div class="glass-panel p-6 space-y-4 border border-slate-800">
            <h3 class="font-bold text-white text-sm">Comprobante de Pago o Transferencia</h3>
            <p class="text-xs text-slate-400">
              Si tu método de pago es Transferencia o Depósito, adjunta aquí la captura o comprobante en PDF/Imagen.
            </p>

            <div v-if="order.payment_receipt_url" class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
              <span class="text-emerald-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 class="w-4 h-4" /> Comprobante Cargado Exitosamente
              </span>
              <a :href="order.payment_receipt_url" target="_blank" class="text-brand-400 hover:underline font-bold">Ver Comprobante</a>
            </div>

            <B2BDocumentUploader
              v-else
              label="Subir Comprobante de Pago (PDF / Imagen)"
              bucket="payment-proofs"
              :required="false"
              @uploaded="handlePaymentReceiptUploaded"
            />
          </div>
        </div>

        <!-- Right Column: Summary & Realtime Chat Thread -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Summary Box -->
          <div class="glass-panel p-6 space-y-4 border border-slate-800">
            <h3 class="font-bold text-white text-sm border-b border-slate-800 pb-3">Resumen Económico</h3>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span class="font-bold text-white">${{ order.subtotal }} USD</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>IVA (16%):</span>
                <span class="font-bold text-white">${{ order.tax_amount }} USD</span>
              </div>
              <div class="flex justify-between text-slate-300">
                <span>Flete / Logística:</span>
                <span class="font-bold text-brand-400">${{ order.shipping_cost }} USD</span>
              </div>
              <div class="pt-3 border-t border-slate-800 flex justify-between items-baseline text-base">
                <span class="font-bold text-white">Total:</span>
                <span class="font-heading font-black text-xl text-brand-400">${{ order.total }} USD</span>
              </div>
            </div>
          </div>

          <!-- Live Chat Thread Component -->
          <ChatRealtimeThread
            :order-id="order.id"
            :current-user-id="user?.id || ''"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Loader2, Download, CheckCircle2 } from 'lucide-vue-next';
import type { Order } from '~/types';

definePageMeta({
  middleware: 'auth-global',
});

const route = useRoute();
const supabase = useSupabaseClient();
const { user } = useB2BAuth();

const order = ref<Order | null>(null);
const loading = ref(true);

const fetchOrder = async () => {
  try {
    loading.value = true;
    const orderId = route.params.id as string;
    const { data, error } = await supabase
      .from('orders')
      .select('*, company:companies(*), profile:profiles(*), items:order_items(*, product:products(*))')
      .eq('id', orderId)
      .single();

    if (!error && data) {
      order.value = data as Order;
    }
  } catch (err) {
    console.error('Error fetching order detail:', err);
  } finally {
    loading.value = false;
  }
};

const handlePaymentReceiptUploaded = async (url: string) => {
  if (!order.value) return;
  await supabase
    .from('orders')
    .update({ payment_receipt_url: url, status: 'awaiting_payment' })
    .eq('id', order.value.id);

  order.value.payment_receipt_url = url;
  order.value.status = 'awaiting_payment';
};

onMounted(() => {
  fetchOrder();
});
</script>
