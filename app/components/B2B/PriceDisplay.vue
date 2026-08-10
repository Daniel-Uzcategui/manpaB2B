<template>
  <div class="inline-flex flex-col">
    <!-- Unauthenticated or Pending Visitors: Hide Prices & Display CTA -->
    <template v-if="!isApprovedDistributor && !isAdmin">
      <NuxtLink
        to="/auth/register"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-50 text-accent-600 border border-accent-200 font-bold text-xs hover:bg-accent-500 hover:text-white transition-all shadow-sm group"
      >
        <Lock class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span>Registrarse para precios mayoristas</span>
      </NuxtLink>
    </template>

    <!-- Approved Distributors or Admin: Show Prices in USD and optional VES -->
    <template v-else>
      <div class="flex items-baseline gap-2">
        <span class="font-heading font-extrabold text-brand-900 text-xl">
          ${{ formatNumber(price) }}
        </span>
        <span class="text-xs font-bold text-slate-500">USD</span>

        <!-- Original Price strike-through if discounted -->
        <span v-if="originalPrice && originalPrice > price" class="text-xs text-slate-400 line-through">
          ${{ formatNumber(originalPrice) }}
        </span>
      </div>

      <!-- Equivalent in VES (Optional local currency calculated at 36.50 BCV) -->
      <span v-if="showVes" class="text-xs text-slate-500 font-medium">
        Bs. {{ formatNumber(price * vesRate) }} VES
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Lock } from 'lucide-vue-next';

const props = defineProps({
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
    default: null,
  },
  showVes: {
    type: Boolean,
    default: true,
  },
  vesRate: {
    type: Number,
    default: 36.50,
  },
});

const { isApprovedDistributor, isAdmin } = useB2BAuth();

const formatNumber = (val: number) => {
  return val.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
</script>
