<template>
  <div class="min-h-screen py-20 px-4 flex items-center justify-center">
    <div class="glass-panel w-full max-w-lg p-10 text-center space-y-6 border border-amber-500/30 relative">
      <div class="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
        <Clock class="w-8 h-8 animate-pulse" />
      </div>

      <div class="space-y-2">
        <span class="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">Estado: Revisión Pendiente</span>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white">Solicitud de Cuenta en Evaluación</h1>
        <p class="text-slate-300 text-sm leading-relaxed">
          Hemos recibido la documentación de tu empresa <strong class="text-white">{{ company?.legal_name || 'registrada' }}</strong>. Nuestro equipo de ventas corporativas está verificando la validez del RIF y Registro Mercantil.
        </p>
      </div>

      <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 text-left space-y-2 font-mono">
        <div class="flex justify-between">
          <span>Representante:</span>
          <span class="text-slate-200">{{ profile?.full_name }}</span>
        </div>
        <div class="flex justify-between">
          <span>RIF Registrado:</span>
          <span class="text-slate-200">{{ company?.tax_id }}</span>
        </div>
        <div class="flex justify-between">
          <span>Tiempo estimado:</span>
          <span class="text-amber-400">24 a 48 horas hábiles</span>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-800 flex justify-center gap-4">
        <button
          @click="logout"
          class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock } from 'lucide-vue-next';

definePageMeta({
  middleware: 'auth-global',
});

const { profile, company, logout } = useB2BAuth();
</script>
