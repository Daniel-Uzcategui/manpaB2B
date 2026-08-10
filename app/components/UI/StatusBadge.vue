<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm',
      badgeClass
    ]"
  >
    <span class="w-2 h-2 rounded-full" :class="dotClass"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import type { OrderStatus, UserRole } from '~/types';

const props = defineProps({
  status: {
    type: String as () => OrderStatus | UserRole | string,
    required: true,
  },
});

const labelMap: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente de Aprobación',
  awaiting_payment: 'Esperando Pago',
  paid: 'Pago Verificado',
  processing: 'En Preparación',
  dispatched: 'Despachado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  admin: 'Administrador',
  distributor_pending: 'Revisión Pendiente',
  distributor_approved: 'Distribuidor Aprobado',
  distributor_rejected: 'Rechazado',
};

const badgeClassMap: Record<string, string> = {
  draft: 'bg-slate-800 text-slate-300 border-slate-700',
  pending_approval: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  awaiting_payment: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  paid: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  processing: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  dispatched: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  completed: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50',
  cancelled: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  distributor_pending: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  distributor_approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  distributor_rejected: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
};

const dotClassMap: Record<string, string> = {
  draft: 'bg-slate-400',
  pending_approval: 'bg-amber-400 animate-pulse',
  awaiting_payment: 'bg-sky-400',
  paid: 'bg-emerald-400',
  processing: 'bg-purple-400 animate-spin',
  dispatched: 'bg-indigo-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-rose-400',
  admin: 'bg-purple-400',
  distributor_pending: 'bg-amber-400 animate-pulse',
  distributor_approved: 'bg-emerald-400',
  distributor_rejected: 'bg-rose-400',
};

const label = computed(() => labelMap[props.status] || props.status);
const badgeClass = computed(() => badgeClassMap[props.status] || 'bg-slate-800 text-slate-300 border-slate-700');
const dotClass = computed(() => dotClassMap[props.status] || 'bg-slate-400');
</script>
